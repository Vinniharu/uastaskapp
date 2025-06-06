"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { AdminLayout } from "@/app/components/AdminLayout";
import { getReportLogs, createReportLog, updateReportLog, deleteReportLog, exportReportLogsToCSV, exportReportLogsToPDF, uploadReportLogFiles, deleteReportLogFile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, Download, Filter, Loader2, Search, AlertCircle, PlusCircle, Paperclip, File, DownloadCloud, X, FileText, FileImage, FileArchive, Pencil, Trash2, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { DEPARTMENTS } from "@/data/department";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

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
  const editFileInputRef = useRef(null)
  
  // Department states - no need for loading state
  const [departments] = useState(DEPARTMENTS);

  // Properly parse staffInfo from sessionStorage
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    try {
      const staffInfoString = sessionStorage.getItem('staffInfo');
      if (staffInfoString) {
        const staffInfo = JSON.parse(staffInfoString);
        setUser(staffInfo);
      }
    } catch (error) {
      console.error("Error parsing user info from sessionStorage:", error);
    }
  }, []);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  // Export states
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [selectedFields, setSelectedFields] = useState({
    date: true,
    department: true,
    task: true,
    description: true,
    status: true,
    remark: true,
    filesCount: false
  });
  const [exporterName, setExporterName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

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

  // View details states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

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
      
      try {
        const response = await getReportLogs(params);
        
        // Super robust handling of any response format
        let logsData = [];
        
        if (Array.isArray(response)) {
          logsData = response;
        } else if (response && typeof response === 'object') {
          if (Array.isArray(response.logs)) {
            logsData = response.logs;
          } else {
            // Try to convert object to array if possible
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

  

  // Export report logs to PDF
  const exportToPDF = async () => {
    setIsExporting(true);
    setError(""); // Clear any previous errors
    
    try {
      // Show initial progress
      setSuccess("Starting PDF generation: 0%");
      setExportProgress(0);
      
      // Prepare filter parameters for client-side filtering
      const filterParams = {};
      
      if (startDate) {
        filterParams.startDate = startDate;
      }
      
      if (endDate) {
        filterParams.endDate = endDate;
      }
      
      if (statusFilter !== "all") {
        filterParams.status = statusFilter;
      }
      
      if (departmentFilter !== "all") {
        filterParams.department = departmentFilter;
      }
      
      if (searchTerm) {
        filterParams.search = searchTerm;
      }
      
      // Use the logs we already have and filter them locally instead of calling the API
      setSuccess("Filtering logs: 15%");
      setExportProgress(15);
      
      // Filter logs client-side
      let filteredData = [...logs];
      
      // Apply date filters
      if (filterParams.startDate) {
        filteredData = filteredData.filter(log => 
          new Date(log.date) >= filterParams.startDate
        );
      }
      
      if (filterParams.endDate) {
        filteredData = filteredData.filter(log => 
          new Date(log.date) <= filterParams.endDate
        );
      }
      
      // Apply status filter
      if (filterParams.status) {
        filteredData = filteredData.filter(log => 
          log.status === filterParams.status
        );
      }
      
      // Apply department filter
      if (filterParams.department) {
        filteredData = filteredData.filter(log => 
          log.department === filterParams.department
        );
      }
      
      // Apply search filter
      if (filterParams.search) {
        const term = filterParams.search.toLowerCase();
        filteredData = filteredData.filter(log => 
          (log.task && log.task.toLowerCase().includes(term)) ||
          (log.description && log.description.toLowerCase().includes(term)) ||
          (log.remark && log.remark.toLowerCase().includes(term))
        );
      }
      
      // Check if we have any logs after filtering
      if (filteredData.length === 0) {
        throw new Error("No logs found matching the selected filters");
      }
      
      setSuccess("Creating PDF document: 30%");
      setExportProgress(30);
      
      // Prepare the document and add headers
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Get user's full name from parsed staffInfo
      const userName = user ? `${user.fullName || ''}`.trim() : '';
      
      // Set document properties
      doc.setProperties({
        title: 'Briech UAS Report Logs',
        subject: 'Report Logs Export',
        author: exporterName || userName || 'Admin User',
        creator: 'Briech UAS Task Management System'
      });
      
      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      
      setSuccess("Building PDF header: 40%");
      setExportProgress(40);
      
      // Add company logo
      try {
        const logoUrl = '/logomain.png'; // Path to the company logo
        const logoWidth = 20; // Width of the logo in mm
        
        // Position the logo in the top left area
        const logoX = 15;
        const logoY = 15;
        
        // Use an image element to load the logo
        const img = new Image();
        img.src = logoUrl;
        
        // Wait for the image to load before adding it to the PDF
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => {
            console.error("Failed to load logo image");
            resolve(); // Continue even if logo fails to load
          };
        });
        
        // Add the logo to the PDF
        doc.addImage(img, 'JPEG', logoX, logoY, logoWidth, logoWidth * (img.height / img.width));
      } catch (logoError) {
        console.error("Error adding logo to PDF:", logoError);
        // Continue with PDF generation even if logo fails
      }
      
      // Add header - "Briech UAS Report Logs" - positioned to the right of logo
      doc.setFontSize(20);
      doc.setTextColor(0, 51, 102); // Dark blue
      doc.setFont('helvetica', 'bold');
      doc.text('Briech UAS Report Logs', pageWidth / 2 + 20, 25, { align: 'center' });
      
      // Add subtitle with date - also adjusted position
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100); // Gray
      doc.setFont('helvetica', 'normal');
      // Use the user's name from parsed staffInfo
      doc.text(`Generated on: ${new Date().toLocaleDateString()} by ${userName}`, pageWidth / 2 + 20, 33, { align: 'center' });
      
      setSuccess("Adding filter information: 50%");
      setExportProgress(50);
      
      // Add filter information
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0); // Black
      doc.setFont('helvetica', 'normal');
      
      let filterY = 45; // Increased Y position to avoid overlapping with logo
      const lineHeight = 5;
      
      if (filterParams.startDate && filterParams.endDate) {
        const formattedStartDate = new Date(filterParams.startDate).toLocaleDateString();
        const formattedEndDate = new Date(filterParams.endDate).toLocaleDateString();
        doc.text(`Date Range: ${formattedStartDate} to ${formattedEndDate}`, 15, filterY);
        filterY += lineHeight;
      }
      
      if (filterParams.search) {
        doc.text(`Search: "${filterParams.search}"`, 15, filterY);
        filterY += lineHeight;
      }
      
      if (filterParams.department) {
        doc.text(`Department: ${filterParams.department}`, 15, filterY);
        filterY += lineHeight;
      }
      
      if (filterParams.status) {
        doc.text(`Status: ${filterParams.status}`, 15, filterY);
        filterY += lineHeight;
      }
      
      setSuccess("Preparing table data: 60%");
      setExportProgress(60);
      
      // Prepare table headers and columns based on selected fields
      const headers = [];
      const columns = [];
      
      if (selectedFields.date) {
        headers.push('Date');
        columns.push('date');
      }
      
      if (selectedFields.department) {
        headers.push('Department');
        columns.push('department');
      }
      
      if (selectedFields.task) {
        headers.push('Task');
        columns.push('task');
      }
      
      if (selectedFields.description) {
        headers.push('Description');
        columns.push('description');
      }
      
      if (selectedFields.status) {
        headers.push('Status');
        columns.push('status');
      }
      
      if (selectedFields.remark) {
        headers.push('Remark');
        columns.push('remark');
      }
      
      if (selectedFields.filesCount) {
        headers.push('Files');
        columns.push('filesCount');
      }
      
      // Prepare table data
      const tableData = filteredData.map(log => {
        const row = [];
        
        columns.forEach(col => {
          let value = '';
          
          if (col === 'date') {
            value = formatDate(log.date);
          } else if (col === 'filesCount') {
            value = log.files ? log.files.length.toString() : '0';
          } else if (col === 'status') {
            // Format status with proper capitalization
            const status = log.status || '';
            value = status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ');
          } else {
            value = log[col] || '';
          }
          
          // No truncation for PDF export - use full text for all fields
          row.push(value);
        });
        
        return row;
      });
      
      setSuccess("Generating table layout: 75%");
      setExportProgress(75);
      
      // Calculate column widths based on content and headers
      let columnWidths = {};
      
      // Configure widths for specific columns
      if (selectedFields.date) {
        columnWidths[headers.indexOf('Date')] = 20;
      }
      
      if (selectedFields.department) {
        columnWidths[headers.indexOf('Department')] = 25;
      }
      
      if (selectedFields.task) {
        columnWidths[headers.indexOf('Task')] = 35;
      }
      
      if (selectedFields.status) {
        columnWidths[headers.indexOf('Status')] = 20;
      }
      
      if (selectedFields.filesCount) {
        columnWidths[headers.indexOf('Files')] = 10;
      }
      
      setSuccess("Creating table in PDF: 85%");
      setExportProgress(85);
      
      // Add the table using the autoTable plugin
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
          lineWidth: 0.1,
          halign: 'left',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [0, 71, 171],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250]
        },
        // Set column widths
        columnStyles: columnWidths,
        // Handle long text properly
        rowPageBreak: 'auto',
        bodyStyles: {
          minCellHeight: 15
        },
        // Set specific styles for description and remark columns
        willDrawCell: function(data) {
          if (data.column.dataKey === headers.indexOf('Description') || 
              data.column.dataKey === headers.indexOf('Remark')) {
            data.cell.styles.cellWidth = 'wrap';
            data.cell.styles.minCellHeight = 20;
          }
        },
        // Additional options
        didDrawPage: function(data) {
          // Add footer on each page
          let str = `Page ${data.pageNumber} of ${data.pageCount} | Briech UAS Task Management System`;
          let footerX = data.settings.margin.left;
          let footerY = doc.internal.pageSize.getHeight() - 10;
          
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(str, pageWidth / 2, footerY, { align: 'center' });
        }
      });
      
      setSuccess("Finalizing PDF: 95%");
      setExportProgress(95);
      
      // Save and download the PDF with company name and date
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `Briech_UAS_Report_Logs_${currentDate}.pdf`;
      doc.save(fileName);
      
      // Close export dialog
      setIsExportDialogOpen(false);
      
      // Success message
      setSuccess(`PDF export completed successfully: ${fileName}`);
      setExportProgress(100);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      setError(err.message || "Failed to export PDF. Please try again later.");
      setExportProgress(0);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Function to handle export based on selected type
  const handleExport = async () => {
    if (exportType === 'csv') {
      await exportToCSV();
    } else {
      await exportToPDF();
    }
    
    // We don't need to close the dialog here as it's handled in the exportToPDF/exportToCSV functions
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

  // Handle file deletion from any source
  const handleFileDelete = async (fileId, fileName, sourceContext = 'general') => {
    setError(""); // Clear previous errors
    setSuccess(""); // Clear previous success messages
    
    try {
      await deleteReportLogFile(fileId);
      
      // Update UI based on where deletion was triggered from
      if (sourceContext === 'fileViewer') {
        setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
      } else if (sourceContext === 'editor') {
        setEditLog(prev => ({
          ...prev,
          files: prev.files.filter(file => file.id !== fileId)
        }));
      }
      
      // Update the logs data to reflect the deletion regardless of source
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
      
      setSuccess(`File "${fileName}" was successfully deleted.`);
      return true;
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error);
      setError(`Failed to delete file: ${error.message || "Unknown error"}`);
      return false;
    }
  };

  // Handle file downloads
  const handleDownloadFile = async (fileUrl, fileName, fileId) => {
    if (!fileId && !fileUrl) {
      setError("File information is missing. Cannot download the file.");
      return false;
    }
    
    try {
      setSuccess(`Downloading file: ${fileName}...`);
      
      // Prioritize file ID for direct downloads
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      let downloadUrl = fileId 
        ? `${API_BASE_URL}/reports/logs/files/${fileId}`
        : fileUrl.startsWith('/') 
          ? `${API_BASE_URL.replace(/\/$/, '')}${fileUrl.startsWith('/api/') ? fileUrl.substring(4) : fileUrl}`
          : fileUrl;
      
      // Prepare authentication headers
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
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
      
      // Create a blob and trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFileName;
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

  // Helper for downloading multiple files
  const handleBulkDownload = async (files) => {
    if (!files || files.length === 0) return;
    
    setSuccess(`Starting download of ${files.length} files...`);
    
    // Track success and failure counts
    let successCount = 0;
    let failureCount = 0;
    
    // Process files sequentially for better reliability
    for (const file of files) {
      try {
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
  };

  // Upload files to the server and attach them to a log
  const uploadFiles = async (files, logId) => {
    if (!files || !files.length || !logId) {
      console.log('No files to upload or missing logId');
      return [];
    }
    
    const formData = new FormData();
    
    // Append each file to the FormData using the standardized "files" field name
    files.forEach(file => {
      formData.append('files', file);
    });
    
    try {
      // Call the API to upload the files
      const result = await uploadReportLogFiles(logId, formData);
      
      if (!result.files || !Array.isArray(result.files) || result.files.length === 0) {
        console.warn(`Server responded with success but no files were returned for log ${logId}`);
        return [];
      }
      
      return result.files;
    } catch (error) {
      console.error(`Error uploading files for log ${logId}:`, error);
      
      // Enhanced error message with more context
      const errorMessage = error.data?.message || error.message || "Unknown upload error";
      
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

  // Open view details dialog
  const openViewDialog = (log) => {
    setSelectedLog(log);
    setIsViewDialogOpen(true);
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

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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

  // Export Dialog (Modal)
  const ExportDialog = () => {
    // Use a ref to close dialog
    const closeDialogRef = useRef(null);

    // Use effect to set user name when dialog opens
    useEffect(() => {
      if (isExportDialogOpen && user) {
        const fullName = user.fullName || '';
        if (fullName) {
          setExporterName(fullName);
        }
      }
    }, [isExportDialogOpen, user]);

    // Function to close the dialog
    const closeDialog = () => {
      setIsExportDialogOpen(false);
      setSelectedFields({
        date: true,
        department: true,
        task: true,
        description: true,
        status: true,
        remark: true,
        filesCount: false
      });
    };

    return (
      <Dialog open={isExportDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Report Logs</DialogTitle>
            <DialogDescription>
              Export your report logs to your preferred format.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <Tabs defaultValue="pdf" className="w-full" value={exportType} onValueChange={setExportType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pdf">
                  <FileText className="mr-2 h-4 w-4" /> PDF
                </TabsTrigger>
                <TabsTrigger value="csv">
                  <FileText className="mr-2 h-4 w-4" /> CSV
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pdf" className="space-y-4 mt-3">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="exporterName">Your Name</Label>
                    <Input
                      id="exporterName"
                      value={exporterName}
                      onChange={(e) => setExporterName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Select Fields to Include</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="date" 
                          checked={selectedFields.date} 
                          onCheckedChange={(checked) => 
                            setSelectedFields({...selectedFields, date: !!checked})
                          }
                        />
                        <Label htmlFor="date" className="cursor-pointer">Date</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="department" 
                          checked={selectedFields.department} 
                          onCheckedChange={(checked) => 
                            setSelectedFields({...selectedFields, department: !!checked})
                          }
                        />
                        <Label htmlFor="department" className="cursor-pointer">Department</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="task" 
                          checked={selectedFields.task} 
                          onCheckedChange={(checked) => 
                            setSelectedFields({...selectedFields, task: !!checked})
                          }
                        />
                        <Label htmlFor="task" className="cursor-pointer">Task</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="description" 
                          checked={selectedFields.description} 
                          onCheckedChange={(checked) => 
                            setSelectedFields({...selectedFields, description: !!checked})
                          }
                        />
                        <Label htmlFor="description" className="cursor-pointer">Description</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="status" 
                          checked={selectedFields.status} 
                          onCheckedChange={(checked) => 
                            setSelectedFields({...selectedFields, status: !!checked})
                          }
                        />
                        <Label htmlFor="status" className="cursor-pointer">Status</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="remark" 
                          checked={selectedFields.remark} 
                          onCheckedChange={(checked) => 
                            setSelectedFields({...selectedFields, remark: !!checked})
                          }
                        />
                        <Label htmlFor="remark" className="cursor-pointer">Remark</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="filesCount" 
                          checked={selectedFields.filesCount} 
                          onCheckedChange={(checked) => 
                            setSelectedFields({...selectedFields, filesCount: !!checked})
                          }
                        />
                        <Label htmlFor="filesCount" className="cursor-pointer">Files Count</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Applied Filters</Label>
                    <div className="text-sm text-gray-500 border rounded p-3 bg-gray-50">
                      {departmentFilter !== 'all' && (
                        <div><span className="font-medium">Department:</span> {departmentFilter}</div>
                      )}
                      {statusFilter !== 'all' && (
                        <div><span className="font-medium">Status:</span> {statusFilter}</div>
                      )}
                      {(startDate || endDate) && (
                        <div>
                          <span className="font-medium">Date Range:</span> 
                          {startDate ? formatDate(startDate) : 'Any'} to {endDate ? formatDate(endDate) : 'Any'}
                        </div>
                      )}
                      {searchTerm && (
                        <div><span className="font-medium">Search:</span> "{searchTerm}"</div>
                      )}
                      {departmentFilter === 'all' && statusFilter === 'all' && !startDate && !endDate && !searchTerm && (
                        <div>No filters applied</div>
                      )}
                    </div>
                  </div>
                  
                  {isExporting && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Export Progress</Label>
                        <span className="text-sm text-gray-500">{exportProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${exportProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                </div>
              </TabsContent>
              
              <TabsContent value="csv" className="space-y-4 mt-3">
                <div className="space-y-2">
                  <Label>Applied Filters</Label>
                  <div className="text-sm text-gray-500 border rounded p-3 bg-gray-50">
                    {departmentFilter !== 'all' && (
                      <div><span className="font-medium">Department:</span> {departmentFilter}</div>
                    )}
                    {statusFilter !== 'all' && (
                      <div><span className="font-medium">Status:</span> {statusFilter}</div>
                    )}
                    {(startDate || endDate) && (
                      <div>
                        <span className="font-medium">Date Range:</span> 
                        {startDate ? formatDate(startDate) : 'Any'} to {endDate ? formatDate(endDate) : 'Any'}
                      </div>
                    )}
                    {searchTerm && (
                      <div><span className="font-medium">Search:</span> "{searchTerm}"</div>
                    )}
                    {departmentFilter === 'all' && statusFilter === 'all' && !startDate && !endDate && !searchTerm && (
                      <div>No filters applied</div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="ghost" onClick={closeDialog} type="button" ref={closeDialogRef}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {exportType === 'pdf' ? (
                <Button 
                  type="button" 
                  onClick={exportToPDF} 
                  disabled={isExporting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isExporting ? "Exporting..." : "Export to PDF"}
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={exportToCSV} 
                  disabled={isExporting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isExporting ? "Exporting..." : "Export to CSV"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

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
                        className="min-h-[150px]"
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
            
            {/* Export Button */}
            <Button 
              variant="outline" 
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            {/* Render the Export Dialog */}
            <ExportDialog />
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
                          <div className="group relative">
                            <span className="cursor-pointer">{truncateText(log.description)}</span>
                            <div className="absolute hidden group-hover:block bg-white p-2 rounded-md shadow-lg border z-10 w-[300px]">
                              {log.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={log.status} />
                        </TableCell>
                        <TableCell className="max-w-[150px] whitespace-normal hidden md:table-cell">
                          <div className="group relative">
                            <span className="cursor-pointer">{truncateText(log.remark, 50)}</span>
                            <div className="absolute hidden group-hover:block bg-white p-2 rounded-md shadow-lg border z-10 w-[200px]">
                              {log.remark || 'No remark'}
                            </div>
                          </div>
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
                              <DropdownMenuItem onClick={() => openViewDialog(log)}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
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
                                      handleBulkDownload(log.files);
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
                      className="min-h-[150px]"
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
                                    onClick={() => handleFileDelete(file.id, file.fileName, 'editor')}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Now
                                  </DropdownMenuItem>
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
                          onClick={() => handleFileDelete(file.id, file.fileName, 'fileViewer')}
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
                  onClick={() => handleBulkDownload(selectedFiles)}
                >
                  Download All ({selectedFiles.length})
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px] w-[95vw] max-w-full">
            <DialogHeader>
              <DialogTitle>Report Log Details</DialogTitle>
              <DialogDescription>
                Detailed information for task: {selectedLog?.task}
              </DialogDescription>
            </DialogHeader>
            
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p>{formatDate(selectedLog.date)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p>{selectedLog.department || "Unassigned"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <StatusBadge status={selectedLog.status} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Files</Label>
                    <p>{selectedLog.files?.length || 0} file{selectedLog.files?.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Task</Label>
                  <p className="mt-1">{selectedLog.task}</p>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <div className="mt-1 p-3 rounded-md bg-muted">
                    <p className="whitespace-pre-wrap">{selectedLog.description || "No description"}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Remark</Label>
                  <div className="mt-1 p-3 rounded-md bg-muted">
                    <p className="whitespace-pre-wrap">{selectedLog.remark || "No remark"}</p>
                  </div>
                </div>
                
                {selectedLog.files && selectedLog.files.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Attachments</Label>
                    <div className="mt-2 space-y-2">
                      {selectedLog.files.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 rounded-md border"
                        >
                          <div className="flex items-center gap-2">
                            <FileIcon fileName={file.fileName} />
                            <span>{file.fileName}</span>
                            <span className="text-xs text-muted-foreground">
                              ({formatFileSize(file.fileSize)})
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadFile(file.fileUrl, file.fileName, file.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
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
      return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Completed</span>;
    case 'in-progress':
      return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">In Progress</span>;
    case 'pending':
      return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">Pending</span>;
    case 'failed':
      return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Failed</span>;
    default:
      return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800">{status || 'Unknown'}</span>;
  }
} 