"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth";

/**
 * Hook to check if user is authenticated and redirect to login if not
 * @param {string} redirectPath - Path to redirect to if not authenticated (default: /staff/login)
 * @returns {boolean|undefined} - Whether the user is authenticated (undefined during initial check)
 */
export function useAuthCheck(redirectPath = "/staff/login") {
  const { isStaffLoggedIn } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Set a small delay to avoid flickering during hydration
    const timer = setTimeout(() => {
      // If not logged in, redirect to login page
      if (!isStaffLoggedIn) {
        router.push(redirectPath);
      }
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isStaffLoggedIn, router, redirectPath]);

  // Return undefined during the initial check to indicate loading
  return isChecking ? undefined : isStaffLoggedIn;
}

/**
 * Higher-order component to protect routes that require authentication
 * @param {React.Component} Component - Component to protect
 * @param {Object} options - Options for the protected route
 * @param {string} options.redirectPath - Path to redirect to if not authenticated
 * @returns {React.Component} - Protected component
 */
export function withAuth(Component, options = {}) {
  const { redirectPath = "/staff/login" } = options;

  return function ProtectedRoute(props) {
    const isAuthenticated = useAuthCheck(redirectPath);

    // Don't render anything until authentication check is complete
    if (!isAuthenticated) {
      return null;
    }

    // If authenticated, render the component
    return <Component {...props} />;
  };
} 