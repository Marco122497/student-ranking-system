"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trophy, User, LogOut, TrendingUp, Target } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [updateScore, setUpdateScore] = useState("");
  const [updating, setUpdating] = useState(false);
  const [scoreType, setScoreType] = useState<"semi_final" | "final_exam">("final_exam");

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    const studentUser = localStorage.getItem("studentUser");
    if (!studentUser) {
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(studentUser);
      console.log("User data from localStorage:", user);
      
      // Try different approaches to find the student
      let { data, error } = await supabase
        .from("students")
        .select(`
          *,
          users (
            username,
            role
          )
        `)
        .eq("id", user.id)
        .single();

      if (error || !data) {
        console.log("Trying with user_id field...");
        // Try with user_id field instead
        const { data: data2, error: error2 } = await supabase
          .from("students")
          .select(`
            *,
            users (
              username,
              role
            )
          `)
          .eq("user_id", user.id)
          .single();
        
        if (error2 || !data2) {
          console.log("Trying with username lookup...");
          // Try with username from users table
          const { data: data3, error: error3 } = await supabase
            .from("students")
            .select(`
              *,
              users (
                username,
                role
              )
            `)
            .eq("username", user.username)
            .single();
          
          if (error3 || !data3) {
            throw new Error(`Student not found. Tried id: ${user.id}, user_id: ${user.id}, username: ${user.username}`);
          }
          setStudentData(data3);
        } else {
          setStudentData(data2);
        }
      } else {
        setStudentData(data);
      }
    } catch (error: any) {
      console.error("Error loading student data:", error);
      toast.error(`Failed to load your data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = async () => {
    if (!updateScore.trim()) {
      toast.error("Please enter a score");
      return;
    }

    const score = parseInt(updateScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Score must be between 0 and 100");
      return;
    }

    setUpdating(true);
    try {
      const user = JSON.parse(localStorage.getItem("studentUser") || "{}");
      
      // Find correct student record
      let studentId = studentData.id;
      
      // Update the appropriate column based on score type
      const updateData = scoreType === "final_exam" 
        ? { final_exam: score }
        : { semi_final: score };
      
      const { error } = await supabase
        .from("students")
        .update(updateData)
        .eq("id", studentId);

      if (error) throw error;

      toast.success(`${scoreType === "final_exam" ? "Final Exam" : "Semi-Final"} score updated successfully!`);
      setUpdateScore("");
      
      // Reload student data to show updated score
      await loadStudentData();
    } catch (error: any) {
      console.error("Error updating score:", error);
      toast.error(`Failed to update score: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("studentUser");
    toast.success("Logged out successfully!");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading your score...</div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Student data not found</div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 54) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 85) return "Excellent! Outstanding performance!";
    if (score >= 70) return "Great job! Keep up the good work!";
    if (score >= 54) return "Good effort! Room for improvement.";
    return "Keep working hard! You can do better!";
  };

  const getCurrentScore = () => {
    if (scoreType === "final_exam") {
      return studentData?.final_exam || 0;
    }
    return studentData?.semi_final || 0;
  };

  const isAdmin = () => {
    const user = JSON.parse(localStorage.getItem("studentUser") || "{}");
    return user.role === "admin";
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-blue-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Score</h1>
                <p className="text-sm text-gray-600">
                  {studentData.year_level} Year Level
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {studentData.name} - {studentData.users?.username || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = "/leaderboard"}
            >
              <Trophy className="w-4 h-4 mr-2" />
              View Leaderboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLogoutDialogOpen(true)}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Score Display Card */}
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Target className="w-6 h-6 text-blue-500" />
                Your Exam Score
              </CardTitle>
              <CardDescription>
                Your performance in the recent examination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="mb-6">
                  <Select value={scoreType} onValueChange={(value: "semi_final" | "final_exam") => setScoreType(value)}>
                    <SelectTrigger className="w-48 mx-auto">
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semi_final">Semi-Final Exam</SelectItem>
                      <SelectItem value="final_exam">Final Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className={`text-6xl font-bold mb-4 ${getScoreColor(getCurrentScore())}`}>
                  {getCurrentScore()}
                </div>
                <div className="text-lg text-gray-700 mb-4">
                  {getScoreMessage(getCurrentScore())}
                </div>
                <div className="flex justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Keep improving!</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Score Card - Admin Only */}
          {isAdmin() && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Update Exam Score
                </CardTitle>
                <CardDescription>
                  Select exam type and enter score to update your record
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Exam Type</label>
                    <Select value={scoreType} onValueChange={(value: "semi_final" | "final_exam") => setScoreType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select exam type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semi_final">Semi-Final Exam</SelectItem>
                        <SelectItem value="final_exam">Final Exam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      placeholder={`Enter ${scoreType === "final_exam" ? "final" : "semi-final"} score (0-100)`}
                      value={updateScore}
                      onChange={(e) => setUpdateScore(e.target.value)}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleUpdateScore}
                      disabled={updating || !updateScore.trim()}
                      className="px-6"
                    >
                      {updating ? "Updating..." : "Update Score"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>CKCM Student Score System</p>
            <p>This system is powered by <span className="font-semibold text-gray-700">MarcoD Solutions</span> © 2026</p>
          </div>
        </div>

        {/* Logout Dialog */}
        <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to logout? You will need to login again to access your scores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setLogoutDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Toaster position="top-center" />
    </>
  );
}
