"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A dismissible alert component that can be used to display error messages
 * with the ability for users to clear them
 */
export function DismissibleAlert({ 
  message, 
  variant = "destructive", 
  icon = variant === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />,
  onDismiss,
  autoHideDuration = 0, // 0 means no auto-hide
}) {
  const [visible, setVisible] = useState(true);
  
  // Auto-hide the alert after the specified duration
  useEffect(() => {
    if (autoHideDuration > 0 && message) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [message, autoHideDuration]);
  
  // Reset visibility when message changes
  useEffect(() => {
    if (message) {
      setVisible(true);
    }
  }, [message]);
  
  // If no message, don't render anything
  if (!message || !visible) {
    return null;
  }
  
  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  return (
    <Alert variant={variant} className="relative pr-8">
      {icon}
      <AlertDescription>{message}</AlertDescription>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 hover:bg-transparent hover:opacity-75"
        onClick={handleDismiss}
        aria-label="Dismiss alert"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
} 