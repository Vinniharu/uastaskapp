"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest, setAuthHeadersGetter } from "./api";

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
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
  const [authToken, setAuthToken] = useState(null);
  
  // Check if staff is logged in from sessionStorage on initial load
  useEffect(() => {
    // Using sessionStorage instead of localStorage for better security
    const storedAuthState = safeSessionStorage.getItem("staffLoggedIn");
    const storedStaffInfo = safeSessionStorage.getItem("staffInfo");
    const storedToken = safeSessionStorage.getItem("authToken");
    
    // console.log("Initial auth check, token exists:", !!storedToken);
    
    if (storedAuthState === "true" && storedToken) {
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
        
        // Set the token in a cookie for the middleware
        document.cookie = `authToken=${userInfo.token}; path=/; max-age=86400; SameSite=Strict`;
      }
    }
  };

  // Logout function
  const logoutStaff = () => {
    setIsStaffLoggedIn(false);
    setStaffInfo(null);
    setAuthToken(null);
    
    // Clear sessionStorage
    safeSessionStorage.removeItem("staffLoggedIn");
    safeSessionStorage.removeItem("staffInfo");
    safeSessionStorage.removeItem("authToken");
    
    // Clear the auth cookie
    document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
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
      await apiRequest('/auth/validate', {
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

  // Set up the auth headers getter
  useEffect(() => {
    setAuthHeadersGetter(() => {
      if (!authToken) return {};
      return {
        'Authorization': `Bearer ${authToken}`,
      };
    });
  }, [authToken]);

  // Auth context value
  const value = {
    isStaffLoggedIn,
    staffInfo,
    token: authToken,
    loginStaff,
    logoutStaff,
    getAuthHeaders,
    validateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 