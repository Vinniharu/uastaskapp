"use client";

import { useState, useEffect, useRef } from "react";
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
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  });
  // Add showPassword state
  const [showPassword, setShowPassword] = useState(false);
  
  // Refs for form elements
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Check for redirect parameter
  const redirectUrl = searchParams.get("redirect") || "";

  // Check if user came from signup page with success message
  useEffect(() => {
    const signupSuccess = searchParams.get("signupSuccess");
    if (signupSuccess === "true") {
      console.log("Detected successful signup redirect");
      setSuccessMessage(
        "Account created successfully! Please sign in with your new credentials."
      );
    }
  }, [searchParams]);

  // Modify the redirect logic to always check user role
  useEffect(() => {
    if (isStaffLoggedIn) {
      // Get the stored staff info
      const storedStaffInfo = sessionStorage.getItem("staffInfo");
      let userRole = "staff"; // Default role

      if (storedStaffInfo) {
        try {
          const staffData = JSON.parse(storedStaffInfo);
          userRole = staffData.role || "staff";
        } catch (error) {
          console.error(
            "Failed to parse staff info from sessionStorage",
            error
          );
        }
      }

      // Redirect based on user role
      if (userRole === "admin") {
        const adminDestination = redirectUrl.startsWith("/admin")
          ? redirectUrl
          : "/admin/dashboard";
        console.log("Admin user detected, redirecting to:", adminDestination);
        router.push(adminDestination);
      } else {
        const staffDestination = redirectUrl.startsWith("/staff")
          ? redirectUrl
          : "/staff/dashboard";
        console.log("Staff user detected, redirecting to:", staffDestination);
        router.push(staffDestination);
      }
    }
  }, [isStaffLoggedIn, router, redirectUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);
    
    // Reset validation errors
    setValidationErrors({
      email: "",
      password: "",
    });

    // Validate inputs before making API call
    let hasErrors = false;
    
    if (!formData.email.trim()) {
      setValidationErrors(prev => ({ ...prev, email: "Email or Staff ID is required" }));
      hasErrors = true;
    }

    if (!formData.password) {
      setValidationErrors(prev => ({ ...prev, password: "Password is required" }));
      hasErrors = true;
    }
    
    if (hasErrors) {
      setIsLoading(false);
      // Focus the first field with an error
      if (!formData.email.trim() && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (!formData.password && passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
      return;
    }

    try {

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

      // Redirect based on user role
      if (response.user.role === "admin") {
        // Check if redirect URL is an admin URL, otherwise go to admin dashboard
        const adminDestination = redirectUrl.startsWith("/admin")
          ? redirectUrl
          : "/admin/dashboard";
        console.log("Admin user logged in, redirecting to:", adminDestination);
        router.push(adminDestination);
      } else {
        // Check if redirect URL is a staff URL, otherwise go to staff dashboard
        const staffDestination = redirectUrl.startsWith("/staff")
          ? redirectUrl
          : "/staff/dashboard";
        console.log("Staff user logged in, redirecting to:", staffDestination);
        router.push(staffDestination);
      }
    } catch (err) {
      console.error("Login error:", err);

      // Extract the most useful error message
      let errorMessage = "An error occurred during login. Please try again.";
      let isCredentialsError = false;
      let isEmailError = false;
      let isPasswordError = false;

      // Handle specific API error responses
      if (err.response) {
        const statusCode = err.response.status;
        
        // Handle common HTTP status codes
        if (statusCode === 401) {
          errorMessage = "Invalid email/password combination. Please check your credentials and try again.";
          isCredentialsError = true;
          isPasswordError = true; // Assume password error as most common
        } else if (statusCode === 404) {
          errorMessage = "Account not found. Please check your email/staff ID or sign up.";
          isCredentialsError = true;
          isEmailError = true;
        } else if (statusCode === 403) {
          errorMessage = "Your account is locked or disabled. Please contact an administrator.";
        } else if (statusCode === 429) {
          errorMessage = "Too many failed attempts. Please try again later.";
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } 
      // Handle network errors
      else if (err.request) {
        errorMessage = "Network error. Please check your connection and try again.";
      } 
      // Handle specific error messages
      else if (err.message) {
        if (err.message.includes("password") && 
           (err.message.includes("incorrect") || err.message.includes("invalid") || err.message.includes("wrong"))) {
          errorMessage = "Incorrect password. Please try again.";
          isCredentialsError = true;
          isPasswordError = true;
        } else if (err.message.includes("email") && 
                  (err.message.includes("not found") || err.message.includes("invalid") || err.message.includes("unknown"))) {
          errorMessage = "Email or Staff ID not found. Please check your credentials.";
          isCredentialsError = true;
          isEmailError = true;
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      
      // Set validation errors for specific fields
      if (isEmailError) {
        setValidationErrors(prev => ({ ...prev, email: "Invalid email or staff ID" }));
        if (emailInputRef.current) emailInputRef.current.focus();
      }
      
      if (isPasswordError) {
        setValidationErrors(prev => ({ ...prev, password: "Incorrect password" }));
        if (passwordInputRef.current) passwordInputRef.current.focus();
      }
      
      // Add shake animation to form if it's a credentials error
      if (isCredentialsError || errorMessage.includes("password") || errorMessage.includes("email") || 
          errorMessage.includes("credentials")) {
        const form = document.querySelector("form");
        if (form) {
          form.classList.add("animate-shake");
          setTimeout(() => {
            form.classList.remove("animate-shake");
          }, 500);
        }
      }
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
              Welcome Back
            </h1>
            <p className="text-xl leading-relaxed text-gray-200">
              Sign in to access your dashboard and manage your tasks.
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

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
            <p className="text-gray-600 mt-2">
              Enter your credentials to access your account
            </p>
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
            <Alert
              variant="success"
              className="mb-6 bg-green-50 text-green-800 border-green-200"
            >
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
                Email or Staff ID
              </label>
              <Input
                id="email"
                type="text"
                required
                placeholder="Enter your email or staff ID"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full ${validationErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                ref={emailInputRef}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Link
                  href="/staff/reset-password"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`w-full pr-10 ${validationErrors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  ref={passwordInputRef}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
              )}
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
              <Link
                href="/staff/signup"
                className="text-blue-600 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
