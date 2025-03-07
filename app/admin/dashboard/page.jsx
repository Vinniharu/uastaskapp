"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/app/components/AdminLayout";
import { getAllTasks, getTaskStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Users, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";

// Colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const PRIORITY_COLORS = {
  low: '#00C49F',
  medium: '#FFBB28',
  high: '#FF8042'
};
const STATUS_COLORS = {
  pending: '#FFBB28',
  'in-progress': '#0088FE',
  review: '#8884d8',
  completed: '#00C49F'
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        // Fetch all tasks
        const tasksData = await getAllTasks();
        setTasks(tasksData);
        
        // Get recent tasks (last 5)
        const sortedTasks = [...tasksData].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setRecentTasks(sortedTasks.slice(0, 5));
        
        // Calculate statistics
        const statsData = await getTaskStats();
        setStats(statsData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token) {
      fetchData();
    }
  }, [token]);

  // Prepare data for status chart
  const statusData = stats ? [
    { name: 'Pending', value: stats.pending, color: STATUS_COLORS.pending },
    { name: 'In Progress', value: stats.inProgress, color: STATUS_COLORS['in-progress'] },
    { name: 'Review', value: stats.review, color: STATUS_COLORS.review },
    { name: 'Completed', value: stats.completed, color: STATUS_COLORS.completed }
  ] : [];

  // Prepare data for priority chart
  const priorityData = stats ? [
    { name: 'Low', value: stats.byPriority.low, color: PRIORITY_COLORS.low },
    { name: 'Medium', value: stats.byPriority.medium, color: PRIORITY_COLORS.medium },
    { name: 'High', value: stats.byPriority.high, color: PRIORITY_COLORS.high }
  ] : [];

  // Prepare data for assignee chart
  const assigneeData = stats ? Object.values(stats.byAssignee)
    .map(assignee => ({
      name: assignee.name,
      value: assignee.count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) : [];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Welcome to your task management dashboard
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Task Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-3xl font-bold">{stats?.total || 0}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-amber-500 mr-2" />
                <span className="text-3xl font-bold">{stats?.pending || 0}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-3xl font-bold">{stats?.inProgress || 0}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Completed Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-3xl font-bold">{stats?.completed || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="status">Task Status</TabsTrigger>
            <TabsTrigger value="priority">Task Priority</TabsTrigger>
            <TabsTrigger value="assignee">Top Assignees</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="mt-0">
            <Card className="bg-white shadow">
              <CardHeader>
                <CardTitle>Tasks by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="priority" className="mt-0">
            <Card className="bg-white shadow">
              <CardHeader>
                <CardTitle>Tasks by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={priorityData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                      <Bar dataKey="value" name="Tasks">
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assignee" className="mt-0">
            <Card className="bg-white shadow">
              <CardHeader>
                <CardTitle>Top Assignees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={assigneeData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={80} />
                      <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                      <Bar dataKey="value" name="Tasks" fill="#8884d8">
                        {assigneeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Tasks */}
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Title</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Priority</th>
                    <th className="text-left py-3 px-4 font-medium">Assignee</th>
                    <th className="text-left py-3 px-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((task) => (
                    <tr key={task.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{task.title}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'review' ? 'bg-purple-100 text-purple-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {task.status === 'in-progress' ? 'In Progress' : 
                           task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {task.assignedTo ? 
                          `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 
                          'Unassigned'}
                      </td>
                      <td className="py-3 px-4">{formatDate(task.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}


