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

    try {
      console.log("Attempting login with identifier:", formData.email);

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
      let errorMessage = "Invalid email/staff ID or password. Please try again.";

      if (err.message) {
        errorMessage = err.message;
      } else if (err.data && err.data.message) {
        errorMessage = err.data.message;
      }

      // Check for common login errors
      if (
        errorMessage.includes("incorrect") ||
        errorMessage.includes("invalid")
      ) {
        errorMessage = "Invalid email/staff ID or password. Please try again.";
      } else if (errorMessage.includes("not found")) {
        errorMessage = "Account not found. Please check your credentials or sign up.";
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
                {/* <Link
                  href="#"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Forgot your password?
                </Link> */}
              </div>
              <Input
                id="password"
                type="password"
                required
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
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
