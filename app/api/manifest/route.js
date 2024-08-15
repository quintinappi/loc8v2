import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    return new NextResponse(manifestContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    });
  } catch (error) {
    console.error('Error reading manifest file:', error);
    return new NextResponse(JSON.stringify({ error: 'Manifest file not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}