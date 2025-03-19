"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { AdminLayout } from "@/app/components/AdminLayout";
import { getReportLogs, createReportLog, updateReportLog, deleteReportLog, exportReportLogsToCSV, uploadReportLogFiles, deleteReportLogFile } from "@/lib/api";
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
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  
  // Static departments list
  const DEPARTMENTS = [
    "Electronic Unit",
    "Moulding Unit",
    "GIS",
    "Payload",
    "3D & CNC",
    "Health & Safety",
    "Pilots"
  ];
  
  // Department states - no need for loading state
  const [departments] = useState(DEPARTMENTS);
  
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
    department: DEPARTMENTS[0], // Initialize with first department
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

  // Fetch logs and departments when component mounts
  useEffect(() => {
    const initializeData = async () => {
      if (token) {
        await fetchLogs();
      }
    };
    
    initializeData();
  }, [token]);

  // Apply filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, statusFilter, departmentFilter, startDate, endDate]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError("");
    
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
      
      if (departmentFilter !== "all") {
        params.department = departmentFilter;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      // Log the request parameters for debugging
      console.log("Fetching logs with params:", params);
      
      try {
        const response = await getReportLogs(params);
        
        // Log the actual response for debugging
        console.log("API Response type:", typeof response);
        console.log("API Response:", response);
        
        // Super robust handling of any response format
        let logsData = [];
        
        if (Array.isArray(response)) {
          // Direct array response
          console.log("Processing array response");
          logsData = response;
        } else if (response && typeof response === 'object') {
          if (Array.isArray(response.logs)) {
            // Object with logs array
            console.log("Processing object with logs array");
            logsData = response.logs;
          } else {
            // Try to convert object to array if possible
            console.log("Attempting to convert object to array");
            const possibleArray = Object.values(response).find(val => Array.isArray(val));
            if (possibleArray) {
              logsData = possibleArray;
            } else {
              // Last resort - check if the object itself looks like a log
              if (response.id && response.task) {
                logsData = [response];
              } else {
                throw new Error("Could not extract logs data from response");
              }
            }
          }
        } else {
          throw new Error("Unexpected response format: " + (typeof response));
        }
        
        // At this point logsData should be an array
        console.log("Extracted logs data:", logsData);
        setLogs(logsData);
        setFilteredLogs(logsData);
        
        if (logsData.length === 0) {
          setError("No log entries found for the selected filters.");
        }
      } catch (apiError) {
        console.error("API Error:", apiError);
        throw apiError;
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err.message || "Failed to load logs. Please try again later.");
      setLogs([]);
      setFilteredLogs([]);
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
  
  const exportToCSV = async () => {
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
      
      if (departmentFilter !== "all") {
        params.department = departmentFilter;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      // Call the API to get CSV data
      const blob = await exportReportLogsToCSV(params);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `report_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting CSV:", err);
      setError("Failed to export CSV. Please try again later.");
    } finally {
      setIsLoading(false);
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

  // Handle file deletion from the file viewer
  const handleFileViewerDelete = async (fileId, fileName) => {
    setError(""); // Clear previous errors
    setSuccess(""); // Clear previous success messages
    
    try {
      console.log(`Deleting file ${fileId} (${fileName}) from file viewer`);
      
      // Call the API to delete the file
      await deleteReportLogFile(fileId);
      
      // Update the UI after successful deletion
      
      // 1. Update the selected files list
      setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
      
      // 2. Update the logs data to reflect the deletion
      setLogs(prevLogs => 
        prevLogs.map(log => {
          if (log.files && Array.isArray(log.files)) {
            return {
              ...log,
              files: log.files.filter(file => file.id !== fileId)
            };
          }
          return log;
        })
      );
      
      // Show success message
      setSuccess(`File "${fileName}" was successfully deleted.`);
      
      return true;
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error);
      setError(`Failed to delete file: ${error.message || "Unknown error"}`);
      return false;
    }
  };

  // Handle immediate file deletion
  const handleDeleteFile = async (fileId, fileName) => {
    setError(""); // Clear previous errors
    setSuccess(""); // Clear previous success messages
    
    try {
      console.log(`Deleting file ${fileId} (${fileName}) using endpoint: /reports/logs/files/${fileId}`);
      
      // Call the API to delete the file
      await deleteReportLogFile(fileId);
      
      // Update the UI after successful deletion
      setEditLog(prev => ({
        ...prev,
        files: prev.files.filter(file => file.id !== fileId)
      }));
      
      // Show success message
      setSuccess(`File "${fileName}" was successfully deleted.`);
      
      return true;
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error);
      setError(`Failed to delete file: ${error.message || "Unknown error"}`);
      return false;
    }
  };

  // Upload files to the server and attach them to a log
  const uploadFiles = async (files, logId) => {
    if (!files || !files.length || !logId) {
      console.log('No files to upload or missing logId');
      return [];
    }
    
    console.log(`Preparing to upload ${files.length} files for log ID: ${logId}`);
    
    const formData = new FormData();
    
    // Append each file to the FormData using the standardized "files" field name
    files.forEach(file => {
      formData.append('files', file);
      console.log(`Added file to FormData: ${file.name} (${formatFileSize(file.size)})`);
    });
    
    console.log(`Sending files to endpoint: /reports/logs/files?logId=${logId}`);
    
    try {
      // Call the API to upload the files
      const result = await uploadReportLogFiles(logId, formData);
      
      console.log(`File upload successful for log ${logId}:`, result);
      
      if (!result.files || !Array.isArray(result.files) || result.files.length === 0) {
        console.warn(`Server responded with success but no files were returned for log ${logId}`);
        return [];
      }
      
      return result.files;
    } catch (error) {
      console.error(`Error uploading files for log ${logId}:`, error);
      
      // Enhanced error message with more context
      const errorMessage = error.data?.message || error.message || "Unknown upload error";
      console.error(`Upload error details: ${errorMessage}`);
      
      // Rethrow with improved error message
      const enhancedError = new Error(`Failed to upload files: ${errorMessage}`);
      enhancedError.originalError = error;
      throw enhancedError;
    }
  };

  // Open file viewer dialog
  const openFileViewer = (files, taskName, logId) => {
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
    setError(""); // Clear any previous errors
    setSuccess(""); // Clear any previous success messages
    
    try {
      // Format the log data for API
      const formattedLog = {
        ...newLog,
        date: typeof newLog.date === 'object' && newLog.date instanceof Date 
          ? newLog.date.toISOString() 
          : new Date().toISOString()
      };
      
      // Create the log without files first
      console.log("Creating new report log:", formattedLog);
      const createdLog = await createReportLog(formattedLog);
      console.log("Log created successfully:", createdLog);
      
      // After successful log creation, handle file uploads separately
      await handleAddLogFiles(createdLog.id);
      
      // Refresh logs to include the new one
      await fetchLogs();
      
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
      setSelectedUploadFiles([]);
      resetFileInput();
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Error adding log:", err);
      setError(err.message || "Failed to add log. Please try again.");
      setSuccess(""); // Clear success message on error
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle file uploads for a newly created log
  const handleAddLogFiles = async (logId) => {
    try {
      // Upload files if any are selected
      if (selectedUploadFiles.length > 0) {
        try {
          console.log(`Uploading ${selectedUploadFiles.length} files for log ID: ${logId}`);
          const uploadedFiles = await uploadFiles(selectedUploadFiles, logId);
          console.log("Files uploaded successfully:", uploadedFiles);
          const actualUploadCount = Array.isArray(uploadedFiles) ? uploadedFiles.length : 0;
          setSuccess(`Log created successfully with ${actualUploadCount} file${actualUploadCount !== 1 ? 's' : ''} attached.`);
          return true;
        } catch (fileError) {
          console.error("Error uploading files:", fileError);
          setError(`Log created but files could not be uploaded: ${fileError.message || "Unknown error"}`);
          return false;
        }
      } else {
        setSuccess("Log created successfully. No files attached.");
        return true;
      }
    } catch (error) {
      console.error("Error handling log files:", error);
      setError(`Error handling files: ${error.message || "Unknown error"}`);
      return false;
    }
  };

  // Update existing log
  const handleUpdateLog = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    setError(""); // Clear any previous errors
    setSuccess(""); // Clear any previous success messages
    
    try {
      // Format the log data for API
      const formattedLog = {
        ...editLog,
        date: typeof editLog.date === 'object' && editLog.date instanceof Date 
          ? editLog.date.toISOString() 
          : new Date().toISOString()
      };
      
      // Update the log first (without file operations)
      console.log("Updating report log:", formattedLog);
      const updatedLog = await updateReportLog(editLog.id, formattedLog);
      console.log("Log updated successfully:", updatedLog);
      
      // After successful log update, handle file operations
      await handleUpdateLogFiles(updatedLog.id);
      
      // Refresh logs to include the updates
      await fetchLogs();
      
      // Reset form and close dialog
      setSelectedEditFiles([]);
      setFilesToRemove([]);
      resetEditFileInput();
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating log:", err);
      setError(err.message || "Failed to update log. Please try again.");
      setSuccess(""); // Clear success message on error
    } finally {
      setIsEditing(false);
    }
  };
  
  // Handle file operations for an updated log
  const handleUpdateLogFiles = async (logId) => {
    let successMessage = "Log updated successfully";
    let fileDeleteResults = { success: 0, failed: 0 };
    
    try {
      // Handle file removals if any
      if (filesToRemove.length > 0) {
        console.log(`Removing ${filesToRemove.length} files using endpoint: /reports/logs/files/{fileId}`);
        
        // Process files sequentially for better error handling
        for (const fileId of filesToRemove) {
          try {
            console.log(`Deleting file ${fileId} using endpoint: /reports/logs/files/${fileId}`);
            await deleteReportLogFile(fileId);
            fileDeleteResults.success++;
          } catch (err) {
            console.error(`Error deleting file ${fileId}:`, err);
            fileDeleteResults.failed++;
          }
        }
        
        console.log(`File deletion results: ${fileDeleteResults.success} successful, ${fileDeleteResults.failed} failed`);
      }
      
      // Upload new files if any are selected using the separate endpoint
      if (selectedEditFiles.length > 0) {
        try {
          console.log(`Uploading ${selectedEditFiles.length} files for log ID: ${logId} using endpoint: /reports/logs/files?logId=${logId}`);
          const uploadedFiles = await uploadFiles(selectedEditFiles, logId);
          console.log("Files uploaded successfully:", uploadedFiles);
          
          const actualUploadCount = Array.isArray(uploadedFiles) ? uploadedFiles.length : 0;
          if (actualUploadCount > 0) {
            successMessage += ` with ${actualUploadCount} new file${actualUploadCount !== 1 ? 's' : ''} added`;
          }
          
          if (fileDeleteResults.success > 0) {
            successMessage += `, ${fileDeleteResults.success} file${fileDeleteResults.success !== 1 ? 's' : ''} removed`;
          }
          
          if (fileDeleteResults.failed > 0) {
            successMessage += ` (${fileDeleteResults.failed} file deletion${fileDeleteResults.failed !== 1 ? 's' : ''} failed)`;
          }
          
          setSuccess(successMessage);
        } catch (fileError) {
          console.error("Error uploading files:", fileError);
          
          let errorMessage = `Log updated but new files could not be uploaded: ${fileError.message}`;
          
          if (fileDeleteResults.success > 0) {
            errorMessage += `. ${fileDeleteResults.success} file${fileDeleteResults.success !== 1 ? 's' : ''} were removed`;
          }
          
          if (fileDeleteResults.failed > 0) {
            errorMessage += ` (${fileDeleteResults.failed} file deletion${fileDeleteResults.failed !== 1 ? 's' : ''} failed)`;
          }
          
          setError(errorMessage);
          return false;
        }
      } else if (filesToRemove.length > 0) {
        // No uploads, only removals
        if (fileDeleteResults.success > 0) {
          successMessage += ` with ${fileDeleteResults.success} file${fileDeleteResults.success !== 1 ? 's' : ''} removed`;
        }
        
        if (fileDeleteResults.failed > 0) {
          successMessage += ` (${fileDeleteResults.failed} file deletion${fileDeleteResults.failed !== 1 ? 's' : ''} failed)`;
        }
        
        setSuccess(successMessage);
      } else {
        // No file changes
        setSuccess("Log updated successfully. No file changes made.");
      }
      
      return true;
    } catch (error) {
      console.error("Error handling log files:", error);
      setError(`Error handling files: ${error.message || "Unknown error"}`);
      return false;
    }
  };

  // Delete a log
  const handleDeleteLog = async () => {
    if (!logToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Call API to delete the log
      await deleteReportLog(logToDelete.id);
      
      // Refresh logs to reflect the deletion
      await fetchLogs();
      
      // Close the dialog
      setIsDeleteDialogOpen(false);
      setLogToDelete(null);
    } catch (err) {
      console.error("Error deleting log:", err);
      setError(err.message || "Failed to delete log. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadFile = async (fileUrl, fileName, fileId) => {
    // If we have a fileId, prioritize that for direct download (new approach)
    if (!fileId && !fileUrl) {
      console.error("No file ID or URL provided");
      setError("File information is missing. Cannot download the file.");
      return false;
    }
    
    try {
      // Set a temporary loading message
      setSuccess(`Downloading file: ${fileName}...`);
      
      let downloadUrl;
      
      if (fileId) {
        // Use the direct file endpoint with the file ID
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        downloadUrl = `${API_BASE_URL}/reports/logs/files/${fileId}`;
        console.log(`Downloading file using direct endpoint: ${downloadUrl}`);
      } else {
        // Fall back to the old URL method if file ID is not available
        downloadUrl = fileUrl;
        if (fileUrl.startsWith('/')) {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
          const pathWithoutApi = fileUrl.startsWith('/api/') ? fileUrl.substring(4) : fileUrl;
          downloadUrl = `${API_BASE_URL.replace(/\/$/, '')}${pathWithoutApi}`;
        }
        console.log(`Downloading file using URL method: ${downloadUrl}`);
      }
      
      // Prepare authentication headers
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      // Using fetch to create a proper request with auth headers
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
      
      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let downloadFileName = fileName;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (filenameMatch && filenameMatch[1]) {
          downloadFileName = filenameMatch[1];
        }
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      setSuccess(`Successfully downloaded: ${downloadFileName}`);
      return true;
    } catch (err) {
      console.error("Error downloading file:", err);
      setError(`Failed to download file: ${err.message || "Unknown error"}`);
      return false;
    }
  };

  // More robust function to open PDFs with authentication 
  const openAuthenticatedPdf = (url, authToken) => {
    // Create a hidden form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = '_blank';
    form.style.display = 'none';
    
    // Add the token as a hidden field
    const tokenField = document.createElement('input');
    tokenField.type = 'hidden';
    tokenField.name = 'token';
    tokenField.value = authToken || '';
    form.appendChild(tokenField);
    
    // Add a field to indicate this is for viewing
    const viewField = document.createElement('input');
    viewField.type = 'hidden';
    viewField.name = 'view';
    viewField.value = 'true';
    form.appendChild(viewField);
    
    // Submit the form
    document.body.appendChild(form);
    form.submit();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(form);
    }, 100);
  };

  // Handle PDF files specially - open in new tab for preview if possible
  const handlePdfFile = (fileUrl, fileName, fileId) => {
    if (!fileId && !fileUrl) {
      console.error("No file ID or URL provided");
      setError("File information is missing. Cannot open the PDF.");
      return;
    }
    
    try {
      let viewUrl;
      
      if (fileId) {
        // Use the direct file endpoint with the file ID
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        viewUrl = `${API_BASE_URL}/reports/logs/files/${fileId}`;
        console.log(`Opening PDF using direct endpoint: ${viewUrl}`);
        
        // For direct endpoints, we can use the simple window.open approach
        // since the browser will include cookies for same-origin requests
        if (token) {
          // Try using the more robust method for authenticated viewing
          openAuthenticatedPdf(viewUrl, token);
        } else {
          window.open(viewUrl, '_blank');
        }
      } else {
        // Fall back to the old URL method if file ID is not available
        viewUrl = fileUrl;
        if (fileUrl.startsWith('/')) {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
          const pathWithoutApi = fileUrl.startsWith('/api/') ? fileUrl.substring(4) : fileUrl;
          viewUrl = `${API_BASE_URL.replace(/\/$/, '')}${pathWithoutApi}`;
        }
        console.log(`Opening PDF using URL method: ${viewUrl}`);
        
        // For URL-based viewing, we'll use a simple window.open
        window.open(viewUrl, '_blank');
      }
      
      setSuccess(`Opening PDF: ${fileName} in a new tab`);
    } catch (err) {
      console.error("Error opening PDF:", err);
      setError(`Failed to open PDF: ${err.message || "Unknown error"}`);
      
      // Fallback to regular download if opening fails
      handleDownloadFile(fileUrl, fileName, fileId).catch(error => {
        console.error("Fallback download also failed:", error);
      });
    }
  };

  // Helper to check if a file is a PDF based on name or type
  const isPdfFile = (file) => {
    return (
      (file.fileName && file.fileName.toLowerCase().endsWith('.pdf')) || 
      (file.fileType && file.fileType.toLowerCase() === 'application/pdf')
    );
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Report Logs</h2>
            <p className="text-muted-foreground mt-1">
              View and manage daily task reports and logs
            </p>
          </div>
          
          <div className="flex gap-2 justst">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add New Log
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] w-[95vw] max-w-full">
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
                          {departments.map((dept) => (
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
                  
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
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
            <div className="flex justify-between items-start w-full">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 mt-0.5 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setError("")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
            <div className="flex justify-between items-start w-full">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 mt-0.5 mr-2 text-green-500" />
                <AlertDescription>{success}</AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-green-600 hover:text-green-800 hover:bg-green-100"
                onClick={() => setSuccess("")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
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
              <SelectTrigger className="w-[180px] max-w-full">
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
              <SelectTrigger className="w-[180px] max-w-full">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
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
              <span className="md:inline hidden">Reset Filters</span>
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
                    <TableHead className="w-[150px] hidden md:table-cell">Department</TableHead>
                    <TableHead className="w-[200px]">Task</TableHead>
                    <TableHead className="w-[350px] hidden md:table-cell">Description</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[150px] hidden md:table-cell">Remark</TableHead>
                    <TableHead className="w-[120px] hidden sm:table-cell">Files</TableHead>
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
                        <TableCell className="hidden md:table-cell">{log.department || "Unassigned"}</TableCell>
                        <TableCell className="font-medium">
                          {log.task}
                        </TableCell>
                        <TableCell className="max-w-[350px] whitespace-normal hidden md:table-cell">
                          {log.description}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={log.status} />
                        </TableCell>
                        <TableCell className="max-w-[150px] whitespace-normal hidden md:table-cell">
                          {log.remark}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {log.files && log.files.length > 0 ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={() => openFileViewer(log.files, log.task, log.id)}
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
                              {/* Add view details option for mobile */}
                              <DropdownMenuItem 
                                className="md:hidden"
                                onClick={() => {
                                  // Open a details dialog that shows the fields hidden on mobile
                                  alert(`
Department: ${log.department || "Unassigned"}
Description: ${log.description}
Remark: ${log.remark || "None"}
                                  `);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {/* Add files view option on mobile */}
                              {log.files && log.files.length > 0 && (
                                <>
                                  <DropdownMenuItem 
                                    className="sm:hidden"
                                    onClick={() => openFileViewer(log.files, log.task, log.id)}
                                  >
                                    <Paperclip className="h-4 w-4 mr-2" />
                                    View Files ({log.files.length})
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={async () => {
                                      // Download all files for this log
                                      if (!log.files || log.files.length === 0) return;
                                      
                                      setSuccess(`Starting download of ${log.files.length} files...`);
                                      
                                      // Track success and failure counts
                                      let successCount = 0;
                                      let failureCount = 0;
                                      
                                      // Process files one at a time
                                      for (const file of log.files) {
                                        try {
                                          // Using await to process files sequentially
                                          const result = await handleDownloadFile(file.fileUrl, file.fileName, file.id);
                                          if (result) {
                                            successCount++;
                                          } else {
                                            failureCount++;
                                          }
                                        } catch (error) {
                                          console.error(`Error downloading file ${file.fileName}:`, error);
                                          failureCount++;
                                        }
                                      }
                                      
                                      // Show final results
                                      if (failureCount === 0) {
                                        setSuccess(`Successfully downloaded all ${successCount} file${successCount !== 1 ? 's' : ''} from log "${log.task}".`);
                                      } else {
                                        setError(`Downloaded ${successCount} file${successCount !== 1 ? 's' : ''}, but ${failureCount} file${failureCount !== 1 ? 's' : ''} failed to download.`);
                                      }
                                    }}
                                  >
                                    <DownloadCloud className="h-4 w-4 mr-2" />
                                    Download All Files
                                  </DropdownMenuItem>
                                </>
                              )}
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
          <DialogContent className="sm:max-w-[550px] w-[95vw] max-w-full">
            <DialogHeader>
              <DialogTitle>Edit Report Log</DialogTitle>
              <DialogDescription>
                Update the selected report log details.
              </DialogDescription>
            </DialogHeader>
            
            {editLog && (
              <form onSubmit={handleUpdateLog} className="h-[500px] overflow-y-auto">
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
                        {departments.map((dept) => (
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
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => markFileForRemoval(file.id)}
                                    className="text-orange-600"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Mark for Deletion
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteFile(file.id, file.fileName)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Now
                                  </DropdownMenuItem>
                                  {isPdfFile(file) && file.fileUrl && (
                                    <DropdownMenuItem 
                                      onClick={() => handlePdfFile(file.fileUrl, file.fileName, file.id)}
                                      className="text-blue-600"
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      View PDF
                                    </DropdownMenuItem>
                                  )}
                                  {file.fileUrl && (
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        // Need to handle the async function properly
                                        handleDownloadFile(file.fileUrl, file.fileName, file.id)
                                          .catch(error => {
                                            console.error(`Error initiating download for ${file.fileName}:`, error);
                                            setError(`Failed to start download for ${file.fileName}: ${error.message || "Unknown error"}`);
                                          });
                                      }}
                                    >
                                      <DownloadCloud className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => markFileForRemoval(file.id)}
                                title="Mark for removal when saving"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {filesToRemove.length > 0 && (
                        <p className="text-xs text-amber-600">
                          {filesToRemove.length} file{filesToRemove.length > 1 ? 's' : ''} marked for deletion when you save changes
                        </p>
                      )}
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
                
                <DialogFooter className="flex-col sm:flex-row gap-2">
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
          <DialogContent className="sm:max-w-[600px] w-[95vw] max-w-full">
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
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{formatFileSize(file.fileSize)}</span>
                            {file.fileType && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100">
                                {file.fileType.split('/')[1] || file.fileType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPdfFile(file) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            title="View PDF in browser"
                            onClick={() => handlePdfFile(file.fileUrl, file.fileName, file.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title="Download file"
                          onClick={() => {
                            // Need to handle the async function properly
                            handleDownloadFile(file.fileUrl, file.fileName, file.id)
                              .catch(error => {
                                console.error(`Error initiating download for ${file.fileName}:`, error);
                                setError(`Failed to start download for ${file.fileName}: ${error.message || "Unknown error"}`);
                              });
                          }}
                        >
                          <DownloadCloud className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete file"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleFileViewerDelete(file.id, file.fileName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No files available</p>
              )}
            </ScrollArea>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsFileDialogOpen(false)}>
                Close
              </Button>
              {selectedFiles.length > 0 && (
                <Button 
                  onClick={async () => {
                    // Download all files sequentially for better reliability
                    setSuccess(`Starting download of ${selectedFiles.length} files...`);
                    
                    // Track success and failure counts
                    let successCount = 0;
                    let failureCount = 0;
                    
                    // Process files one at a time
                    for (const file of selectedFiles) {
                      try {
                        // Using await to process files sequentially
                        const result = await handleDownloadFile(file.fileUrl, file.fileName, file.id);
                        if (result) {
                          successCount++;
                        } else {
                          failureCount++;
                        }
                      } catch (error) {
                        console.error(`Error downloading file ${file.fileName}:`, error);
                        failureCount++;
                      }
                    }
                    
                    // Show final results
                    if (failureCount === 0) {
                      setSuccess(`Successfully downloaded all ${successCount} file${successCount !== 1 ? 's' : ''}.`);
                    } else {
                      setError(`Downloaded ${successCount} file${successCount !== 1 ? 's' : ''}, but ${failureCount} file${failureCount !== 1 ? 's' : ''} failed to download.`);
                    }
                  }}
                >
                  Download All ({selectedFiles.length})
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