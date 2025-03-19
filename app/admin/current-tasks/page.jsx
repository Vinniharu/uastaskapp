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
  Plus,
  Filter,
  ArrowUpDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  X,
  Trash2
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getAllTasks, getAllStaff, updateTask, deleteTask } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Status options for filtering
const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" }
];

// Priority options for filtering
const priorityOptions = [
  { value: "all", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];

export default function CurrentTasks() {
  const router = useRouter();
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  
  // Sorting state
  const [sortField, setSortField] = useState("dueDate");
  const [sortDirection, setSortDirection] = useState("asc");

  const [editingTask, setEditingTask] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Add new state for delete dialog
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Fetch tasks and users when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        // Fetch all tasks
        const tasksData = await getAllTasks();
        setTasks(tasksData);
        setFilteredTasks(tasksData);
        
        // Fetch all users for assignee filter
        const usersData = await getAllStaff();
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks. Please try again later.");
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
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(task => task.status === statusFilter);
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
        case "status":
          valueA = a.status;
          valueB = b.status;
          break;
        case "assignee":
          valueA = a.assignedTo ? `${a.assignedTo.firstName} ${a.assignedTo.lastName}` : "";
          valueB = b.assignedTo ? `${b.assignedTo.firstName} ${b.assignedTo.lastName}` : "";
          break;
        case "dueDate":
        default:
          valueA = new Date(a.dueDate || 0);
          valueB = new Date(b.dueDate || 0);
          break;
      }
      
      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setFilteredTasks(result);
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter, sortField, sortDirection]);

  // Handle sort toggle
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800";
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

  // Format status text
  const formatStatus = (status) => {
    return status === "in-progress" 
      ? "In Progress" 
      : status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Open edit dialog for a task
  const handleEditTask = (task) => {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedToId: task.assignedTo ? task.assignedTo.id.toString() : "unassigned",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ""
    });
    setIsEditDialogOpen(true);
    setUpdateError("");
    setUpdateSuccess(false);
  };

  // Handle form field changes in edit dialog
  const handleEditFieldChange = (field, value) => {
    setEditingTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit task update
  const handleUpdateTask = async () => {
    setIsUpdating(true);
    setUpdateError("");
    setUpdateSuccess(false);
    
    try {
      // Format the data for API submission
      const formattedData = {
        ...editingTask,
        dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString() : undefined
      };
      
      // Handle assignedToId - set to null if unassigned, otherwise convert to number
      if (formattedData.assignedToId === "unassigned") {
        formattedData.assignedToId = null;
      } else if (formattedData.assignedToId) {
        formattedData.assignedToId = parseInt(formattedData.assignedToId, 10);
      }
      
      // Send the update to the API
      const updatedTask = await updateTask(editingTask.id, formattedData);
      
      // Update the task in the local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        )
      );
      
      setUpdateSuccess(true);
      
      // Close the dialog after a short delay
      setTimeout(() => {
        setIsEditDialogOpen(false);
        setEditingTask(null);
      }, 1500);
    } catch (err) {
      console.error("Error updating task:", err);
      setUpdateError(err.message || "Failed to update task. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete dialog open
  const handleDeleteTask = (task) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
    setDeleteError("");
    setDeleteSuccess(false);
  };

  // Submit task deletion
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    
    setIsDeleting(true);
    setDeleteError("");
    setDeleteSuccess(false);
    
    try {
      // Call delete API
      await deleteTask(taskToDelete.id);
      
      // Update the local state to remove the deleted task
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskToDelete.id));
      setFilteredTasks(prevFilteredTasks => prevFilteredTasks.filter(task => task.id !== taskToDelete.id));
      
      setDeleteSuccess(true);
      
      // Close the dialog after a short delay
      setTimeout(() => {
        setIsDeleteDialogOpen(false);
        setTaskToDelete(null);
      }, 1500);
    } catch (err) {
      console.error("Error deleting task:", err);
      setDeleteError(err.message || "Failed to delete task. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Current Tasks</h2>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all current tasks
            </p>
          </div>
          <Button 
            onClick={() => router.push("/admin/create-task")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create Task
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Task Management</CardTitle>
            <CardDescription>
              View and filter all current tasks in the system
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
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
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
            </div>
            
            {/* Tasks Table */}
            <div className="overflow-x-auto">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks found matching your filters</p>
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
                          onClick={() => toggleSort("status")}
                        >
                          Status
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
                          onClick={() => toggleSort("dueDate")}
                        >
                          Due Date
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 max-w-[200px] truncate">{task.title}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusBadge(task.status)}>
                            {formatStatus(task.status)}
                          </Badge>
                        </td>
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
                          {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditTask(task)}
                              className="inline-flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteTask(task)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
      
      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Make changes to the task details below.
            </DialogDescription>
          </DialogHeader>
          
          {updateError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{updateError}</AlertDescription>
            </Alert>
          )}
          
          {updateSuccess && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                Task updated successfully!
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Task Title
              </label>
              <Input
                id="title"
                value={editingTask?.title || ""}
                onChange={(e) => handleEditFieldChange("title", e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={editingTask?.description || ""}
                onChange={(e) => handleEditFieldChange("description", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Status
                </label>
                <Select
                  value={editingTask?.status || ""}
                  onValueChange={(value) => handleEditFieldChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.slice(1).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </label>
                <Select
                  value={editingTask?.priority || ""}
                  onValueChange={(value) => handleEditFieldChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.slice(1).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="assignedTo" className="text-sm font-medium">
                  Assign To
                </label>
                <Select
                  value={editingTask?.assignedToId || "unassigned"}
                  onValueChange={(value) => handleEditFieldChange("assignedToId", value === "unassigned" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName} ({user.staffId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium">
                  Due Date
                </label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={editingTask?.dueDate || ""}
                  onChange={(e) => handleEditFieldChange("dueDate", e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isUpdating}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleUpdateTask} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the task "{taskToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {deleteError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}
            {deleteSuccess && (
              <Alert variant="success" className="mb-4 bg-green-50 text-green-800 border border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Task deleted successfully!</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting || deleteSuccess}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Task'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 