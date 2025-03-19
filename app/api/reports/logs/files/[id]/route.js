import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// In a real application, this would be replaced with a database
// For this example, we'll use a JSON file as a simple database
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'report-logs.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'report-logs');

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

// DELETE handler - Delete a file from a report log
export async function DELETE(request, { params }) {
  try {
    console.log(`DELETE /api/reports/logs/files/${params.id} request received`);
    
    const fileId = params.id;
    const logs = getLogsFromDb();
    
    // Find which log contains this file
    let logIndex = -1;
    let fileIndex = -1;
    let fileToDelete = null;
    
    // Find the file in the logs
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if (!log.files) continue;
      
      const fIndex = log.files.findIndex(file => file.id === fileId);
      if (fIndex !== -1) {
        logIndex = i;
        fileIndex = fIndex;
        fileToDelete = log.files[fIndex];
        break;
      }
    }
    
    if (logIndex === -1 || fileIndex === -1 || !fileToDelete) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Remove file from log
    logs[logIndex].files.splice(fileIndex, 1);
    logs[logIndex].updatedAt = new Date().toISOString();
    
    // Save updated logs
    saveLogsToDb(logs);
    
    // Try to delete the actual file from disk
    try {
      const filePath = path.join(process.cwd(), 'public', fileToDelete.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('Error deleting file from disk:', fileError);
      // Don't fail the request if file deletion fails
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file', details: error.message },
      { status: 500 }
    );
  }
} 