"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingScreen } from "./loading-screen";

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationTimeout, setNavigationTimeout] = useState(null);

  useEffect(() => {
    // When the route changes, set navigating to false
    setIsNavigating(false);
    
    // Clear any existing timeout
    if (navigationTimeout) {
      clearTimeout(navigationTimeout);
      setNavigationTimeout(null);
    }
    
    // Add event listeners for navigation start
    const handleNavigationStart = () => {
      // Set a timeout to show loading screen only if navigation takes more than 300ms
      const timeout = setTimeout(() => {
        setIsNavigating(true);
      }, 300);
      
      setNavigationTimeout(timeout);
    };
    
    // Add event listeners for navigation complete
    const handleNavigationComplete = () => {
      setIsNavigating(false);
      
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
        setNavigationTimeout(null);
      }
    };
    
    // Add event listeners
    window.addEventListener("beforeunload", handleNavigationStart);
    window.addEventListener("unload", handleNavigationComplete);
    
    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleNavigationStart);
      window.removeEventListener("unload", handleNavigationComplete);
      
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
    };
  }, [pathname, searchParams, navigationTimeout]);

  return isNavigating ? <LoadingScreen /> : null;
} 