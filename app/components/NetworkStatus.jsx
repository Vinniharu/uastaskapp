"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff } from "lucide-react";

/**
 * Component to display network status to users
 * Shows an alert when the user is offline
 */
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    
    // Add event listeners for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Only render when offline
  if (isOnline) {
    return null;
  }
  
  return (
    <Alert variant="destructive" className="mb-4">
      <WifiOff className="h-4 w-4 mr-2" />
      <AlertDescription>
        You are currently offline. Some features may not work properly until your connection is restored.
      </AlertDescription>
    </Alert>
  );
} 