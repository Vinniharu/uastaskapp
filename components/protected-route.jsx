"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthCheck } from "@/lib/auth-utils";
import { useAuth } from "@/lib/auth";
import { LoadingScreen } from "./loading-screen";

/**
 * Protected route component that redirects to login if not authenticated
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string} props.redirectTo - Path to redirect to if not authenticated
 * @returns {React.ReactNode} - Protected content or null
 */
export function ProtectedRoute({ children, redirectTo = "/staff/login" }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isStaffLoggedIn } = useAuth();
  
  // Check if user is authenticated, redirect to login if not
  const isAuthenticated = useAuthCheck(redirectTo);
  
  useEffect(() => {
    // If we're certain the user is not logged in, redirect to login
    if (isStaffLoggedIn === false) {
      router.push(`${redirectTo}?redirect=${pathname}`);
    }
  }, [isStaffLoggedIn, router, redirectTo, pathname]);
  
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