import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// In a real application, this would be replaced with a database
// For this example, we'll use a JSON file as a simple database
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'report-logs.json');

// Read logs from "database"
const getLogsFromDb = () => {
  if (!fs.existsSync(DATA_FILE_PATH)) {
    return [];
  }
  
  const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
  return JSON.parse(rawData);
};

// Save logs to "database"
const saveLogsToDb = (logs) => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(logs, null, 2));
};

// GET handler - Get a specific log by ID
export async function GET(request, { params }) {
  try {
    console.log(`GET /api/reports/logs/${params.id} request received`);
    
    const logs = getLogsFromDb();
    const log = logs.find(l => l.id === params.id);
    
    if (!log) {
      return NextResponse.json(
        { error: 'Report log not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(log);
  } catch (error) {
    console.error('Error fetching report log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report log', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH handler - Update a specific log
export async function PATCH(request, { params }) {
  try {
    console.log(`PATCH /api/reports/logs/${params.id} request received`);
    
    const body = await request.json();
    const logs = getLogsFromDb();
    
    const logIndex = logs.findIndex(l => l.id === params.id);
    
    if (logIndex === -1) {
      return NextResponse.json(
        { error: 'Report log not found' },
        { status: 404 }
      );
    }
    
    // Update the log with the new data, maintaining existing fields
    const updatedLog = {
      ...logs[logIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    logs[logIndex] = updatedLog;
    saveLogsToDb(logs);
    
    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error('Error updating report log:', error);
    return NextResponse.json(
      { error: 'Failed to update report log', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE handler - Delete a specific log
export async function DELETE(request, { params }) {
  try {
    console.log(`DELETE /api/reports/logs/${params.id} request received`);
    
    const logs = getLogsFromDb();
    const logIndex = logs.findIndex(l => l.id === params.id);
    
    if (logIndex === -1) {
      return NextResponse.json(
        { error: 'Report log not found' },
        { status: 404 }
      );
    }
    
    // Remove the log
    logs.splice(logIndex, 1);
    saveLogsToDb(logs);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report log:', error);
    return NextResponse.json(
      { error: 'Failed to delete report log', details: error.message },
      { status: 500 }
    );
  }
} 