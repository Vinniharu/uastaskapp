"use client";

import { useAuthCheck } from "@/lib/auth-utils";
import { LoadingScreen } from "./loading-screen";

/**
 * Protected route component that redirects to login if not authenticated
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string} props.redirectTo - Path to redirect to if not authenticated
 * @returns {React.ReactNode} - Protected content or null
 */
export function ProtectedRoute({ children, redirectTo = "/staff/login" }) {
  // Check if user is authenticated, redirect to login if not
  const isAuthenticated = useAuthCheck(redirectTo);
  
  // Show loading screen while checking authentication
  if (typeof isAuthenticated === 'undefined') {
    return <LoadingScreen />;
  }
  
  // If not authenticated, don't render anything (handled by useAuthCheck)
  if (!isAuthenticated) {
    return null;
  }
  
  // If authenticated, render the children
  return <>{children}</>;
} 