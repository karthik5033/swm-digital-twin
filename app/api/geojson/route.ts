import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Pointing directly to the ~2MB raw BBMP file that has the actual separated geometries
    const filePath = path.join(process.cwd(), 'data', 'BBMP.geojson');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const geojson = JSON.parse(fileContents);
    
    geojson.features = geojson.features.map((f: any) => {
      f.properties.id = f.properties.ward_name || f.properties.KGISWardName || f.properties.name;
      f.properties.name = f.properties.ward_name || f.properties.KGISWardName || f.properties.name;
      f.properties.ward_no = f.properties.ward_no || f.properties.KGISWardNo;
      f.properties.zone = f.properties.zone || "Central"; // Fallback Zone
      return f;
    });

    console.log(`[API/GeoJSON] Successfully loaded ${geojson.features.length} separate ward features from BBMP.geojson`);

    return NextResponse.json(geojson);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read GeoJSON' }, { status: 500 });
  }
}
