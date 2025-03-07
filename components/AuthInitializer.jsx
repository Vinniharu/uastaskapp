"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { setAuthHeadersGetter } from "@/lib/api";

/**
 * Component to initialize authentication headers for API calls
 * This is needed because we can't directly use the useAuth hook in the API utility
 */
export function AuthInitializer() {
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    // Set the auth headers getter function
    setAuthHeadersGetter(getAuthHeaders);
  }, [getAuthHeaders]);

  // This component doesn't render anything
  return null;
} 