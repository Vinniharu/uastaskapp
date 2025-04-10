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
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Loader2
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createTask, getAllStaff } from "@/lib/api";
import RichTextEditor from "@/app/components/RichTextEditor";

const priorityLevels = [
  { value: "low", label: "Low", color: "text-green-500" },
  { value: "medium", label: "Medium", color: "text-yellow-500" },
  { value: "high", label: "High", color: "text-red-500" },
];

export default function CreateTask() {
  const router = useRouter();
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedToId: "",
    priority: "",
    dueDate: ""
  });

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await getAllStaff();
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load staff members. Please try again later.");
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Format the data for API submission
      const formattedData = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString()
      };
      
      // Convert assignedToId to number if it's a string
      if (formattedData.assignedToId && typeof formattedData.assignedToId === 'string') {
        formattedData.assignedToId = parseInt(formattedData.assignedToId, 10);
      }
      
      // Send the data to the API
      await createTask(formattedData);
      
      setSuccess(true);
      
      // Redirect to tasks list after creation
      setTimeout(() => {
        router.push("/admin/current-tasks");
      }, 1500);
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err.message || "Failed to create task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
            <CardDescription>
              Fill in the details below to create a new task and assign it to a staff member.
            </CardDescription>
          </CardHeader>
          
          {error && (
            <div className="px-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          
          {success && (
            <div className="px-6">
              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  Task created successfully! Redirecting...
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Task Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Task Title
                </label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Task Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Staff Assignment */}
                <div className="space-y-2">
                  <label htmlFor="assignedTo" className="text-sm font-medium">
                    Assign To
                  </label>
                  <Select
                    value={formData.assignedToId}
                    onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName} ({user.staffId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Level */}
                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium">
                    Priority Level
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((priority) => (
                        <SelectItem 
                          key={priority.value} 
                          value={priority.value}
                          className={priority.color}
                        >
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <label htmlFor="dueDate" className="text-sm font-medium">
                    Due Date
                  </label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
