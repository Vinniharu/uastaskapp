"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/app/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Loader2,
  Search,
  ArrowUpDown,
  Eye,
  Calendar,
  CheckCircle,
  Clock
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getAllTasks, getAllUsers } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Priority options for filtering
const priorityOptions = [
  { value: "all", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];

export default function TaskHistory() {
  const router = useRouter();
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingTask, setViewingTask] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, last7days, last30days, last90days
  
  // Sorting state
  const [sortField, setSortField] = useState("completedAt");
  const [sortDirection, setSortDirection] = useState("desc");

  // Fetch tasks and users when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        // Fetch all tasks
        const tasksData = await getAllTasks();
        
        // Filter only completed tasks
        const completedTasks = tasksData.filter(task => task.status === "completed");
        
        setTasks(completedTasks);
        setFilteredTasks(completedTasks);
        
        // Fetch all users for assignee filter
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load task history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token) {
      fetchData();
    }
  }, [token]);

  // Apply filters and sorting whenever filter states change
  useEffect(() => {
    let result = [...tasks];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(term) || 
        task.description.toLowerCase().includes(term)
      );
    }
    
    // Apply priority filter
    if (priorityFilter !== "all") {
      result = result.filter(task => task.priority === priorityFilter);
    }
    
    // Apply assignee filter
    if (assigneeFilter !== "all") {
      result = result.filter(task => 
        task.assignedTo && task.assignedTo.id.toString() === assigneeFilter
      );
    }
    
    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let cutoffDate;
      
      switch (dateFilter) {
        case "last7days":
          cutoffDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "last30days":
          cutoffDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case "last90days":
          cutoffDate = new Date(now.setDate(now.getDate() - 90));
          break;
        default:
          cutoffDate = null;
      }
      
      if (cutoffDate) {
        result = result.filter(task => new Date(task.updatedAt) >= cutoffDate);
      }
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortField) {
        case "title":
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case "priority":
          valueA = a.priority;
          valueB = b.priority;
          break;
        case "assignee":
          valueA = a.assignedTo ? `${a.assignedTo.firstName} ${a.assignedTo.lastName}` : "";
          valueB = b.assignedTo ? `${b.assignedTo.firstName} ${b.assignedTo.lastName}` : "";
          break;
        case "completedAt":
        default:
          valueA = new Date(a.updatedAt || 0);
          valueB = new Date(b.updatedAt || 0);
          break;
      }
      
      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setFilteredTasks(result);
  }, [tasks, searchTerm, priorityFilter, assigneeFilter, dateFilter, sortField, sortDirection]);

  // Handle sort toggle
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Get priority badge styling
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-600 text-white font-semibold border border-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
      default:
        return "bg-green-100 text-green-800";
    }
  };

  // Open view dialog for a task
  const handleViewTask = (task) => {
    setViewingTask(task);
    setIsViewDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
          <p className="text-gray-500">Loading task history...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Task History</h2>
          <p className="text-muted-foreground mt-1">
            View completed tasks and their details
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Completed Tasks</CardTitle>
            <CardDescription>
              View and filter all completed tasks in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Tasks Table */}
            <div className="overflow-x-auto">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No completed tasks found matching your filters</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">
                        <button 
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("title")}
                        >
                          Title
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        <button 
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("priority")}
                        >
                          Priority
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        <button 
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("assignee")}
                        >
                          Assignee
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        <button 
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("completedAt")}
                        >
                          Completed Date
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr 
                        key={task.id} 
                        className={`border-b hover:bg-gray-50 ${task.priority === 'high' ? 'bg-red-50' : ''}`}
                      >
                        <td className="py-3 px-4 max-w-[200px] truncate">{task.title}</td>
                        <td className="py-3 px-4">
                          <Badge className={getPriorityBadge(task.priority)}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {task.assignedTo ? 
                            `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 
                            'Unassigned'}
                        </td>
                        <td className="py-3 px-4">
                          {formatDate(task.updatedAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewTask(task)}
                            className="inline-flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* View Task Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              Viewing completed task information
            </DialogDescription>
          </DialogHeader>
          
          {viewingTask && (
            <div className="mt-4">
              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Task Details</TabsTrigger>
                  <TabsTrigger value="history">Completion Info</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{viewingTask.title}</h3>
                    <Badge className={getPriorityBadge(viewingTask.priority)}>
                      {viewingTask.priority.charAt(0).toUpperCase() + viewingTask.priority.slice(1)} Priority
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="text-sm whitespace-pre-wrap p-3 bg-gray-50 rounded-md">
                      {viewingTask.description || "No description provided"}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Assigned To</h4>
                      <p className="text-sm">
                        {viewingTask.assignedTo ? 
                          `${viewingTask.assignedTo.firstName} ${viewingTask.assignedTo.lastName} ` : 
                          'Unassigned'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
                      <p className="text-sm">
                        {viewingTask.dueDate ? formatDate(viewingTask.dueDate) : 'No due date'}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500">Created By</h4>
                    <p className="text-sm">
                      {viewingTask.createdBy ? 
                        `${viewingTask.createdBy.firstName} ${viewingTask.createdBy.lastName} (ID: ${viewingTask.createdBy.staffId})` : 
                        'Unknown'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Created Date</h4>
                      <div className="text-sm flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(viewingTask.createdAt)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Completed Date</h4>
                      <div className="text-sm flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {formatDate(viewingTask.updatedAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <h4 className="text-sm font-medium text-gray-500">Task Timeline</h4>
                    <div className="border-l-2 border-gray-200 pl-4 space-y-4 py-2">
                      <div className="relative">
                        <div className="absolute -left-[21px] h-4 w-4 rounded-full bg-blue-500"></div>
                        <p className="text-sm font-medium">Task Created</p>
                        <p className="text-xs text-gray-500">{formatDate(viewingTask.createdAt)}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] h-4 w-4 rounded-full bg-green-500"></div>
                        <p className="text-sm font-medium">Task Completed</p>
                        <p className="text-xs text-gray-500">{formatDate(viewingTask.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 