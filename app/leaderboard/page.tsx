"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Medal, Award, TrendingUp, Users, Eye, EyeOff, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function Leaderboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const PASSING_SCORE = 60;

  useEffect(() => {
    // Check if student is logged in
    const studentUser = localStorage.getItem("studentUser");
    if (!studentUser) {
      window.location.href = "/login";
      return;
    }
    
    const user = JSON.parse(studentUser);
    setCurrentUser(user);
    
    // Load students data with year level filter
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const studentUser = localStorage.getItem("studentUser");
    if (!studentUser) return;
    
    const user = JSON.parse(studentUser);
    const userYearLevel = user.year_level;
    
    const { data } = await supabase
      .from("students")
      .select(`
        *,
        users (
          username,
          role
        )
      `)
      .eq("year_level", userYearLevel)
      .order("score", { ascending: false });
    setStudents(data || []);
    setLoading(false);
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
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Scores</h1>
                <p className="text-sm text-gray-600">
                  {currentUser?.year_level || 'All'} Students
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setLogoutDialogOpen(true)}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>



          <Table className="bg-white rounded-lg border border-gray-200">
            <TableHeader className="bg-gray-50 border-b">
              <TableRow>
                <TableHead className="w-16 text-center font-medium text-gray-700">Rank</TableHead>
                <TableHead className="font-medium text-gray-700">ID Number</TableHead>
                <TableHead className="text-right font-medium text-gray-700">Exam Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.map((student, index, arr) => {
                let rank = index + 1;
                if (index > 0 && student.score === arr[index - 1].score) {
                  rank = arr[index - 1].calculatedRank || rank;
                }
                student.calculatedRank = rank;
                const isTop3 = rank <= 3;
                
                return (
                  <TableRow 
                    key={student.id} 
                    className={`border-b ${isTop3 ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                  >
                    <TableCell className="text-center">
                      <span className={`font-semibold ${isTop3 ? 'text-lg' : ''}`}>
                        {rank === 1 ? (
                          <span className="flex items-center justify-center gap-1">
                            <Trophy className="w-5 h-5 text-yellow-500 inline" />
                            <span className="text-sm">1st</span>
                          </span>
                        ) : rank === 2 ? (
                          <span className="flex items-center justify-center gap-1">
                            <Medal className="w-5 h-5 text-gray-400 inline" />
                            <span className="text-sm">2nd</span>
                          </span>
                        ) : rank === 3 ? (
                          <span className="flex items-center justify-center gap-1">
                            <Award className="w-5 h-5 text-amber-600 inline" />
                            <span className="text-sm">3rd</span>
                          </span>
                        ) : (
                          rank
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {isTop3 && (
                        <span className="inline-block w-2 h-2 rounded-full mr-2 bg-yellow-400"></span>
                      )}
                      {isTop3 ? student.name : (student.users?.username || student.name)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {student.score}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableCaption className="text-gray-600 py-4">
              <div className="flex flex-col items-center justify-center gap-2">
                <span>Total <span className="font-bold text-gray-900">{students?.length || 0}</span> students</span>
              </div>
            </TableCaption>
          </Table>

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
                Are you sure you want to logout? You will need to login again to access the leaderboard.
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
