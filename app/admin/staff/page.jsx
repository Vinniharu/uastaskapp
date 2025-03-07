"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/app/components/AdminLayout";
import { useAuthCheck } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Search, MoreHorizontal, UserPlus, Filter } from "lucide-react";
import { getAllStaff, updateStaffStatus, registerStaff } from "@/lib/api";

export default function StaffManagement() {
  const [staffData, setStaffData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newStaffData, setNewStaffData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "password123", // Default password for admin-created accounts
    staffId: "",
    department: "Development",
    isActive: true,
    isFired: false,
    joinDate: new Date().toISOString().split("T")[0],
  });

  // Check if user is authenticated, redirect to login if not
  // For admin routes, redirect to admin login
  const isAuthenticated = useAuthCheck("/admin/login");

  // Fetch staff data on component mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchStaffData();
    }
  }, [isAuthenticated]);

  // Fetch staff data from API
  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllStaff();
      setStaffData(data);
      setError("");
    } catch (err) {
      console.error("Error fetching staff data:", err);
      setError("Failed to load staff data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter staff based on search term and filters
  const filteredStaff = staffData.filter((staff) => {
    const matchesSearch =
      staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.staffId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && staff.isActive) ||
      (statusFilter === "inactive" && !staff.isActive) ||
      (statusFilter === "fired" && staff.isFired);

    const matchesDepartment =
      departmentFilter === "all" || staff.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Handle status change (active/inactive)
  const handleActiveStatusChange = async (staffId, isActive) => {
    try {
      // Call API to update staff status
      await updateStaffStatus(staffId, { isActive });
      
      // Update local state
      setStaffData(
        staffData.map((staff) =>
          staff.id === staffId ? { ...staff, isActive } : staff
        )
      );
    } catch (err) {
      console.error("Error updating staff status:", err);
      setError("Failed to update staff status. Please try again.");
    }
  };

  // Handle fired status change
  const handleFiredStatusChange = async (staffId, isFired) => {
    try {
      // If firing, also set isActive to false
      const statusUpdate = {
        isFired,
        isActive: isFired ? false : staffData.find(s => s.id === staffId).isActive,
        terminationDate: isFired ? new Date().toISOString() : null,
      };
      
      // Call API to update staff status
      await updateStaffStatus(staffId, statusUpdate);
      
      // Update local state
      setStaffData(
        staffData.map((staff) =>
          staff.id === staffId
            ? {
                ...staff,
                ...statusUpdate,
              }
            : staff
        )
      );
    } catch (err) {
      console.error("Error updating staff fired status:", err);
      setError("Failed to update staff status. Please try again.");
    }
  };

  // Handle adding new staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare registration data according to the required format
      const registrationData = {
        email: newStaffData.email,
        password: newStaffData.password,
        firstName: newStaffData.firstName,
        lastName: newStaffData.lastName,
      };
      
      // Call API to register new staff
      const response = await registerStaff(registrationData);
      
      // Create a complete staff object for the local state
      const newStaff = {
        ...response.user,
        id: response.user.id,
        staffId: response.user.staffId || newStaffData.staffId || generateStaffId(),
        department: newStaffData.department,
        isActive: newStaffData.isActive,
        isFired: newStaffData.isFired,
        joinDate: newStaffData.joinDate,
        role: response.user.role || 'staff',
      };
      
      // Add the new staff to the local state
      setStaffData([...staffData, newStaff]);
      
      // Reset form
      setNewStaffData({
        firstName: "",
        lastName: "",
        email: "",
        password: "password123", // Default password for admin-created accounts
        staffId: "",
        department: "Development",
        isActive: true,
        isFired: false,
        joinDate: new Date().toISOString().split("T")[0],
      });
      
      setIsAddStaffDialogOpen(false);
    } catch (err) {
      console.error("Error adding staff:", err);
      setError(err.message || "Failed to add staff. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique departments for filter
  const departments = ["all", ...new Set(staffData.map((staff) => staff.department))];

  // Helper function to generate a staff ID if none is provided
  const generateStaffId = () => {
    // Generate a random staff ID based on timestamp and random numbers
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `S${timestamp}${random}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Staff</DialogTitle>
                <DialogDescription>
                  Enter the details of the new staff member.
                </DialogDescription>
              </DialogHeader>
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleAddStaff} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newStaffData.firstName}
                      onChange={(e) =>
                        setNewStaffData({
                          ...newStaffData,
                          firstName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newStaffData.lastName}
                      onChange={(e) =>
                        setNewStaffData({
                          ...newStaffData,
                          lastName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStaffData.email}
                    onChange={(e) =>
                      setNewStaffData({
                        ...newStaffData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffId">Staff ID</Label>
                  <Input
                    id="staffId"
                    value={newStaffData.staffId}
                    onChange={(e) =>
                      setNewStaffData({
                        ...newStaffData,
                        staffId: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={newStaffData.department}
                    onValueChange={(value) =>
                      setNewStaffData({
                        ...newStaffData,
                        department: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joinDate">Join Date</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={newStaffData.joinDate}
                    onChange={(e) =>
                      setNewStaffData({
                        ...newStaffData,
                        joinDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={newStaffData.isActive}
                    onCheckedChange={(checked) =>
                      setNewStaffData({
                        ...newStaffData,
                        isActive: checked,
                      })
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Staff"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Status</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="fired">Fired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[150px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Department</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.filter(d => d !== "all").map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          {isLoading && staffData.length === 0 ? (
            <div className="p-8 text-center">
              <p>Loading staff data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-center">Fired</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No staff members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {staff.firstName} {staff.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {staff.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{staff.staffId}</TableCell>
                      <TableCell>{staff.department}</TableCell>
                      <TableCell>
                        {staff.isFired ? (
                          <Badge variant="destructive">Fired</Badge>
                        ) : staff.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{new Date(staff.joinDate).toLocaleDateString()}</div>
                        {staff.terminationDate && (
                          <div className="text-sm text-muted-foreground">
                            Terminated: {new Date(staff.terminationDate).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={staff.isActive}
                          onCheckedChange={(checked) => handleActiveStatusChange(staff.id, checked)}
                          disabled={staff.isFired || isLoading}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={staff.isFired}
                          onCheckedChange={(checked) => handleFiredStatusChange(staff.id, checked)}
                          disabled={isLoading}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Staff</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Delete Staff
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 