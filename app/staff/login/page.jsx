"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { loginStaff as apiLoginStaff } from "@/lib/api";

export default function StaffLogin() {
  const router = useRouter();
  const { loginStaff } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Call the API to login
      const response = await apiLoginStaff({
        email: formData.email,
        password: formData.password,
      });
      
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
      
      // Redirect based on user role
      if (response.user.role === "admin") {
        // Redirect admin users to admin dashboard
        router.push("/admin/dashboard");
      } else {
        // Redirect regular staff to staff dashboard
        router.push("/staff/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password");
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
          <p className="text-xl mb-6">Sign in to access your tasks and continue your work.</p>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
            <p className="text-gray-600 mt-2">Enter your credentials to access your dashboard</p>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
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
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="email"
                className="w-full"
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                autoComplete="current-password"
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