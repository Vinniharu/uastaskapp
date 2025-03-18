"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { AdminLayout } from "@/app/components/AdminLayout";
import { getReportLogs, createReportLog, updateReportLog, deleteReportLog } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, Download, Filter, Loader2, Search, AlertCircle, PlusCircle, Paperclip, File, DownloadCloud, X, FileText, FileImage, FileArchive, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Fallback date formatter in case date-fns has issues
const formatDate = (dateString) => {
  try {
    // Try using date-fns
    return format(new Date(dateString), "MMM d, yyyy");
  } catch (error) {
    // Fallback to simple JS date formatting
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString || "Unknown date";
    }
  }
};

// Sample departments
const DEPARTMENTS = [
  "Engineering",
  "Marketing",
  "Human Resources",
  "Finance",
  "Operations",
  "Customer Support",
  "Sales",
  "Research & Development",
  "Legal",
  "Product Management"
];

// Dummy data generator
const generateDummyLogs = () => {
  const dummyData = [];
  const statuses = ["completed", "in-progress", "pending", "failed"];
  const tasks = [
    "Website Redesign",
    "Monthly Financial Report",
    "Employee Onboarding",
    "Product Launch",
    "Customer Survey Analysis",
    "System Maintenance",
    "Marketing Campaign",
    "Inventory Audit",
    "Client Meeting Preparation",
    "Software Development Sprint"
  ];
  
  const descriptions = [
    "Redesigning the company website to improve user experience and mobile responsiveness.",
    "Preparing the monthly financial report detailing revenue, expenses, and projections for the upcoming quarter.",
    "Preparing onboarding materials and scheduling training sessions for new employees.",
    "Coordinating the launch of our new product line including press releases and promotional events.",
    "Analyzing survey results from our recent customer satisfaction survey and preparing recommendations.",
    "Scheduled maintenance of our core systems including database optimization and security updates.",
    "Planning and executing our Q2 marketing campaign across social media and email channels.",
    "Conducting a comprehensive inventory audit to reconcile physical stock with database records.",
    "Preparing presentation materials and agenda for the upcoming client meeting.",
    "Working on the current development sprint, implementing new features and fixing bugs."
  ];
  
  const remarks = [
    "Completed ahead of schedule",
    "Waiting for additional input",
    "Deadline extended by one week",
    "Need to follow up with team",
    "On track for timely completion",
    "Requires additional resources",
    "Successful outcome, positive feedback",
    "Delayed due to unforeseen complications",
    "Additional requirements added mid-project",
    "Working with external vendor on this task"
  ];

  const fileNames = [
    ["project_plan.pdf", "timeline.xlsx", "team_assignments.docx"],
    ["meeting_notes.docx", "action_items.pdf"],
    ["financial_report.xlsx", "budget_forecast.xlsx", "expense_analysis.pdf"],
    ["presentation.pptx", "demo_script.docx"],
    ["requirements.txt"],
    ["data_analysis.csv", "results_summary.pdf"],
    ["design_mockup.png", "style_guide.pdf", "logo_variants.zip"],
    ["client_feedback.pdf"],
    [], // Some entries won't have files
    ["code_review.md", "bug_report.xlsx", "release_notes.pdf"]
  ];
  
  // Generate 50 dummy logs
  for (let i = 0; i < 50; i++) {
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30)); // Random date in the last 30 days
    
    const hasFiles = Math.random() > 0.3; // 70% chance of having files
    const fileSet = hasFiles ? fileNames[Math.floor(Math.random() * fileNames.length)] : [];
    
    // Create file entries with URLs
    const files = fileSet.map(fileName => ({
      fileName,
      fileUrl: `/dummy-files/${fileName}`,
      fileType: getFileType(fileName),
      fileSize: Math.floor(Math.random() * 5000) + 10 // Random size between 10KB and 5MB
    }));
    
    dummyData.push({
      id: `dummy-${i + 1}`,
      date: randomDate.toISOString(),
      task: tasks[Math.floor(Math.random() * tasks.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
      remark: remarks[Math.floor(Math.random() * remarks.length)],
      files: files
    });
  }
  
  // Sort by date, most recent first
  return dummyData.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Helper function to determine file type based on extension
const getFileType = (fileName) => {
  if (!fileName) return null;
  
  const extension = fileName.split('.').pop().toLowerCase();
  
  // Document types
  if (['doc', 'docx', 'txt', 'rtf', 'pdf', 'md'].includes(extension)) {
    return 'document';
  }
  // Spreadsheet types
  else if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return 'spreadsheet';
  }
  // Presentation types
  else if (['ppt', 'pptx'].includes(extension)) {
    return 'presentation';
  }
  // Image types
  else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
    return 'image';
  }
  // Archive types
  else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return 'archive';
  }
  // Default
  return 'other';
};

