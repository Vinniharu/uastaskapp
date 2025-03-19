import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// In a real application, this would be replaced with a database
// For this example, we'll use a JSON file as a simple database
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'report-logs.json');

// Filter logs based on query parameters
const filterLogs = (logs, searchParams) => {
  let filtered = [...logs];
  
  if (searchParams.startDate) {
    const startDate = new Date(searchParams.startDate);
    filtered = filtered.filter(log => new Date(log.date) >= startDate);
  }
  
  if (searchParams.endDate) {
    const endDate = new Date(searchParams.endDate);
    filtered = filtered.filter(log => new Date(log.date) <= endDate);
  }
  
  if (searchParams.status) {
    filtered = filtered.filter(log => log.status === searchParams.status);
  }
  
  if (searchParams.department) {
    filtered = filtered.filter(log => log.department === searchParams.department);
  }
  
  if (searchParams.search) {
    const searchTerm = searchParams.search.toLowerCase();
    filtered = filtered.filter(log => 
      log.task?.toLowerCase().includes(searchTerm) || 
      log.description?.toLowerCase().includes(searchTerm) ||
      log.remark?.toLowerCase().includes(searchTerm)
    );
  }
  
  return filtered;
};

// Generate CSV content from logs
const generateCsv = (logs) => {
  // CSV Headers
  const headers = [
    'Date',
    'Department',
    'Task',
    'Description',
    'Status',
    'Remark',
    'Files Count'
  ];
  
  // Helper to escape and format CSV fields
  const escapeField = (field) => {
    if (field === null || field === undefined) return '';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };
  
  // Format date for CSV
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (e) {
      return dateString || '';
    }
  };
  
  // Generate CSV rows
  const rows = logs.map(log => {
    const date = formatDate(log.date);
    const department = log.department || '';
    const task = log.task || '';
    const description = log.description || '';
    const status = log.status || '';
    const remark = log.remark || '';
    const filesCount = log.files ? log.files.length : 0;
    
    return [
      escapeField(date),
      escapeField(department),
      escapeField(task),
      escapeField(description),
      escapeField(status),
      escapeField(remark),
      escapeField(filesCount)
    ].join(',');
  });
  
  // Combine headers and rows
  return [
    headers.map(escapeField).join(','),
    ...rows
  ].join('\n');
};

// GET handler - Export logs to CSV
export async function GET(request) {
  try {
    console.log('GET /api/reports/logs/export request received');
    
    const { searchParams } = new URL(request.url);
    console.log('Export request with params:', Object.fromEntries(searchParams.entries()));
    
    // Get logs from database
    let logs = [];
    
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        logs = JSON.parse(rawData);
      }
    } catch (error) {
      console.error('Error reading logs file:', error);
      return NextResponse.json(
        { error: 'Failed to read logs data', details: error.message },
        { status: 500 }
      );
    }
    
    // Apply filters
    const filteredLogs = filterLogs(logs, Object.fromEntries(searchParams.entries()));
    console.log(`Exporting ${filteredLogs.length} logs to CSV`);
    
    // Generate CSV content
    const csvContent = generateCsv(filteredLogs);
    
    // Create response with CSV content
    const response = new NextResponse(csvContent);
    
    // Set appropriate headers
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', `attachment; filename="report_logs_${new Date().toISOString().split('T')[0]}.csv"`);
    
    return response;
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV', details: error.message },
      { status: 500 }
    );
  }
} 