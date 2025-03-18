"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/app/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useAuthCheck } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  ArrowLeft,
  CheckCircle2,
  User,
  CalendarClock,
  AlertTriangle,
  Link as LinkIcon,
  Paperclip,
  Send,
  Trash2,
  MessageSquare,
  MessageSquareOff,
  MoreVertical,
  Loader2,
  FileText,
  Download
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { statusOptions, priorityBadges } from "@/lib/mock-data";
import { getErrorMessage, handleApiResponse, retryWithBackoff } from "@/lib/error-utils";
import { NetworkStatus } from "@/app/components/NetworkStatus";
import { DismissibleAlert } from "@/app/components/DismissibleAlert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";
import { getTaskById } from "@/lib/api";

export default function TaskDetailPage(props) {
  // Unwrap params using React.use()
  const params = React.use(props.params);
  const taskId = params.id;
  
  const { staffInfo, token } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [includeStatusUpdate, setIncludeStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const fileInputRef = useRef(null);
  
  // Check if user is authenticated
  const isAuthenticated = useAuthCheck();

  // Fetch task data when component mounts
  useEffect(() => {
    if (isAuthenticated && token && taskId) {
      fetchTask();
    }
  }, [isAuthenticated, token, taskId]);

  // Fetch task from API
  const fetchTask = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching task with ID:", taskId);
      
      try {
        const taskData = await getTaskById(taskId);
        console.log("Task data received:", taskData);
        setTask(taskData);
      } catch (err) {
        if (err.status === 404) {
          notFound();
        }
        throw err;
      }
    } catch (err) {
      console.error("Error fetching task:", err);
      setError(getErrorMessage(err, "loading task details"));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    // Prevent staff from directly setting status to "completed"
    if (newStatus === "completed") {
      console.log("Staff cannot directly mark tasks as completed");
      setError("You don't have permission to mark tasks as completed. Please submit for review instead.");
      return;
    }
    
    try {
      // Use the full URL from the API example
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://00df-105-114-3-98.ngrok-free.app';
      
      console.log("Updating task status to:", newStatus);
      
      const response = await retryWithBackoff(async () => {
        const res = await fetch(`${apiUrl}/api/tasks/${taskId}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        });
        
        return handleApiResponse(res);
      });
      
      // Update local state
      setTask(prevTask => ({ ...prevTask, status: newStatus }));
      
      // Show success message
      setSuccessMessage(`Task status updated to ${statusOptions.find(s => s.value === newStatus)?.label || newStatus}`);
      
      // Clear any existing error
      setError("");
    } catch (err) {
      console.error("Error updating task status:", err);
      setError(getErrorMessage(err, "updating task status"));
      setSuccessMessage("");
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle file removal
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // If not authenticated, don't render anything (handled by useAuthCheck)
  if (!isAuthenticated) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-500">Loading task...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2"
            onClick={() => router.push("/staff/tasks")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Button>
          
          <DismissibleAlert 
            message={error} 
            onDismiss={() => setError("")}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Calculate if the task is overdue
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "completed";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <NetworkStatus />
        
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2"
            onClick={() => router.push("/staff/tasks")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={priorityBadges[task.priority]?.variant || "default"}
              className={priorityBadges[task.priority]?.className || ""}
            >
              {priorityBadges[task.priority]?.label || task.priority} Priority
            </Badge>
            
            {isOverdue && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </Badge>
            )}
          </div>
        </div>
        
        {error && (
          <DismissibleAlert 
            message={error} 
            onDismiss={() => setError("")}
          />
        )}
        
        {successMessage && (
          <DismissibleAlert 
            message={successMessage} 
            variant="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
            onDismiss={() => setSuccessMessage("")}
            autoHideDuration={5000} // Auto-hide after 5 seconds
          />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Task Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-base">{task.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Due Date</p>
                    <p className={`${isOverdue ? "text-red-500 font-medium" : ""}`}>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date Added</p>
                    <p>{new Date(task.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              {task.links && task.links.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Related Links</h3>
                  <ul className="space-y-2">
                    {task.links.map((link, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-gray-500" />
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {link.title || link.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {task.assignedTo && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned To</h3>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <p>
                      {task.assignedTo.firstName} {task.assignedTo.lastName} ({task.assignedTo.staffId})
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Task Status */}
          <Card>
            <CardHeader>
              <CardTitle>Task Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={task.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusOptions.find(s => s.value === task.status)?.color || "bg-gray-400"}`}></div>
                    <span>
                      {statusOptions.find(s => s.value === task.status)?.label || task.status}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions
                    .filter(status => status.value !== "completed")
                    .map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <div className="pt-4">
                <Button 
                  className="w-full"
                  variant={task.status === "review" ? "outline" : "default"}
                  onClick={() => handleStatusChange(task.status === "review" ? "in-progress" : "review")}
                >
                  {task.status === "review" ? (
                    "Mark as In Progress"
                  ) : (
                    "Mark as Ready for Review"
                  )}
                </Button>
              </div>
              
              <div className="pt-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Note: Only administrators can mark tasks as completed after review.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 