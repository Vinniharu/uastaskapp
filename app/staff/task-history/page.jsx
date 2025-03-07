"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/app/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useAuthCheck } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowUpDown,
  Filter,
  Eye
} from "lucide-react";
import { statusOptions, priorityBadges } from "@/lib/mock-data";
import { getErrorMessage, handleApiResponse, retryWithBackoff } from "@/lib/error-utils";
import { NetworkStatus } from "@/app/components/NetworkStatus";
import { DismissibleAlert } from "@/app/components/DismissibleAlert";
import { CompletedTaskView } from "@/app/components/CompletedTaskView";

export default function TaskHistoryPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [completedTasks, setCompletedTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("completedAt");
  const [sortOrder, setSortOrder] = useState("desc"); // Default descending order for history
  
  // Check if user is authenticated, redirect to login if not
  const isAuthenticated = useAuthCheck();

  // Fetch completed tasks when component mounts if authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchCompletedTasks();
    }
  }, [isAuthenticated, token]);

  // Apply filters and sorting whenever the dependencies change
  useEffect(() => {
    if (completedTasks.length > 0) {
      applyFiltersAndSort();
    }
  }, [completedTasks, searchTerm, priorityFilter, sortBy, sortOrder]);

  // Fetch completed tasks from API
  const fetchCompletedTasks = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching completed tasks with token:", token ? "Token exists" : "No token");
      
      // Use the full URL from the API example
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://00df-105-114-3-98.ngrok-free.app';
      
      // Use retry with backoff for network resilience
      const response = await retryWithBackoff(async () => {
        // Explicitly filter for completed tasks only
        const res = await fetch(`${apiUrl}/api/tasks?status=completed`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        return handleApiResponse(res);
      });
      
      console.log("API response status:", response.status);
      
      const data = await response.json();
      console.log("Completed tasks data received:", data);
      
      // Ensure data is an array and filter to only include completed tasks
      const tasksArray = Array.isArray(data) ? data : [data];
      const completedTasksOnly = tasksArray.filter(task => task.status === "completed");
      setCompletedTasks(completedTasksOnly);
      setError("");
    } catch (err) {
      console.error("Error fetching completed tasks:", err);
      setError(getErrorMessage(err, "loading completed tasks"));
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let result = [...completedTasks];
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by priority
    if (priorityFilter !== "all") {
      result = result.filter(task => task.priority === priorityFilter);
    }
    
    // Sort tasks
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "priority":
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "createdAt":
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case "completedAt":
          // Use updatedAt as a proxy for completedAt
          comparison = new Date(a.updatedAt) - new Date(b.updatedAt);
          break;
        case "dueDate":
          comparison = new Date(a.dueDate) - new Date(b.dueDate);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    setFilteredTasks(result);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === "asc" ? "desc" : "asc");
  };
  
  // View task details
  const viewTaskDetails = (task) => {
    setSelectedTask(task);
  };
  
  // Go back to task list
  const backToTaskList = () => {
    setSelectedTask(null);
  };

  // If not authenticated, don't render anything (handled by useAuthCheck)
  if (!isAuthenticated) {
    return null;
  }
  
  // If a task is selected, show the task details view
  if (selectedTask) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <NetworkStatus />
          
          <CompletedTaskView 
            task={selectedTask} 
            onBack={backToTaskList} 
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <NetworkStatus />
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Task History</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
              Completed Tasks
            </Badge>
            <span className="text-sm text-muted-foreground">
              {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
            </span>
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
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search completed tasks..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="completedAt">Completion Date</option>
              <option value="title">Title</option>
              <option value="priority">Priority</option>
              <option value="createdAt">Date Added</option>
              <option value="dueDate">Due Date</option>
            </select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortOrder}
              title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-gray-500">Loading completed tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-gray-300" />
            <p className="text-lg text-gray-500">No completed tasks found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || priorityFilter !== "all" 
                ? "Try adjusting your filters" 
                : "You have no completed tasks yet"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due Date
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Completed
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={priorityBadges[task.priority]?.variant || "default"}
                        className={priorityBadges[task.priority]?.className || ""}
                      >
                        {priorityBadges[task.priority]?.label || task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                        <span>
                          {new Date(task.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewTaskDetails(task)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 