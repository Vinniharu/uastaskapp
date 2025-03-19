"use client";

import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/app/components/AdminLayout";
import { useAuthCheck } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
import { AlertCircle, Search, MoreHorizontal, UserPlus, Filter, Camera, Upload, X, Trash2, Pencil, Eye, Key, RefreshCw } from "lucide-react";
import { getAllStaff, createStaff, getStaffById, uploadStaffProfilePicture, changeStaffPassword, resetStaffPassword, updateStaff } from "@/lib/api";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function StaffManagement() {
  const [staffData, setStaffData] = useState([]);
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
    isActive: true,
    isFired: false,
  });
  const [crop, setCrop] = useState(null);
  const [imgSrc, setImgSrc] = useState('');
  const [showCropDialog, setShowCropDialog] = useState(false);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editStaffData, setEditStaffData] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [selectedStaffForPassword, setSelectedStaffForPassword] = useState(null);
  const [isProfilePictureDialogOpen, setIsProfilePictureDialogOpen] = useState(false);
  const [selectedStaffForPhoto, setSelectedStaffForPhoto] = useState(null);

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

    return matchesSearch && matchesStatus;
  });

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
      await getAllStaff(staffId, statusUpdate);
      
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

  // Handle add staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // First, create the staff member
      const response = await createStaff({
        email: newStaffData.email,
        firstName: newStaffData.firstName,
        lastName: newStaffData.lastName,
        staffId: newStaffData.staffId || generateStaffId(),
      });

      // If photo is selected, upload it
      if (selectedPhoto) {
        try {
          const formData = new FormData();
          formData.append('file', selectedPhoto);
          await uploadStaffProfilePicture(response.id, formData);
        } catch (photoErr) {
          console.error("Error uploading profile picture:", photoErr);
          // Don't fail the whole operation if photo upload fails
        }
      }

      // Fetch the updated staff data to get the latest information including the profile picture
      const updatedStaff = await getStaffById(response.id);
      
      // Add the new staff to the local state
      setStaffData([...staffData, updatedStaff]);
      
      // Reset form and photo
      setNewStaffData({
        firstName: "",
        lastName: "",
        email: "",
        staffId: "",
        isActive: true,
        isFired: false,
      });
      handleRemovePhoto();
      
      setIsAddStaffDialogOpen(false);
      setSuccessMessage("Staff member added successfully");
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
  const handleViewStaff = async (staff) => {
    try {
      const staffDetails = await getStaffById(staff.id);
      setSelectedStaff(staffDetails);
      setIsViewDialogOpen(true);
    } catch (err) {
      console.error("Error fetching staff details:", err);
      setError(err.message || "Failed to fetch staff details. Please try again.");
    }
  };

  // Handle edit staff
  const handleEditStaff = (staff) => {
    setEditStaffData({
      ...staff
    });
    setIsEditDialogOpen(true);
  };

  // Handle update staff
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // First update the staff data
      const updatedStaff = await updateStaff(editStaffData.id, {
        firstName: editStaffData.firstName,
        lastName: editStaffData.lastName,
        email: editStaffData.email,
        isFired: editStaffData.isFired,
      });

      // If there's a new photo, upload it
      if (selectedPhoto) {
        await uploadStaffProfilePicture(editStaffData.id, selectedPhoto);
      }

      // Update local state
      setStaffData(staffData.map(staff => 
        staff.id === editStaffData.id ? { ...staff, ...updatedStaff } : staff
      ));

      setIsEditDialogOpen(false);
      setEditStaffData(null);
      handleRemovePhoto();
      setSuccessMessage("Staff updated successfully");
    } catch (err) {
      console.error("Error updating staff:", err);
      setError(err.message || "Failed to update staff. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle change password
  const handleChangePassword = async (staffId, newPassword) => {
    try {
      await changeStaffPassword(staffId, newPassword);
      setSuccessMessage("Password changed successfully");
    } catch (err) {
      console.error("Error changing password:", err);
      setError(err.message || "Failed to change password. Please try again.");
    }
  };

  // Handle reset password
  const handleResetPassword = async (staffId) => {
    try {
      await resetStaffPassword(staffId);
      setSuccessMessage("Password reset successfully");
    } catch (err) {
      console.error("Error resetting password:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (staffId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await uploadStaffProfilePicture(staffId, formData);
      
      // Refresh staff data to get updated photo URL
      const updatedStaff = await getStaffById(staffId);
      setStaffData(staffData.map(staff => 
        staff.id === staffId ? { ...staff, profilePicture: updatedStaff.profilePicture } : staff
      ));
      setSuccessMessage("Profile picture updated successfully");
      setError(""); // Clear any existing errors
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      setError(err.message || "Failed to upload profile picture. Please try again.");
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
                      <AvatarImage src={`http://10.10.10.182:3000${staff.profilePicture}`} alt={`${staff.firstName} ${staff.lastName}`} />
                      <AvatarFallback>
                        {staff.firstName?.[0]}{staff.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {staff.firstName} {staff.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{staff.email}</p>
                      <Badge variant={staff.role === 'admin' ? "admin" : "staff"} className="mt-1 capitalize">
                        {staff.role}
                      </Badge>
                    </div>
                  </div>

                  {/* Staff Details */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Staff ID</span>
                      <span className="font-medium">{staff.staffId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={staff.isActive ? "success" : "outline"}>
                        {staff.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Joined</span>
                      <span className="text-sm">
                        {new Date(staff.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end pt-4 border-t">
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
                        <DropdownMenuItem onClick={() => {
                          setSelectedStaffForPhoto(staff);
                          setIsProfilePictureDialogOpen(true);
                        }}>
                          <Camera className="h-4 w-4 mr-2" />
                          Upload Photo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedStaffForPassword(staff);
                          setIsPasswordDialogOpen(true);
                        }}>
                          <Key className="h-4 w-4 mr-2" />
                          Change Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(staff.id)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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
                    <AvatarImage src={`http://10.10.10.182:3000${selectedStaff.profilePicture}`} alt={`${selectedStaff.firstName} ${selectedStaff.lastName}`} />
                    <AvatarFallback>
                      {selectedStaff.firstName?.[0]}{selectedStaff.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedStaff.firstName} {selectedStaff.lastName}
                    </h2>
                    <p className="text-muted-foreground">{selectedStaff.email}</p>
                    <Badge variant={selectedStaff.role === 'admin' ? "admin" : "staff"} className="mt-2 capitalize">
                      {selectedStaff.role}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Staff ID</p>
                    <p className="font-medium">{selectedStaff.staffId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={selectedStaff.isActive ? "success" : "outline"}>
                      {selectedStaff.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Join Date</p>
                    <p className="font-medium">
                      {new Date(selectedStaff.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {new Date(selectedStaff.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
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
                      <AvatarImage src={photoPreview || editStaffData.profilePicture} alt="Profile preview" />
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
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Staff"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Password Change Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Change Staff Password</DialogTitle>
              <DialogDescription>
                Enter a new password for {selectedStaffForPassword?.firstName} {selectedStaffForPassword?.lastName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPasswordDialogOpen(false);
                  setSelectedStaffForPassword(null);
                  setNewPassword("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedStaffForPassword) {
                    handleChangePassword(selectedStaffForPassword.id, newPassword);
                    setIsPasswordDialogOpen(false);
                    setSelectedStaffForPassword(null);
                    setNewPassword("");
                  }
                }}
                disabled={!newPassword || newPassword.length < 8}
              >
                Change Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Profile Picture Upload Dialog */}
        <Dialog open={isProfilePictureDialogOpen} onOpenChange={setIsProfilePictureDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Profile Picture</DialogTitle>
              <DialogDescription>
                Upload a new profile picture for {selectedStaffForPhoto?.firstName} {selectedStaffForPhoto?.lastName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={photoPreview || selectedStaffForPhoto?.profilePicture} alt="Profile preview" />
                    <AvatarFallback>
                      {selectedStaffForPhoto?.firstName?.[0]}{selectedStaffForPhoto?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                {selectedPhoto && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsProfilePictureDialogOpen(false);
                  setSelectedStaffForPhoto(null);
                  handleRemovePhoto();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedStaffForPhoto && selectedPhoto) {
                    handleProfilePictureUpload(selectedStaffForPhoto.id, selectedPhoto);
                    setIsProfilePictureDialogOpen(false);
                    setSelectedStaffForPhoto(null);
                    handleRemovePhoto();
                  }
                }}
                disabled={!selectedPhoto}
              >
                Upload Photo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Success Message Alert */}
        {successMessage && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
      </div>
    </AdminLayout>
  );
} 