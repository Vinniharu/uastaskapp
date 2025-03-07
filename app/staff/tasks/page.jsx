"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/app/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useAuthCheck } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  MoreHorizontal 
} from "lucide-react";
import { statusOptions, priorityBadges } from "@/lib/mock-data";
import { getErrorMessage, handleApiResponse, retryWithBackoff } from "@/lib/error-utils";
import { NetworkStatus } from "@/app/components/NetworkStatus";
import { DismissibleAlert } from "@/app/components/DismissibleAlert";

export default function TasksPage() {
  const { staffInfo, token } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active"); // Default to show only active tasks
  const [sortBy, setSortBy] = useState("dueDate"); // Default sort by deadline
  const [sortOrder, setSortOrder] = useState("asc"); // Default ascending order
  
  // Check if user is authenticated, redirect to login if not
  const isAuthenticated = useAuthCheck();

  // Fetch tasks when component mounts if authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchTasks();
    }
  }, [isAuthenticated, token]);

  // Apply filters and sorting whenever the dependencies change
  useEffect(() => {
    if (tasks.length > 0) {
      applyFiltersAndSort();
    }
  }, [tasks, searchTerm, priorityFilter, statusFilter, sortBy, sortOrder]);

  // Fetch tasks from API
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching tasks with token:", token ? "Token exists" : "No token");
      
      // Use the full URL from the API example
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://00df-105-114-3-98.ngrok-free.app';
      
      // Use retry with backoff for network resilience
      const response = await retryWithBackoff(async () => {
        const res = await fetch(`${apiUrl}/api/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        return handleApiResponse(res);
      });
      
      console.log("API response status:", response.status);
      
      const data = await response.json();
      console.log("Tasks data received:", data);
      
      // Ensure data is an array
      const tasksArray = Array.isArray(data) ? data : [data];
      setTasks(tasksArray);
      setError("");
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(getErrorMessage(err, "loading tasks"));
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let result = [...tasks];
    
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
    
    // Filter by status
    if (statusFilter === "active") {
      // Show all tasks except completed ones
      result = result.filter(task => task.status !== "completed");
    } else if (statusFilter !== "all") {
      // Show tasks with specific status
      result = result.filter(task => task.status === statusFilter);
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

  // Handle status change
  const handleStatusChange = async (taskId, newStatus) => {
    // Prevent staff from directly setting status to "completed"
    if (newStatus === "completed") {
      console.log("Staff cannot directly mark tasks as completed");
      setError("You don't have permission to mark tasks as completed. Please submit it for review.");
      return;
    }
    
    try {
      // Use the full URL from the API example
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://00df-105-114-3-98.ngrok-free.app';
      
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
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      // Show success message
      const taskTitle = tasks.find(task => task.id === taskId)?.title || 'Task';
      const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus;
      setSuccessMessage(`"${taskTitle}" status updated to ${statusLabel}`);
      
      // Clear any existing error
      setError("");
    } catch (err) {
      console.error("Error updating task status:", err);
      setError(getErrorMessage(err, "updating task status"));
      setSuccessMessage("");
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === "asc" ? "desc" : "asc");
  };

  // If not authenticated, don't render anything (handled by useAuthCheck)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <NetworkStatus />
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <div className="flex items-center gap-2">
            <Badge variant={statusFilter === "active" ? "success" : "outline"}>
              {statusFilter === "active" ? "Active Tasks" : "All Tasks"}
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
        
        <div className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
          <AlertCircle className="h-3 w-3" />
          <span>Note: To complete a task, submit it for review. Only administrators can mark tasks as completed.</span>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Priority</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Status</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Tasks</SelectItem>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Under Review</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <span>Sort By</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="createdAt">Date Added</SelectItem>
                <SelectItem value="dueDate">Deadline</SelectItem>
              </SelectContent>
            </Select>
            
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
            <p className="text-lg text-gray-500">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-gray-300" />
            <p className="text-lg text-gray-500">No tasks found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || priorityFilter !== "all" || statusFilter !== "active" 
                ? "Try adjusting your filters" 
                : "You have no active tasks"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due Date
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
                      <Select
                        value={task.status}
                        onValueChange={(value) => handleStatusChange(task.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusOptions.find(s => s.value === task.status)?.color || "bg-gray-400"}`}></div>
                            <span>
                              {statusOptions.find(s => s.value === task.status)?.label || task.status}
                            </span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                                <span>{status.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className={`${
                          new Date(task.dueDate) < new Date() ? "text-red-500" : ""
                        }`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/staff/tasks/${task.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, "review")}>
                            Submit for Review
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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