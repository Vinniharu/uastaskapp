import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// In a real application, this would be replaced with a database
// For this example, we'll use a JSON file as a simple database
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'report-logs.json');

// Helper function to read logs from the "database"
const getLogsFromDb = () => {
  if (!fs.existsSync(DATA_FILE_PATH)) {
    return [];
  }
  
  try {
    const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading logs file:', error);
    return [];
  }
};

// Helper function to filter logs based on query parameters
const filterLogs = (logs, filters) => {
  let filtered = [...logs];
  
  // Filter by date range
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    filtered = filtered.filter(log => new Date(log.date) >= startDate);
  }
  
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    filtered = filtered.filter(log => new Date(log.date) <= endDate);
  }
  
  // Filter by status
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(log => log.status === filters.status);
  }
  
  // Filter by department
  if (filters.department && filters.department !== 'all') {
    filtered = filtered.filter(log => log.department === filters.department);
  }
  
  // Search in task, description and remark
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(log => 
      (log.task && log.task.toLowerCase().includes(searchTerm)) ||
      (log.description && log.description.toLowerCase().includes(searchTerm)) ||
      (log.remark && log.remark.toLowerCase().includes(searchTerm))
    );
  }
  
  return filtered;
};

// GET handler - Return filtered logs for PDF generation
export async function GET(request) {
  try {
    console.log('GET /api/reports/logs/export/pdf request received');
    
    const { searchParams } = new URL(request.url);
    console.log('Export PDF request with params:', Object.fromEntries(searchParams.entries()));
    
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
    console.log(`Found ${filteredLogs.length} logs for PDF export`);
    
    // Return JSON response with filtered logs
    return NextResponse.json({ logs: filteredLogs });
  } catch (error) {
    console.error('Error preparing PDF export data:', error);
    return NextResponse.json(
      { error: 'Failed to prepare PDF export data', details: error.message },
      { status: 500 }
    );
  }
} 