// Helper to get file icon based on type
const FileIcon = ({ fileName }) => {
  const fileType = getFileType(fileName);
  
  switch (fileType) {
    case 'document':
      return <FileText className="h-4 w-4" />;
    case 'image':
      return <FileImage className="h-4 w-4" />;
    case 'archive':
      return <FileArchive className="h-4 w-4" />;
    default:
      return <File className="h-4 w-4" />;
  }
};

export default function ReportLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  // File viewing states
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedLogTitle, setSelectedLogTitle] = useState("");

  // Add new log states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState([]);
  const [newLog, setNewLog] = useState({
    date: new Date(),
    task: "",
    description: "",
    status: "pending",
    department: DEPARTMENTS[0],
    remark: "",
    files: []
  });

  // Edit log states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [selectedEditFiles, setSelectedEditFiles] = useState([]);
  const [filesToRemove, setFilesToRemove] = useState([]);

  // Delete log states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch logs when component mounts
  useEffect(() => {
    fetchLogs();
  }, [token]);

  // Apply filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, statusFilter, departmentFilter, startDate, endDate]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Prepare filter parameters
      const params = {};
      
      if (startDate) {
        params.startDate = startDate.toISOString();
      }
      
      if (endDate) {
        params.endDate = endDate.toISOString();
      }
      
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      
      try {
        const logsData = await getReportLogs(params);
        if (Array.isArray(logsData) && logsData.length > 0) {
          setLogs(logsData);
          setFilteredLogs(logsData);
        } else {
          // If API returns empty or invalid data, use dummy data
          const dummyLogs = generateDummyLogs();
          setLogs(dummyLogs);
          setFilteredLogs(dummyLogs);
        }
      } catch (apiError) {
        console.error("API Error, using dummy data:", apiError);
        // If API fails, use dummy data
        const dummyLogs = generateDummyLogs();
        setLogs(dummyLogs);
        setFilteredLogs(dummyLogs);
      }
      setError("");
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err.message || "Failed to load logs. Using sample data instead.");
      // Use dummy data as fallback
      const dummyLogs = generateDummyLogs();
      setLogs(dummyLogs);
      setFilteredLogs(dummyLogs);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.task?.toLowerCase().includes(term) || 
        log.description?.toLowerCase().includes(term) ||
        log.remark?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(log => log.status === statusFilter);
    }
    
    // Apply department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(log => log.department === departmentFilter);
    }
    
    // Apply date filters
    if (startDate) {
      filtered = filtered.filter(log => new Date(log.date) >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(log => new Date(log.date) <= endDate);
    }
    
    setFilteredLogs(filtered);
  };
  
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setStartDate(null);
    setEndDate(null);
    setFilteredLogs(logs);
  };
  
  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;
    
    try {
      // Create CSV header row
      const headers = ["Date", "Department", "Task", "Description", "Status Check", "Remark"];
      
      // Helper function to escape field values properly for CSV
      const escapeCSV = (field) => {
        if (field === null || field === undefined) return '""';
        // Convert to string and replace any double quotes with two double quotes
        const escaped = String(field).replace(/"/g, '""');
        // Wrap in quotes to handle commas and other special characters
        return `"${escaped}"`;
      };
      
      // Format date without commas for better Excel compatibility
      const formatDateForCSV = (dateString) => {
        try {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch (e) {
          return dateString || "";
        }
      };
      
      // Create CSV data rows with proper escaping
      const data = filteredLogs.map(log => [
        escapeCSV(formatDateForCSV(log.date)),
        escapeCSV(log.department || "Unassigned"),
        escapeCSV(log.task || ""),
        escapeCSV(log.description || ""),
        escapeCSV(log.status || ""),
        escapeCSV(log.remark || "")
      ]);
      
      // Combine header and data (also escape headers)
      const csvContent = [
        headers.map(escapeCSV).join(","),
        ...data.map(row => row.join(","))
      ].join("\n");
      
      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `report_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting to CSV:", err);
      setError("Failed to export data. Please try again.");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedUploadFiles(filesArray);
    }
  };

  const handleEditFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedEditFiles(filesArray);
    }
  };

  const resetFileInput = () => {
    setSelectedUploadFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetEditFileInput = () => {
    setSelectedEditFiles([]);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeSelectedEditFile = (index) => {
    setSelectedEditFiles(prev => prev.filter((_, i) => i !== index));
  };

  const markFileForRemoval = (fileId) => {
    // Add to files to remove list
    setFilesToRemove(prev => [...prev, fileId]);
    // Remove from displayed files
    setEditLog(prev => ({
      ...prev,
      files: prev.files.filter(file => file.id !== fileId)
    }));
  };

  // Simulate uploading multiple files to server
  const uploadFiles = async (files) => {
    // In a real application, you would upload the files to a server
    // and get URLs back. This is a simulation.
    return Promise.all(
      files.map(file => {
        return new Promise((resolve) => {
          // Simulate network delay
          setTimeout(() => {
            // Create a blob URL for demo purposes
            // In a real app, this would be a URL from your server/storage
            const fileUrl = URL.createObjectURL(file);
            resolve({
              fileName: file.name,
              fileUrl: fileUrl,
              fileType: getFileType(file.name),
              fileSize: file.size
            });
          }, 500);
        });
      })
    );
  };

  // Open file viewer dialog
  const openFileViewer = (files, taskName) => {
    setSelectedFiles(files);
    setSelectedLogTitle(taskName);
    setIsFileDialogOpen(true);
  };

  // Open edit dialog for a log
  const openEditDialog = (log) => {
    setEditLog({
      ...log,
      date: new Date(log.date)
    });
    setSelectedEditFiles([]);
    setFilesToRemove([]);
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (log) => {
    setLogToDelete(log);
    setIsDeleteDialogOpen(true);
  };

  // Add new log
  const handleAddLog = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Format the log data for API
      const formattedLog = {
        ...newLog,
        date: typeof newLog.date === 'object' && newLog.date instanceof Date 
          ? newLog.date.toISOString() 
          : new Date().toISOString()
      };
      
      // Upload files if any are selected
      if (selectedUploadFiles.length > 0) {
        try {
          const uploadedFiles = await uploadFiles(selectedUploadFiles);
          formattedLog.files = uploadedFiles;
        } catch (fileError) {
          console.error("Error uploading files:", fileError);
        }
      }
      
      // Call API to create the log
      try {
        const createdLog = await createReportLog(formattedLog);
        
        // Add the new log to our state
        setLogs(prevLogs => [createdLog, ...prevLogs]);
        setFilteredLogs(prevFilteredLogs => [createdLog, ...prevFilteredLogs]);
      } catch (apiError) {
        console.error("API error when creating log:", apiError);
        // If API fails, still add to local state for demo purposes
        const localLog = {
          ...formattedLog,
          id: Date.now().toString() // Generate a temporary ID
        };
        setLogs(prevLogs => [localLog, ...prevLogs]);
        setFilteredLogs(prevFilteredLogs => [localLog, ...prevFilteredLogs]);
      }
      
      // Reset form and close dialog
      setNewLog({
        date: new Date(),
        task: "",
        description: "",
        status: "pending",
        department: DEPARTMENTS[0],
        remark: "",
        files: []
      });
      resetFileInput();
      setIsAddDialogOpen(false);
      
    } catch (err) {
      console.error("Error adding log:", err);
      setError(err.message || "Failed to add log. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update existing log
  const handleUpdateLog = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    
    try {
      // Format the log data for API
      const formattedLog = {
        ...editLog,
        date: typeof editLog.date === 'object' && editLog.date instanceof Date 
          ? editLog.date.toISOString() 
          : new Date().toISOString()
      };
      
      // Upload new files if any are selected
      if (selectedEditFiles.length > 0) {
        try {
          const uploadedFiles = await uploadFiles(selectedEditFiles);
          formattedLog.files = [...(formattedLog.files || []), ...uploadedFiles];
        } catch (fileError) {
          console.error("Error uploading files:", fileError);
        }
      }
      
      // Add filesToRemove to the request if any
      if (filesToRemove.length > 0) {
        formattedLog.filesToRemove = filesToRemove;
      }
      
      // Call API to update the log
      try {
        const updatedLog = await updateReportLog(editLog.id, formattedLog);
        
        // Update the log in our state
        setLogs(prevLogs => prevLogs.map(log => 
          log.id === updatedLog.id ? updatedLog : log
        ));
        
        setFilteredLogs(prevLogs => prevLogs.map(log => 
          log.id === updatedLog.id ? updatedLog : log
        ));
      } catch (apiError) {
        console.error("API error when updating log:", apiError);
        // If API fails, still update in local state for demo purposes
        const updatedLogLocal = {
          ...formattedLog,
          id: editLog.id
        };
        
        setLogs(prevLogs => prevLogs.map(log => 
          log.id === updatedLogLocal.id ? updatedLogLocal : log
        ));
        
        setFilteredLogs(prevLogs => prevLogs.map(log => 
          log.id === updatedLogLocal.id ? updatedLogLocal : log
        ));
      }
      
      // Reset form and close dialog
      setEditLog(null);
      setFilesToRemove([]);
      resetEditFileInput();
      setIsEditDialogOpen(false);
      
    } catch (err) {
      console.error("Error updating log:", err);
      setError(err.message || "Failed to update log. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  // Delete a log
  const handleDeleteLog = async () => {
    if (!logToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Call API to delete the log
      try {
        await deleteReportLog(logToDelete.id);
        
        // Remove the log from our state
        setLogs(prevLogs => prevLogs.filter(log => log.id !== logToDelete.id));
        setFilteredLogs(prevLogs => prevLogs.filter(log => log.id !== logToDelete.id));
      } catch (apiError) {
        console.error("API error when deleting log:", apiError);
        // If API fails, still remove from local state for demo purposes
        setLogs(prevLogs => prevLogs.filter(log => log.id !== logToDelete.id));
        setFilteredLogs(prevLogs => prevLogs.filter(log => log.id !== logToDelete.id));
      }
      
      // Reset and close dialog
      setLogToDelete(null);
      setIsDeleteDialogOpen(false);
      
    } catch (err) {
      console.error("Error deleting log:", err);
      setError(err.message || "Failed to delete log. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadFile = (fileUrl, fileName) => {
    // For demo files with dummy paths, create and download a sample file
    if (fileUrl.startsWith('/dummy-files/')) {
      // Create a sample file with content
      const fileExtension = fileName.split('.').pop().toLowerCase();
      let fileContent = 'This is a sample file for demonstration purposes.\n';
      fileContent += `Filename: ${fileName}\n`;
      fileContent += `Generated on: ${new Date().toLocaleString()}\n`;

      // Create a blob with the content
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // For real files with valid URLs, just navigate to the URL
      window.open(fileUrl, '_blank');
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
          <p className="text-gray-500">Loading report logs...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Report Logs</h2>
            <p className="text-muted-foreground mt-1">
              View and manage daily task reports and logs
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add New Log
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Add New Report Log</DialogTitle>
                  <DialogDescription>
                    Create a new daily task report log.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddLog}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newLog.date ? formatDate(newLog.date) : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newLog.date}
                            onSelect={(date) => setNewLog({ ...newLog, date: date || new Date() })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="department">Department</Label>
                      <Select 
                        value={newLog.department}
                        onValueChange={(value) => setNewLog({ ...newLog, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="task">Task</Label>
                      <Input
                        id="task"
                        value={newLog.task}
                        onChange={(e) => setNewLog({ ...newLog, task: e.target.value })}
                        placeholder="Task name or ID"
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newLog.description}
                        onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                        placeholder="Detailed description of the task or activity"
                        required
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status Check</Label>
                      <Select 
                        value={newLog.status}
                        onValueChange={(value) => setNewLog({ ...newLog, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="remark">Remark</Label>
                      <Textarea
                        id="remark"
                        value={newLog.remark}
                        onChange={(e) => setNewLog({ ...newLog, remark: e.target.value })}
                        placeholder="Any additional notes or remarks"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="files">Attachments</Label>
                      <Input
                        id="files"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="flex-1"
                        multiple
                      />
                      
                      {selectedUploadFiles.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm font-medium">Selected files:</p>
                          <div className="max-h-[150px] overflow-y-auto rounded-md border p-2">
                            {selectedUploadFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-2">
                                  <FileIcon fileName={file.name} />
                                  <span className="text-sm truncate max-w-[300px]">{file.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({formatFileSize(file.size)})
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => removeSelectedFile(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={resetFileInput}
                            className="mt-2"
                          >
                            Clear All
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        resetFileInput();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Log"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by task, description or remark..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {startDate && endDate 
                    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                    : "Date Range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex flex-col sm:flex-row gap-2 p-3">
                  <div>
                    <p className="text-sm mb-2">Start Date</p>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </div>
                  <div>
                    <p className="text-sm mb-2">End Date</p>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => startDate && date < startDate}
                    />
                  </div>
                </div>
                <div className="border-t p-3 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}>
                    Clear
                  </Button>
                  <Button size="sm" onClick={() => setDateRangeOpen(false)}>Apply</Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[150px]">Department</TableHead>
                    <TableHead className="w-[200px]">Task</TableHead>
                    <TableHead className="w-[350px]">Description</TableHead>
                    <TableHead className="w-[130px]">Status Check</TableHead>
                    <TableHead className="w-[150px]">Remark</TableHead>
                    <TableHead className="w-[120px]">Attachments</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                        {logs.length === 0 
                          ? "No report logs found. Logs will appear here when available." 
                          : "No matching logs found. Try adjusting your filters."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <TableRow key={log.id || index}>
                        <TableCell className="font-medium">
                          {formatDate(log.date)}
                        </TableCell>
                        <TableCell>{log.department || "Unassigned"}</TableCell>
                        <TableCell className="font-medium">
                          {log.task}
                        </TableCell>
                        <TableCell className="max-w-[350px] whitespace-normal">
                          {log.description}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={log.status} />
                        </TableCell>
                        <TableCell className="max-w-[150px] whitespace-normal">
                          {log.remark}
                        </TableCell>
                        <TableCell>
                          {log.files && log.files.length > 0 ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={() => openFileViewer(log.files, log.task)}
                            >
                              <Paperclip className="h-4 w-4" />
                              <span className="mx-1">{log.files.length}</span>
                              <span>File{log.files.length > 1 ? 's' : ''}</span>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">No files</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(log)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(log)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Edit Log Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit Report Log</DialogTitle>
              <DialogDescription>
                Update the selected report log details.
              </DialogDescription>
            </DialogHeader>
            
            {editLog && (
              <form onSubmit={handleUpdateLog}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="edit-date"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editLog.date ? formatDate(editLog.date) : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editLog.date}
                          onSelect={(date) => setEditLog({ ...editLog, date: date || new Date() })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-department">Department</Label>
                    <Select 
                      value={editLog.department}
                      onValueChange={(value) => setEditLog({ ...editLog, department: value })}
                    >
                      <SelectTrigger id="edit-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-task">Task</Label>
                    <Input
                      id="edit-task"
                      value={editLog.task}
                      onChange={(e) => setEditLog({ ...editLog, task: e.target.value })}
                      placeholder="Task name or ID"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editLog.description}
                      onChange={(e) => setEditLog({ ...editLog, description: e.target.value })}
                      placeholder="Detailed description of the task or activity"
                      required
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status Check</Label>
                    <Select 
                      value={editLog.status}
                      onValueChange={(value) => setEditLog({ ...editLog, status: value })}
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-remark">Remark</Label>
                    <Textarea
                      id="edit-remark"
                      value={editLog.remark}
                      onChange={(e) => setEditLog({ ...editLog, remark: e.target.value })}
                      placeholder="Any additional notes or remarks"
                    />
                  </div>

                  {/* Current files */}
                  {editLog.files && editLog.files.length > 0 && (
                    <div className="grid gap-2">
                      <Label>Current Attachments</Label>
                      <div className="max-h-[150px] overflow-y-auto rounded-md border p-2">
                        {editLog.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <FileIcon fileName={file.fileName} />
                              <span className="text-sm truncate max-w-[300px]">{file.fileName}</span>
                              <span className="text-xs text-muted-foreground">
                                ({formatFileSize(file.fileSize)})
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => markFileForRemoval(file.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add new files */}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-files">Add New Attachments</Label>
                    <Input
                      id="edit-files"
                      type="file"
                      ref={editFileInputRef}
                      onChange={handleEditFileChange}
                      className="flex-1"
                      multiple
                    />
                    
                    {selectedEditFiles.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm font-medium">Files to add:</p>
                        <div className="max-h-[150px] overflow-y-auto rounded-md border p-2">
                          {selectedEditFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-2">
                                <FileIcon fileName={file.name} />
                                <span className="text-sm truncate max-w-[300px]">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({formatFileSize(file.size)})
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeSelectedEditFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetEditFileInput}
                          className="mt-2"
                        >
                          Clear All
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditLog(null);
                      setFilesToRemove([]);
                      resetEditFileInput();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isEditing}>
                    {isEditing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this log?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the report log
                {logToDelete && logToDelete.task && ` for "${logToDelete.task}"`} 
                and all its associated files.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setLogToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteLog}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* File Viewer Dialog */}
        <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Attachments</DialogTitle>
              <DialogDescription>
                Files attached to task: {selectedLogTitle}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[400px] rounded-md border p-4">
              {selectedFiles.length > 0 ? (
                <div className="space-y-4">
                  {selectedFiles.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-md border hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center rounded-md bg-gray-100">
                          <FileIcon fileName={file.fileName} />
                        </div>
                        <div>
                          <p className="font-medium">{file.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDownloadFile(file.fileUrl, file.fileName)}
                      >
                        <DownloadCloud className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No files available</p>
              )}
            </ScrollArea>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFileDialogOpen(false)}>
                Close
              </Button>
              {selectedFiles.length > 0 && (
                <Button 
                  onClick={() => {
                    // Download all files
                    selectedFiles.forEach(file => {
                      handleDownloadFile(file.fileUrl, file.fileName);
                    });
                  }}
                >
                  Download All
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

// Helper component for status badges
function StatusBadge({ status }) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
    case 'in-progress':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
    default:
      return <Badge variant="outline">{status || 'Unknown'}</Badge>;
  }
} 