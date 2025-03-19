import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// In a real application, this would be replaced with a database
// For this example, we'll use a JSON file as a simple database
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'report-logs.json');

// Ensure the data directory exists
const ensureDataDirectoryExists = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Read logs from "database"
const getLogsFromDb = () => {
  ensureDataDirectoryExists();
  
  if (!fs.existsSync(DATA_FILE_PATH)) {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([]));
    return [];
  }
  
  const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
  return JSON.parse(rawData);
};

// Save logs to "database"
const saveLogsToDb = (logs) => {
  ensureDataDirectoryExists();
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(logs, null, 2));
};

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

// Handle pagination
const paginateLogs = (logs, searchParams) => {
  const page = parseInt(searchParams.page) || 1;
  const limit = parseInt(searchParams.limit) || 10;
  
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const results = {
    logs: logs.slice(startIndex, endIndex),
    pagination: {
      total: logs.length,
      page,
      limit,
      totalPages: Math.ceil(logs.length / limit)
    }
  };
  
  return results;
};

// GET handler - Get all logs with filtering and pagination
export async function GET(request) {
  try {
    // Debug logging
    console.log('GET /api/reports/logs request received');
    
    const { searchParams } = new URL(request.url);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    
    const logs = getLogsFromDb();
    console.log('Logs from DB:', logs.length ? `${logs.length} logs found` : 'No logs found');
    
    // Apply filters
    const filteredLogs = filterLogs(logs, Object.fromEntries(searchParams.entries()));
    console.log('Filtered logs:', filteredLogs.length);
    
    // For now, always return the logs array directly for simplicity
    return NextResponse.json(filteredLogs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report logs', details: error.message },
      { status: 500 }
    );
  }
}

// POST handler - Create a new log
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.task || !body.description || !body.department) {
      return NextResponse.json(
        { error: 'Missing required fields: task, description, and department are required' },
        { status: 400 }
      );
    }
    
    const logs = getLogsFromDb();
    
    // Create new log
    const newLog = {
      id: uuidv4(),
      date: body.date || new Date().toISOString(),
      task: body.task,
      description: body.description,
      status: body.status || 'pending',
      department: body.department,
      remark: body.remark || '',
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    logs.unshift(newLog); // Add to the beginning of the array
    saveLogsToDb(logs);
    
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error('Error creating log:', error);
    return NextResponse.json(
      { error: 'Failed to create report log' },
      { status: 500 }
    );
  }
} 