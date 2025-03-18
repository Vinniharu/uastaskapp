"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { registerStaff } from "@/lib/api";

export default function StaffSignup() {
  const router = useRouter();
  const { loginStaff, isStaffLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    staffId: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // Redirect already logged in users
  useEffect(() => {
    if (isStaffLoggedIn) {
      router.push('/staff/dashboard');
    }
  }, [isStaffLoggedIn, router]);
  
  // If registration was successful, redirect to login after showing success message
  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(() => {
        router.push('/staff/login?signupSuccess=true');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [registrationSuccess, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate form data
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.staffId) {
      setError("All fields are required");
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
    
    setIsLoading(true);

    try {
      // Prepare registration data according to the required format
      const registrationData = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        staffId: formData.staffId.trim(),
      };
      
      console.log("Attempting to register with data:", {
        ...registrationData,
        password: "[REDACTED]" // Don't log the actual password
      });
      console.log("API endpoint:", `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`);
      
      // Call the API to register the staff
      const response = await registerStaff(registrationData);
      
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
        staffId: ""
      });
    } catch (err) {
      console.error("Registration error details:", err);
      // Extract the most useful error message
      let errorMessage = "Failed to create account. Please try again.";
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.data && err.data.message) {
        errorMessage = err.data.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Check for common registration errors
      if (errorMessage.includes("duplicate") || errorMessage.includes("already exists") || errorMessage.includes("taken")) {
        errorMessage = "An account with this email or staff ID already exists.";
      } else if (errorMessage.includes("validation") || errorMessage.includes("valid")) {
        errorMessage = "Please check your information and try again.";
      } else if (errorMessage.includes("network") || errorMessage.includes("connect")) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent flex flex-col justify-center px-12 text-white">
          <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl mb-6">Manage tasks efficiently and collaborate with your team members.</p>
        </div>
      </div>
      
      {/* Right side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
            <p className="text-gray-600 mt-2">Sign up to access the staff dashboard</p>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {registrationSuccess && (
            <Alert variant="success" className="mb-6 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Account created successfully! Redirecting to login page...</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                required
                className="w-full"
                disabled={isLoading || registrationSuccess}
              />
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="w-full"
                disabled={isLoading || registrationSuccess}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#111827] hover:bg-gray-900 text-white py-2"
              disabled={isLoading || registrationSuccess}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/staff/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 