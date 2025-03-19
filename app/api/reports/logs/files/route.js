import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// In a real application, this would be replaced with a database
// For this example, we'll use a JSON file as a simple database
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'report-logs.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'report-logs');

// Ensure the uploads directory exists
const ensureUploadsDirectoryExists = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
};

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

// Helper to get file type based on extension
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

// POST handler - Upload files to a report log
export async function POST(request) {
  try {
    console.log('POST /api/reports/logs/files request received');
    
    ensureUploadsDirectoryExists();
    
    const formData = await request.formData();
    const logId = formData.get('logId');
    
    if (!logId) {
      return NextResponse.json(
        { error: 'Missing logId parameter' },
        { status: 400 }
      );
    }
    
    console.log(`Uploading files for log ID: ${logId}`);
    
    // Get all files from the form data
    const files = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key !== 'logId') {
        files.push(value);
      }
    }
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }
    
    // Get logs from database
    const logs = getLogsFromDb();
    const logIndex = logs.findIndex(log => log.id === logId);
    
    if (logIndex === -1) {
      return NextResponse.json(
        { error: 'Report log not found' },
        { status: 404 }
      );
    }
    
    // Process each file
    const uploadedFiles = [];
    
    for (const file of files) {
      const fileName = file.name;
      const fileId = uuidv4();
      const fileExtension = fileName.split('.').pop();
      const safeFileName = `${fileId}.${fileExtension}`;
      const filePath = path.join(UPLOADS_DIR, safeFileName);
      
      // Convert File object to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Save the file
      fs.writeFileSync(filePath, buffer);
      
      // Create file entry
      const fileEntry = {
        id: fileId,
        fileName,
        fileUrl: `/uploads/report-logs/${safeFileName}`,
        fileType: getFileType(fileName),
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      };
      
      uploadedFiles.push(fileEntry);
    }
    
    // Update log with the new files
    if (!logs[logIndex].files) {
      logs[logIndex].files = [];
    }
    
    logs[logIndex].files = [...logs[logIndex].files, ...uploadedFiles];
    logs[logIndex].updatedAt = new Date().toISOString();
    
    // Save updated logs
    saveLogsToDb(logs);
    
    return NextResponse.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files', details: error.message },
      { status: 500 }
    );
  }
} 