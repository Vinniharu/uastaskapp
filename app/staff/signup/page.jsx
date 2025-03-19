"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Camera, Upload, X, Crop, Check, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { registerStaff } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function StaffSignup() {
  const router = useRouter();
  const { loginStaff, isStaffLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    staffId: "",
    phoneNumber: "",
    department: "",
    profilePhoto: null,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [stream, setStream] = useState(null);
  const [crop, setCrop] = useState(null);
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Department list
  const DEPARTMENTS = [
    "Electronic Unit",
    "Production Unit",
    "Moulding Unit",
    "GIS",
    "Payload",
    "3D & CNC",
    "Health & Safety",
    "Pilots",
  ];

  // Redirect already logged in users
  useEffect(() => {
    if (isStaffLoggedIn) {
      router.push("/staff/dashboard");
    }
  }, [isStaffLoggedIn, router]);

  // If registration was successful, redirect to login after showing success message
  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(() => {
        router.push("/staff/login?signupSuccess=true");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [registrationSuccess, router]);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Stop any active camera stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
        setIsCapturing(false);
      }
      
      // Set up cropping process
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setIsCapturing(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions and try again.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      
      setIsCapturing(false);
      
      // Move to cropping stage using the same approach as file upload
      setImgSrc(canvas.toDataURL("image/jpeg"));
      setIsCropping(true);
    }
  };

  // Handle image load for cropping
  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const crop = makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      1, // Force square aspect ratio (1:1)
      width,
      height
    );
    setCrop(crop);
  };

  // Handle crop completion
  const applyCrop = () => {
    if (imgRef.current && crop && canvasRef.current) {
      const canvas = canvasRef.current;
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      // Make sure the canvas is square for 1:1 aspect ratio
      const size = Math.min(
        crop.width * scaleX,
        crop.height * scaleY
      );
      
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        size,
        size
      );

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
          setFormData({ ...formData, profilePhoto: file });
          setPhotoPreview(canvas.toDataURL());
          setIsCropping(false);
          setImgSrc('');
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setImgSrc('');
    setCrop(null);
  };

  const clearPhoto = () => {
    // Stop any active camera stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCapturing(false);
    }
    
    setFormData({ ...formData, profilePhoto: null });
    setPhotoPreview(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form data
    if (
      !formData.email ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.staffId ||
      !formData.phoneNumber ||
      !formData.department
    ) {
      setError("All fields except photo are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Validate phone number
    const phoneRegex = /^\+?[0-9\s\(\)\-]{10,15}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for file upload
      const registrationFormData = new FormData();
      
      // Add text fields
      registrationFormData.append("email", formData.email.trim());
      registrationFormData.append("password", formData.password);
      registrationFormData.append("firstName", formData.firstName.trim());
      registrationFormData.append("lastName", formData.lastName.trim());
      registrationFormData.append("staffId", formData.staffId.trim());
      registrationFormData.append("phoneNumber", formData.phoneNumber.trim());
      registrationFormData.append("department", formData.department);
      
      // Add profile photo if exists
      if (formData.profilePhoto) {
        registrationFormData.append("profilePhoto", formData.profilePhoto);
      }

      console.log("Attempting to register with data:", {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        staffId: formData.staffId,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
        hasPhoto: !!formData.profilePhoto
      });
      
      // Call the API to register the staff - passing FormData instead of JSON
      const response = await registerStaff(registrationFormData);

      console.log("Registration successful:", response);

      // Show success message and set flag to redirect
      setRegistrationSuccess(true);

      // Clear form data
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        staffId: "",
        phoneNumber: "",
        department: "",
        profilePhoto: null,
      });
      
      setPhotoPreview(null);
      
    } catch (err) {
      console.error("Registration error details:", err);
      // Extract the most useful error message
      let errorMessage = "Failed to create account. Please try again.";

      if (err.message) {
        errorMessage = err.message;
      } else if (err.data && err.data.message) {
        errorMessage = err.data.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      // Check for common registration errors
      if (
        errorMessage.includes("duplicate") ||
        errorMessage.includes("already exists") ||
        errorMessage.includes("taken")
      ) {
        errorMessage = "An account with this email or staff ID already exists.";
      } else if (
        errorMessage.includes("validation") ||
        errorMessage.includes("valid")
      ) {
        errorMessage = "Please check your information and try again.";
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("connect")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-gray-400 to-gray-700 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
        <div className="flex flex-col items-center justify-center gap-6 p-12 h-screen relative z-10">
          <div className="w-full max-w-[20rem] h-auto mb-4 transform hover:scale-105 transition-transform duration-300">
            <img
              src="/logo.webp"
              alt="Company Logo"
              className="w-full h-auto object-contain drop-shadow-lg"
            />
          </div>
          <div className="flex flex-col justify-end gap-8 text-white text-center max-w-lg">
            <h1 className="text-5xl font-bold mb-4 text-yellow-500">
              Join Our Team
            </h1>
            <p className="text-xl leading-relaxed text-gray-200">
              Manage tasks efficiently and collaborate with your team members in
              our modern workspace platform.
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <span className="px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-500 text-sm">
                Collaboration
              </span>
              <span className="px-3 py-1 bg-slate-200/20 rounded-full text-black text-sm">
                Efficiency
              </span>
              <span className="px-3 py-1 bg-slate-800/20 rounded-full text-white text-sm">
                Innovation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Create Your Account
            </h2>
            <p className="text-gray-600 mt-2">
              Sign up to access the staff dashboard
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {registrationSuccess && (
            <Alert
              variant="success"
              className="mb-6 bg-green-50 text-green-800 border-green-200"
            >
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Account created successfully! Redirecting to login page...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo Upload Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Profile Photo
              </label>
              
              <div className="flex flex-col items-center space-y-3">
                {/* Image Cropper */}
                {isCropping && imgSrc && (
                  <div className="w-full bg-gray-100 p-4 rounded-lg">
                    <div className="mb-4">
                      <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        aspect={1}
                        circularCrop
                      >
                        <img 
                          ref={imgRef}
                          src={imgSrc}
                          alt="Crop your profile" 
                          onLoad={onImageLoad}
                          className="max-w-full"
                        />
                      </ReactCrop>
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    <div className="flex justify-between mt-2">
                      <Button
                        type="button"
                        onClick={cancelCrop}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <X size={16} />
                        Cancel
                      </Button>
                      
                      <Button
                        type="button"
                        onClick={applyCrop}
                        className="bg-green-600 text-white flex items-center gap-1"
                      >
                        <Check size={16} />
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Photo Preview */}
                {photoPreview && !isCropping && (
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300">
                    <img 
                      src={photoPreview} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      title="Remove photo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  </div>
                )}
                
                {/* Camera view for capturing */}
                {isCapturing && !isCropping && (
                  <div className="relative w-full max-w-md border-2 border-gray-300 rounded-lg overflow-hidden">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full"
                    />
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                      <Button 
                        type="button" 
                        onClick={capturePhoto}
                        className="bg-blue-600 text-white"
                      >
                        Capture
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Actions (only show when not capturing or cropping) */}
                {!isCapturing && !isCropping && !photoPreview && (
                  <div className="flex space-x-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={isLoading || registrationSuccess}
                    />
                    
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={isLoading || registrationSuccess}
                    >
                      <Upload size={16} />
                      Upload Photo
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={startCamera}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={isLoading || registrationSuccess}
                    >
                      <Camera size={16} />
                      Take Photo
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="firstName"
                  className="text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  className="w-full"
                  disabled={isLoading || registrationSuccess}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="lastName"
                  className="text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                  className="w-full"
                  disabled={isLoading || registrationSuccess}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="staffId"
                className="text-sm font-medium text-gray-700"
              >
                Staff ID
              </label>
              <Input
                id="staffId"
                type="text"
                placeholder="Enter your staff ID"
                value={formData.staffId}
                onChange={(e) =>
                  setFormData({ ...formData, staffId: e.target.value })
                }
                required
                className="w-full"
                disabled={isLoading || registrationSuccess}
              />
            </div>
            
            <div className="space-y-2">
              <label
                htmlFor="phoneNumber"
                className="text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                required
                className="w-full"
                disabled={isLoading || registrationSuccess}
              />
            </div>
            
            <div className="space-y-2">
              <label
                htmlFor="department"
                className="text-sm font-medium text-gray-700"
              >
                Department
              </label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
                disabled={isLoading || registrationSuccess}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full"
                disabled={isLoading || registrationSuccess}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min. 8 characters)"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="w-full"
                disabled={isLoading || registrationSuccess}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                className="w-full"
                disabled={isLoading || registrationSuccess}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#111827] hover:bg-gray-900 text-white py-2"
              disabled={isLoading || registrationSuccess || isCropping}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/staff/login"
                className="text-blue-600 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
