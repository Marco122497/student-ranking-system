"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreHorizontalIcon, Trophy, Users, Settings, LogOut, Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function Admin() {
  const [name, setName] = useState("");
  const [semiFinal, setSemiFinal] = useState("");
  const [finalExam, setFinalExam] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("BSCS-3");
  const [scoreType, setScoreType] = useState<"semi_final" | "final_exam">("semi_final");
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editSemiFinal, setEditSemiFinal] = useState("");
  const [editFinalExam, setEditFinalExam] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editYearLevel, setEditYearLevel] = useState("");

  useEffect(() => {
    // Check if admin is logged in
    const user = localStorage.getItem("adminUser");
    if (!user) {
      window.location.href = "/login";
      return;
    }

    // Load students data
    loadStudents();
  }, []);

  // Filter students based on selected year level
  useEffect(() => {
    setFilteredStudents(students.filter(student => student.year_level === selectedYearFilter));
  }, [students, selectedYearFilter]);

  // Sort students based on selected score type
  useEffect(() => {
    const sorted = [...filteredStudents].sort((a, b) => b[scoreType] - a[scoreType]);
    setFilteredStudents(sorted);
  }, [scoreType]);

  // Load students data with user information
  const loadStudents = async () => {
    const { data } = await supabase
      .from("students")
      .select(`
        *,
        users (
          username,
          role
        )
      `)
      .order("semi_final", { ascending: false });
    setStudents(data || []);
  };

  const deleteStudent = async (id: string) => {
    // First get the student to find the user_id
    const { data: student } = await supabase
      .from("students")
      .select("user_id")
      .eq("id", id)
      .single();
    
    // Delete student record
    await supabase.from("students").delete().eq("id", id);
    
    // Delete associated user record
    if (student?.user_id) {
      await supabase.from("users").delete().eq("id", student.user_id);
    }
    
    setDeleteDialogOpen(false);
    loadStudents();
    toast.success("Student deleted successfully!");
  };

  const startEdit = (student: any) => {
    setSelectedStudent(student);
    setEditName(student.name);
    setEditSemiFinal(student.semi_final?.toString() || "");
    setEditFinalExam(student.final_exam?.toString() || "");
    setEditUsername(student.users?.username || "");
    setEditPassword(""); // Clear password field for security
    setEditYearLevel(student.year_level || "");
    setEditDialogOpen(true);
  };

  const saveEdit = async () => {
    // Update student record
    await supabase
      .from("students")
      .update({ name: editName, semi_final: Number(editSemiFinal), final_exam: Number(editFinalExam) || null, year_level: editYearLevel })
      .eq("id", selectedStudent.id);
    
    // Update associated user record (only if password is provided)
    if (selectedStudent.user_id) {
      const updateData: any = { username: editUsername };
      if (editPassword) {
        updateData.password = editPassword;
      }
      await supabase
        .from("users")
        .update(updateData)
        .eq("id", selectedStudent.user_id);
    }
    
    setEditDialogOpen(false);
    setEditName("");
    setEditSemiFinal("");
    setEditFinalExam("");
    setEditUsername("");
    setEditPassword("");
    setEditYearLevel("");
    setSelectedStudent(null);
    loadStudents();
    toast.success("Student updated successfully!");
  };

  const startDelete = (student: any) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  const handleLogout = () => {
    toast.success("Logged out successfully!");
    localStorage.removeItem("adminUser");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };

  const addStudent = async () => {
    if (!name || !semiFinal || !username || !password || !yearLevel) {
      toast.error("Please fill all fields");
      return;
    }

    setIsAddingStudent(true);
    try {
      // First create user record
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert([
          { username, password, role: 'student' }
        ])
        .select()
        .single();

      if (userError) {
        toast.error("Error creating user: " + userError.message);
        return;
      }

      // Then create student record linked to user
      const { error: studentError } = await supabase.from("students").insert([
        { 
          name, 
          semi_final: Number(semiFinal), 
          final_exam: Number(finalExam) || null,
          year_level: yearLevel,
          user_id: userData.id
        },
      ]);

      if (studentError) {
        toast.error("Error creating student record: " + studentError.message);
        // Clean up the user record if student creation fails
        await supabase.from("users").delete().eq("id", userData.id);
        return;
      }
      
      toast.success("Student added successfully!");
      // Clear all form fields
      setName("");
      setSemiFinal("");
      setFinalExam("");
      setUsername("");
      setPassword("");
      setYearLevel("");
      loadStudents();
    } catch (error: any) {
      toast.error("An unexpected error occurred: " + error.message);
    } finally {
      setIsAddingStudent(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-gray-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <Button variant="outline" onClick={() => setLogoutDialogOpen(true)}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Add Student Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Add Student Score</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Student Name</label>
              <Input
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Semi-Final Score</label>
              <Input
                placeholder="Semi-Final Score"
                type="number"
                value={semiFinal}
                onChange={(e) => setSemiFinal(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Final Exam Score</label>
              <Input
                placeholder="Final Exam Score (optional)"
                type="number"
                value={finalExam}
                onChange={(e) => setFinalExam(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Username</label>
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <div className="relative">
                <Input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Year Level</label>
              <NativeSelect value={yearLevel} onChange={(e) => setYearLevel(e.target.value)}>
                <NativeSelectOption value="">Select year level</NativeSelectOption>
                <NativeSelectOption value="BSCS-3">BSCS-3</NativeSelectOption>
                <NativeSelectOption value="Set A">BSCS-2 (Set A)</NativeSelectOption>
                <NativeSelectOption value="Set B">BSCS-2 (Set B)</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="flex items-end">
              <Button onClick={addStudent} className="w-full" disabled={isAddingStudent}>
                {isAddingStudent ? "Adding Student..." : "Add Student"}
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Year Level:</label>
            <NativeSelect value={selectedYearFilter} onChange={(e) => setSelectedYearFilter(e.target.value)}>
              <NativeSelectOption value="BSCS-3">BSCS-3</NativeSelectOption>
              <NativeSelectOption value="Set A">BSCS-2 (Set A)</NativeSelectOption>
              <NativeSelectOption value="Set B">BSCS-2 (Set B)</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Exam Type:</label>
            <Select value={scoreType} onValueChange={(value: "semi_final" | "final_exam") => setScoreType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semi_final">Semi-Final</SelectItem>
                <SelectItem value="final_exam">Final Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Students Table */}
        <Table className="bg-white rounded-lg border border-gray-200">
          <TableHeader className="bg-gray-50 border-b">
            <TableRow>
              <TableHead className="w-16 text-center font-medium text-gray-700">Rank</TableHead>
              <TableHead className="font-medium text-gray-700">Student Name</TableHead>
              <TableHead className="font-medium text-gray-700">Username</TableHead>
              <TableHead className="font-medium text-gray-700">Year Level</TableHead>
              <TableHead className="text-right font-medium text-gray-700">
                {scoreType === "semi_final" ? "Semi-Final" : "Final Exam"}
              </TableHead>
              <TableHead className="w-16 text-center font-medium text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents?.map((student, index, arr) => {
              let rank = index + 1;
              if (index > 0 && student[scoreType] === arr[index - 1][scoreType]) {
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
                      {rank === 1 ? <Trophy className="w-5 h-5 text-yellow-500 inline" /> : 
                       rank === 2 ? <Trophy className="w-5 h-5 text-gray-400 inline" /> : 
                       rank === 3 ? <Trophy className="w-5 h-5 text-amber-600 inline" /> : 
                       rank}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {isTop3 && (
                      <span className="inline-block w-2 h-2 rounded-full mr-2 bg-yellow-400"></span>
                    )}
                    {student.name}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {student.users?.username || 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.year_level === 'Set A' ? 'bg-blue-100 text-blue-800' :
                      student.year_level === 'Set B' ? 'bg-green-100 text-green-800' :
                      student.year_level === 'BSCS-3' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {student.year_level || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-gray-900">
                    {scoreType === "semi_final" ? student.semi_final : student.final_exam ?? '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontalIcon />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(student)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => startDelete(student)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableCaption className="text-gray-600 py-4">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <span>Total {filteredStudents?.length || 0} students</span>
            </div>
          </TableCaption>
        </Table>

        {/* Edit Dialog */}
        <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Student</AlertDialogTitle>
              <AlertDialogDescription>
                Update the student's information below.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium">Name</label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-semi-final" className="text-sm font-medium">Semi-Final Score</label>
                <Input
                  id="edit-semi-final"
                  type="number"
                  value={editSemiFinal}
                  onChange={(e) => setEditSemiFinal(e.target.value)}
                  placeholder="Enter semi-final score"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-final-exam" className="text-sm font-medium">Final Exam Score</label>
                <Input
                  id="edit-final-exam"
                  type="number"
                  value={editFinalExam}
                  onChange={(e) => setEditFinalExam(e.target.value)}
                  placeholder="Enter final exam score (optional)"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-username" className="text-sm font-medium">Username</label>
                <Input
                  id="edit-username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showEditPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                  >
                    {showEditPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-program" className="text-sm font-medium">Year Level</label>
                <NativeSelect value={editYearLevel} onChange={(e) => setEditYearLevel(e.target.value)}>
                  <NativeSelectOption value="">Select year level</NativeSelectOption>
                  <NativeSelectOption value="BSCS-3">BSCS-3</NativeSelectOption>
                  <NativeSelectOption value="Set A">BSCS-2 (Set A)</NativeSelectOption>
                  <NativeSelectOption value="Set B">BSCS-2 (Set B)</NativeSelectOption>
                </NativeSelect>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={saveEdit}>Save Changes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedStudent?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedStudent && deleteStudent(selectedStudent.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to login again to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>CKCM Student Score System</p>
        </div>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
