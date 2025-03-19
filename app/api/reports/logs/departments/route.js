import { NextResponse } from 'next/server';

// For this example, we'll hardcode the departments, but in a real application,
// this would come from a database or configuration
const DEPARTMENTS = [
  "Electronic Unit",
  "Moulding Unit",
  "GIS",
  "Payload",
  "3D & CNC",
  "Health & Safety",
  "Pilots"
];

export async function GET() {
  try {
    console.log('GET /api/reports/logs/departments request received');
    return NextResponse.json(DEPARTMENTS);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments', details: error.message },
      { status: 500 }
    );
  }
} 