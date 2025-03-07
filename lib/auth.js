"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "./api";

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  console.log("Auth context accessed, token exists:", !!context.token);
  return context;
};

// Helper function to safely access sessionStorage
const safeSessionStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem(key);
      }
    } catch (error) {
      console.error('Error accessing sessionStorage:', error);
    }
    return null;
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting sessionStorage item:', error);
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing sessionStorage item:', error);
    }
  }
};

// Helper function to set a cookie
const setCookie = (name, value, days = 7) => {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

// Helper function to delete a cookie
const deleteCookie = (name) => {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
};

// Auth provider component
export function AuthProvider({ children }) {
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [staffInfo, setStaffInfo] = useState(null);
  // Use a temporary mock token for testing
  const [authToken, setAuthToken] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOjQsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQxMjk0NDA2LCJleHAiOjE3NDEzODA4MDZ9.yDp3WQvDqUHwiQb-EZmRxUOtrSHp3MFl1JHYZ0Sx-4U");
  
  // Check if staff is logged in from sessionStorage on initial load
  useEffect(() => {
    // Using sessionStorage instead of localStorage for better security
    const storedAuthState = safeSessionStorage.getItem("staffLoggedIn");
    const storedStaffInfo = safeSessionStorage.getItem("staffInfo");
    const storedToken = safeSessionStorage.getItem("authToken") || authToken; // Use mock token if none stored
    
    console.log("Initial auth check, token exists:", !!storedToken);
    
    if ((storedAuthState === "true" && storedToken) || storedToken) {
      setIsStaffLoggedIn(true);
      setAuthToken(storedToken);
      
      if (storedStaffInfo) {
        try {
          setStaffInfo(JSON.parse(storedStaffInfo));
        } catch (error) {
          console.error("Failed to parse staff info from sessionStorage", error);
          // If parsing fails, clear the invalid data
          logoutStaff();
        }
      } else {
        // If no stored staff info, we'll fetch it from the API when needed
        // Don't set mock data here as it should come from the API
        console.log("No stored staff info found, will need to fetch from API");
      }
    }
  }, []);

  // Login function with user info
  const loginStaff = (userInfo = null) => {
    setIsStaffLoggedIn(true);
    safeSessionStorage.setItem("staffLoggedIn", "true");
    
    if (userInfo) {
      // Store user info
      setStaffInfo(userInfo);
      safeSessionStorage.setItem("staffInfo", JSON.stringify(userInfo));
      
      // Store token if provided
      if (userInfo.token) {
        setAuthToken(userInfo.token);
        safeSessionStorage.setItem("authToken", userInfo.token);
        
        // Also set the token in a cookie for the middleware
        setCookie("authToken", userInfo.token);
      }
    }
  };

  // Logout function
  const logoutStaff = () => {
    setIsStaffLoggedIn(false);
    setStaffInfo(null);
    setAuthToken(null);
    safeSessionStorage.removeItem("staffLoggedIn");
    safeSessionStorage.removeItem("staffInfo");
    safeSessionStorage.removeItem("authToken");
    
    // Also remove the token cookie
    deleteCookie("authToken");
  };

  // Function to get auth headers for API requests
  const getAuthHeaders = () => {
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  };

  // Function to check if the token is valid
  const validateToken = async () => {
    if (!authToken) return false;
    
    try {
      // Make a request to validate the token
      await apiRequest('/api/auth/validate', {
        headers: getAuthHeaders(),
      });
      return true;
    } catch (error) {
      console.error("Token validation failed:", error);
      // If token is invalid, log out the user
      logoutStaff();
      return false;
    }
  };

  // Auth context value
  const value = {
    isStaffLoggedIn,
    staffInfo,
    token: authToken, // Expose token directly
    authToken,
    loginStaff,
    logoutStaff,
    getAuthHeaders,
    validateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 