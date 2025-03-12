"use client";

import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/app/components/AdminLayout";
import { useAuthCheck } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { AlertCircle, Search, MoreHorizontal, UserPlus, Filter, Camera, Upload, X, Trash2, Pencil, Eye } from "lucide-react";
import { getAllStaff, updateStaffStatus, registerStaff } from "@/lib/api";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function StaffManagement() {
  const [staffData, setStaffData] = useState([
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      staffId: "S001",
      department: "Development",
      isActive: true,
      isFired: false,
      joinDate: "2023-01-15",
      photoUrl: "https://i.pravatar.cc/150?img=1",
      role: "staff"
    },
    {
      id: 2,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      staffId: "S002",
      department: "Design",
      isActive: true,
      isFired: false,
      joinDate: "2023-02-20",
      photoUrl: "https://i.pravatar.cc/150?img=2",
      role: "staff"
    },
    {
      id: 3,
      firstName: "Mike",
      lastName: "Johnson",
      email: "mike.j@example.com",
      staffId: "S003",
      department: "Marketing",
      isActive: false,
      isFired: false,
      joinDate: "2023-03-10",
      photoUrl: "https://i.pravatar.cc/150?img=3",
      role: "staff"
    },
    {
      id: 4,
      firstName: "Sarah",
      lastName: "Williams",
      email: "sarah.w@example.com",
      staffId: "S004",
      department: "HR",
      isActive: true,
      isFired: false,
      joinDate: "2023-04-05",
      photoUrl: "https://i.pravatar.cc/150?img=4",
      role: "staff"
    },
    {
      id: 5,
      firstName: "David",
      lastName: "Brown",
      email: "david.b@example.com",
      staffId: "S005",
      department: "Finance",
      isActive: false,
      isFired: true,
      joinDate: "2023-05-01",
      terminationDate: "2023-12-15",
      photoUrl: "https://i.pravatar.cc/150?img=5",
      role: "staff"
    }
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
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
  const [crop, setCrop] = useState(null);
  const [imgSrc, setImgSrc] = useState('');
  const [showCropDialog, setShowCropDialog] = useState(false);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editStaffData, setEditStaffData] = useState(null);

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
      // Update local state immediately for better UX
      setStaffData(
        staffData.map((staff) =>
          staff.id === staffId ? { ...staff, isActive } : staff
        )
      );

      // Call API to update staff status
      await updateStaffStatus(staffId, { isActive });
    } catch (err) {
      // Revert the local state if the API call fails
      setStaffData(
        staffData.map((staff) =>
          staff.id === staffId ? { ...staff, isActive: !isActive } : staff
        )
      );
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

  // Handle photo selection
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result);
        setShowCropDialog(true);
      });
      reader.readAsDataURL(file);
    }
  };

  // Handle crop completion
  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const crop = makeAspectCrop(
      centerCrop({
        unit: '%',
        width: 90,
        height: 90,
      }),
      width / height,
      width,
      height
    );
    setCrop(crop);
  };

  // Handle crop change
  const onCropChange = (crop) => {
    setCrop(crop);
  };

  // Handle crop completion
  const handleCropComplete = () => {
    if (imgRef.current && crop && canvasRef.current) {
      const canvas = canvasRef.current;
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          setSelectedPhoto(blob);
          setPhotoPreview(canvas.toDataURL());
          setShowCropDialog(false);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  // Handle photo removal
  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle adding new staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('email', newStaffData.email);
      formData.append('password', newStaffData.password);
      formData.append('firstName', newStaffData.firstName);
      formData.append('lastName', newStaffData.lastName);
      formData.append('staffId', newStaffData.staffId);
      formData.append('department', newStaffData.department);
      formData.append('isActive', newStaffData.isActive);
      formData.append('isFired', newStaffData.isFired);
      formData.append('joinDate', newStaffData.joinDate);
      
      // Append photo if selected
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }
      
      // Call API to register new staff with photo
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to register staff');
      }
      
      const data = await response.json();
      
      // Create a complete staff object for the local state
      const newStaff = {
        ...data.user,
        id: data.user.id,
        staffId: data.user.staffId || newStaffData.staffId || generateStaffId(),
        department: newStaffData.department,
        isActive: newStaffData.isActive,
        isFired: newStaffData.isFired,
        joinDate: newStaffData.joinDate,
        role: data.user.role || 'staff',
        photoUrl: data.user.photoUrl || null,
      };
      
      // Add the new staff to the local state
      setStaffData([...staffData, newStaff]);
      
      // Reset form and photo
      setNewStaffData({
        firstName: "",
        lastName: "",
        email: "",
        password: "password123",
        staffId: "",
        department: "Development",
        isActive: true,
        isFired: false,
        joinDate: new Date().toISOString().split("T")[0],
      });
      handleRemovePhoto();
      
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

  // Handle view staff details
  const handleViewStaff = (staff) => {
    setSelectedStaff(staff);
    setIsViewDialogOpen(true);
  };

  // Handle edit staff
  const handleEditStaff = (staff) => {
    setEditStaffData({
      ...staff,
      joinDate: staff.joinDate.split('T')[0],
    });
    setIsEditDialogOpen(true);
  };

  // Handle update staff
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      Object.keys(editStaffData).forEach(key => {
        if (key !== 'photoUrl') {
          formData.append(key, editStaffData[key]);
        }
      });
      
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }

      const response = await fetch(`/api/staff/${editStaffData.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update staff');
      }

      const data = await response.json();
      
      setStaffData(staffData.map(staff => 
        staff.id === editStaffData.id ? { ...staff, ...data } : staff
      ));

      setIsEditDialogOpen(false);
      setEditStaffData(null);
      handleRemovePhoto();
    } catch (err) {
      console.error("Error updating staff:", err);
      setError(err.message || "Failed to update staff. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete staff
  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete staff');
      }

      setStaffData(staffData.filter(staff => staff.id !== selectedStaff.id));
      setIsDeleteDialogOpen(false);
      setSelectedStaff(null);
    } catch (err) {
      console.error("Error deleting staff:", err);
      setError(err.message || "Failed to delete staff. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Staff Management</h1>
          <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
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
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={photoPreview} alt="Profile preview" />
                      <AvatarFallback>
                        {newStaffData.firstName?.[0]}{newStaffData.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      {photoPreview && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={handleRemovePhoto}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload a photo or take one with your camera
                  </p>
                </div>
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

        {/* Search and Filters Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
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

        {/* Staff Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading && staffData.length === 0 ? (
            <div className="col-span-full p-8 text-center">
              <p>Loading staff data...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted-foreground">
              No staff members found
            </div>
          ) : (
            filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 space-y-4">
                  {/* Header with Photo and Name */}
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={staff.photoUrl} alt={`${staff.firstName} ${staff.lastName}`} />
                      <AvatarFallback>
                        {staff.firstName?.[0]}{staff.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {staff.firstName} {staff.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{staff.email}</p>
                    </div>
                  </div>

                  {/* Staff Details */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Staff ID</span>
                      <span className="font-medium">{staff.staffId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Department</span>
                      <span className="font-medium">{staff.department}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={staff.isFired ? "destructive" : staff.isActive ? "success" : "outline"}>
                        {staff.isFired ? "Fired" : staff.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Join Date</span>
                      <span className="font-medium">
                        {new Date(staff.joinDate).toLocaleDateString()}
                      </span>
                    </div>
                    {staff.terminationDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Terminated</span>
                        <span className="font-medium text-destructive">
                          {new Date(staff.terminationDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={staff.isActive}
                        onCheckedChange={(checked) => handleActiveStatusChange(staff.id, checked)}
                        disabled={isLoading}
                      />
                      <span className="text-sm">Active</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewStaff(staff)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditStaff(staff)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Staff
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => {
                            setSelectedStaff(staff);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Staff
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Crop Dialog */}
        <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
          <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crop Photo</DialogTitle>
              <DialogDescription>
                Adjust the crop area to create a square profile photo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <ReactCrop
                  crop={crop}
                  onChange={onCropChange}
                  aspect={1}
                  className="max-h-[60vh]"
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    onLoad={onImageLoad}
                    alt="Crop me"
                    className="max-w-full"
                  />
                </ReactCrop>
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCropDialog(false);
                    handleRemovePhoto();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCropComplete}>
                  Apply Crop
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Staff Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px] w-[95vw]">
            <DialogHeader>
              <DialogTitle>Staff Details</DialogTitle>
              <DialogDescription>
                View detailed information about the staff member.
              </DialogDescription>
            </DialogHeader>
            {selectedStaff && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedStaff.photoUrl} alt={`${selectedStaff.firstName} ${selectedStaff.lastName}`} />
                    <AvatarFallback>
                      {selectedStaff.firstName?.[0]}{selectedStaff.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedStaff.firstName} {selectedStaff.lastName}
                    </h3>
                    <p className="text-muted-foreground">{selectedStaff.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Staff ID</p>
                    <p className="font-medium">{selectedStaff.staffId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedStaff.department}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={selectedStaff.isFired ? "destructive" : selectedStaff.isActive ? "success" : "outline"}>
                      {selectedStaff.isFired ? "Fired" : selectedStaff.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">{selectedStaff.role}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground">Join Date</p>
                    <p className="font-medium">
                      {new Date(selectedStaff.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedStaff.terminationDate && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-sm text-muted-foreground">Termination Date</p>
                      <p className="font-medium text-destructive">
                        {new Date(selectedStaff.terminationDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Staff Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Staff</DialogTitle>
              <DialogDescription>
                Update the staff member's information.
              </DialogDescription>
            </DialogHeader>
            {editStaffData && (
              <form onSubmit={handleUpdateStaff} className="space-y-4 py-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={photoPreview || editStaffData.photoUrl} alt="Profile preview" />
                      <AvatarFallback>
                        {editStaffData.firstName?.[0]}{editStaffData.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      {photoPreview && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={handleRemovePhoto}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editFirstName">First Name</Label>
                    <Input
                      id="editFirstName"
                      value={editStaffData.firstName}
                      onChange={(e) =>
                        setEditStaffData({
                          ...editStaffData,
                          firstName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLastName">Last Name</Label>
                    <Input
                      id="editLastName"
                      value={editStaffData.lastName}
                      onChange={(e) =>
                        setEditStaffData({
                          ...editStaffData,
                          lastName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editStaffData.email}
                    onChange={(e) =>
                      setEditStaffData({
                        ...editStaffData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDepartment">Department</Label>
                  <Select
                    value={editStaffData.department}
                    onValueChange={(value) =>
                      setEditStaffData({
                        ...editStaffData,
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
                  <Label htmlFor="editJoinDate">Join Date</Label>
                  <Input
                    id="editJoinDate"
                    type="date"
                    value={editStaffData.joinDate}
                    onChange={(e) =>
                      setEditStaffData({
                        ...editStaffData,
                        joinDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="editIsActive"
                      checked={editStaffData.isActive}
                      onCheckedChange={(checked) =>
                        setEditStaffData({
                          ...editStaffData,
                          isActive: checked,
                        })
                      }
                    />
                    <Label htmlFor="editIsActive">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="editIsFired"
                      checked={editStaffData.isFired}
                      onCheckedChange={(checked) =>
                        setEditStaffData({
                          ...editStaffData,
                          isFired: checked,
                          isActive: checked ? false : editStaffData.isActive,
                        })
                      }
                    />
                    <Label htmlFor="editIsFired">Fired</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Staff"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Staff Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Staff</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this staff member? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedStaff && (
              <div className="py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedStaff.photoUrl} alt={`${selectedStaff.firstName} ${selectedStaff.lastName}`} />
                    <AvatarFallback>
                      {selectedStaff.firstName?.[0]}{selectedStaff.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedStaff.firstName} {selectedStaff.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedStaff.email}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedStaff(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteStaff}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete Staff"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 