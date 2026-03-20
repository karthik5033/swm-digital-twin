import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'bengaluru_wards.geojson');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json(JSON.parse(fileContents));
  } catch {
    return NextResponse.json({ error: 'Failed to read GeoJSON' }, { status: 500 });
  }
}
