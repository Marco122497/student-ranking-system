"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [yearLevel, setYearLevel] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!yearLevel) {
      toast.error("Please select a year level")
      setLoading(false)
      return
    }

    try {
      // Custom authentication using users table
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password) // Note: In production, you should hash passwords
        .single()

      if (error || !user) {
        toast.error("Invalid username or password")
      } else {
        // Store user info in localStorage based on role
        if (user.role === 'admin') {
          localStorage.setItem("adminUser", JSON.stringify(user))
          toast.success("Welcome back, Admin!")
          setTimeout(() => {
            window.location.href = "/admin"
          }, 1000)
        } else if (user.role === 'student') {
          // Fetch the student's year level from students table
          const { data: studentData, error: studentError } = await supabase
            .from("students")
            .select("year_level, name")
            .eq("user_id", user.id)
            .single()
          
          if (studentError || !studentData) {
            toast.error("Student record not found")
            setLoading(false)
            return
          }
          
          // Validate selected year level matches stored year level
          if (studentData.year_level !== yearLevel) {
            toast.error(`Invalid year level. You are assigned to: ${studentData.year_level}`)
            setLoading(false)
            return
          }
          
          const studentUserWithYearLevel = {
            ...user,
            year_level: studentData.year_level,
            name: studentData.name
          }
          
          localStorage.setItem("studentUser", JSON.stringify(studentUserWithYearLevel))
          toast.success("Login Successfully")
          setTimeout(() => {
            window.location.href = "/leaderboard"
          }, 1000)
        } else {
          toast.error("Invalid user role")
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            The Creator of this system is Handsome
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="yearLevel">Year Level</FieldLabel>
                <Select value={yearLevel} onValueChange={setYearLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your year level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Set A">Set A</SelectItem>
                    <SelectItem value="Set B">Set B</SelectItem>
                    <SelectItem value="BSCS-3">BSCS-3</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">

      </FieldDescription>
      <div className="text-center mt-4 text-gray-500 text-sm">
        <p>CKCM Student Score System</p>
        <p>This system is powered by <span className="font-semibold text-gray-700">MarcoD Solutions</span> © 2026</p>
      </div>
      <Toaster position="top-center" />
    </div>
  )
}
