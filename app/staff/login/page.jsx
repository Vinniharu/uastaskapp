"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { loginStaff as apiLoginStaff } from "@/lib/api";

export default function StaffLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginStaff, isStaffLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Check for redirect parameter
  const redirectUrl = searchParams.get('redirect') || '';
  
  // Check if user came from signup page with success message
  useEffect(() => {
    const signupSuccess = searchParams.get('signupSuccess');
    if (signupSuccess === 'true') {
      console.log("Detected successful signup redirect");
      setSuccessMessage("Account created successfully! Please sign in with your new credentials.");
    }
  }, [searchParams]);
  
  // If the user is already logged in, redirect them
  useEffect(() => {
    if (isStaffLoggedIn) {
      console.log("User already logged in, redirecting to:", redirectUrl || '/staff/dashboard');
      router.push(redirectUrl || '/staff/dashboard');
    }
  }, [isStaffLoggedIn, router, redirectUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      console.log("Attempting login with email:", formData.email);
      
      // Call the API to login
      const response = await apiLoginStaff({
        email: formData.email,
        password: formData.password,
      });
      
      console.log("Login successful, user role:", response.user.role);
      
      // Create user info object from the response
      // The API returns { user: {...}, access_token: "..." }
      const userInfo = {
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        staffId: response.user.staffId,
        fullName: `${response.user.firstName} ${response.user.lastName}`,
        role: response.user.role,
        token: response.access_token, // Store the access_token
      };
      
      // Set the staff as logged in with user info
      // This will store the authentication data in sessionStorage
      loginStaff(userInfo);
      
      // Redirect based on user role or the redirect parameter
      if (redirectUrl) {
        console.log("Redirecting to requested page:", redirectUrl);
        router.push(redirectUrl);
      } else if (response.user.role === "admin") {
        // Redirect admin users to admin dashboard
        console.log("Redirecting to admin dashboard");
        router.push("/admin/dashboard");
      } else {
        // Redirect regular staff to staff dashboard
        console.log("Redirecting to staff dashboard");
        router.push("/staff/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Extract the most useful error message
      let errorMessage = "Invalid email or password. Please try again.";
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.data && err.data.message) {
        errorMessage = err.data.message;
      }
      
      // Check for common login errors
      if (errorMessage.includes("incorrect") || errorMessage.includes("invalid")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (errorMessage.includes("not found")) {
        errorMessage = "Account not found. Please check your email or sign up.";
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
          <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-xl mb-6">Sign in to access your dashboard and manage your tasks.</p>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
            <p className="text-gray-600 mt-2">Enter your credentials to access your account</p>
            {redirectUrl && (
              <p className="text-sm text-amber-600 mt-2">
                You need to sign in to access the requested page
              </p>
            )}
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {successMessage && (
            <Alert variant="success" className="mb-6 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                required
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label 
                  htmlFor="password" 
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Link href="#" className="text-xs text-blue-600 hover:underline">
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#111827] hover:bg-gray-900 text-white py-2"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/staff/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 