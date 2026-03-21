'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '@/lib/store';
import LayerToggle from './LayerToggle';
import WardSidebar from './WardSidebar';

/* --- MOCK HSR LAYOUT DATA --- */
const generateBuildings = () => {
  const features: any[] = [];
  let counts = { small: 342, medium: 213, large: 129, commercial: 76 };
  const addBldg = (type: string, areaMin: number, areaMax: number, cType: string) => {
    const area = Math.floor(Math.random() * (areaMax - areaMin + 1)) + areaMin;
    let finalType = type;
    if (cType === 'commercial') {
      const types = ['Commercial Shop', 'Commercial/Mall', 'Restaurant', 'Hospital', 'School', 'IT Office'];
      finalType = types[Math.floor(Math.random() * types.length)];
    }
    
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [77.630 + Math.random() * 0.025, 12.900 + Math.random() * 0.025] },
      properties: {
        type: finalType,
        area,
        category: cType, // useful for tracking classification string if needed
        floors: Math.floor(area / 100) + 1,
        dailyWaste: (area * 0.02).toFixed(1),
        wasteType: '60% Organic, 30% Dry',
        route: `AR-${Math.floor(Math.random() * 10) + 1}`,
        distance: Math.floor(Math.random() * 800) + 50
      }
    });
  };

  for(let i=0; i<counts.small; i++) addBldg('Residential House', 50, 99, 'small');
  for(let i=0; i<counts.medium; i++) addBldg('Residential House', 100, 199, 'medium');
  for(let i=0; i<counts.large; i++) addBldg('Apartment', 200, 499, 'large');
  for(let i=0; i<counts.commercial; i++) addBldg('Commercial', 500, 1200, 'commercial');

  return { type: 'FeatureCollection', features };
};
const BUILDINGS_GEOJSON: any = generateBuildings();

const DUMPS_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6410, 12.9116] }, properties: { name: 'D1 HSR Main', capacity: '65% full', status: 'Warning' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6380, 12.9180] }, properties: { name: 'D2 Agara', capacity: '78% full', status: 'Critical' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6450, 12.9050] }, properties: { name: 'D3 BDA Complex', capacity: '45% full', status: 'Normal' } }
  ]
};

const DRY_WASTE_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6390, 12.9150] }, properties: { name: 'Centre 1', capacity: '2 tons/day' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6420, 12.9200] }, properties: { name: 'Centre 2', capacity: '1.5 tons/day' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6440, 12.9080] }, properties: { name: 'Centre 3', capacity: '3 tons/day' } }
  ]
};

const PROCESSING_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6460, 12.9130] }, properties: { type: 'Composting', capacity: '5 tons/day' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6380, 12.9090] }, properties: { type: 'Material Recovery', capacity: '8 tons/day' } }
  ]
};

const METHANE_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6400, 12.9160] }, properties: { name: 'HSR Bio Plant', output: '500 kg methane/day' } }
  ]
};

const OPEN_SPACES_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.635, 12.920], [77.645, 12.920], [77.645, 12.925], [77.635, 12.925], [77.635, 12.920]]] }, properties: { name: 'Agara Lake Area' } },
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.640, 12.905], [77.644, 12.905], [77.644, 12.908], [77.640, 12.908], [77.640, 12.905]]] }, properties: { name: 'BDA Complex' } }
  ]
};

const AGARA_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { name: 'Agara Lake', area_sqm: 52000, type: 'water_body', pollution_risk: 'high', status: 'Protected' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [77.6398, 12.9201], [77.6412, 12.9215], [77.6435, 12.9218], [77.6448, 12.9208],
        [77.6445, 12.9192], [77.6428, 12.9182], [77.6408, 12.9183], [77.6398, 12.9195], [77.6398, 12.9201]
      ]]
    }
  }]
};

const AGARA_BUFFER_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [77.6385, 12.9185], [77.6412, 12.9228], [77.6445, 12.9231], [77.6465, 12.9210],
        [77.6460, 12.9180], [77.6430, 12.9168], [77.6395, 12.9170], [77.6385, 12.9185]
      ]]
    }
  }]
};

const AGARA_LINES_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[77.6380, 12.9180], [77.6398, 12.9195]] }, properties: { label: 'D7 → Lake: 180m ⚠️' } },
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[77.6410, 12.9116], [77.6428, 12.9182]] }, properties: { label: 'D19 → Lake: 480m ⚠️' } },
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[77.6350, 12.9220], [77.6398, 12.9201]] }, properties: { label: 'D12 → Lake: 320m ⚠️' } }
  ]
};

const SEGREGATION_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.630, 12.915], [77.638, 12.915], [77.638, 12.925], [77.630, 12.925], [77.630, 12.915]]] }, properties: { zone: 'Zone A', color: '#8b0000' } }, 
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.638, 12.915], [77.646, 12.915], [77.646, 12.925], [77.638, 12.925], [77.638, 12.915]]] }, properties: { zone: 'Zone B', color: '#f97316' } }, 
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.646, 12.915], [77.655, 12.915], [77.655, 12.925], [77.646, 12.925], [77.646, 12.915]]] }, properties: { zone: 'Zone C', color: '#eab308' } }, 
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.630, 12.900], [77.640, 12.900], [77.640, 12.915], [77.630, 12.915], [77.630, 12.900]]] }, properties: { zone: 'Zone D', color: '#86efac' } }, 
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.640, 12.900], [77.655, 12.900], [77.655, 12.915], [77.640, 12.915], [77.640, 12.900]]] }, properties: { zone: 'Zone E', color: '#22c55e' } }  
  ]
};

const WASTE_ZONES_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[77.6420, 12.9080],[77.6480, 12.9080],[77.6480, 12.9150],[77.6420, 12.9150],[77.6420, 12.9080]]] },
      properties: { zone: 'Zone 1', name: 'HSR Main (Sector 1-2)', waste: 247, buildings: 180, population: 55000, freq: '2x daily', color: '#ef4444', status: 'Critical' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[77.6350, 12.9080],[77.6420, 12.9080],[77.6420, 12.9150],[77.6350, 12.9150],[77.6350, 12.9080]]] },
      properties: { zone: 'Zone 2', name: 'BDA Complex (Sector 3)', waste: 189, buildings: 150, population: 42000, freq: '1x daily', color: '#f97316', status: 'High' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[77.6420, 12.9150],[77.6480, 12.9150],[77.6480, 12.9220],[77.6420, 12.9220],[77.6420, 12.9150]]] },
      properties: { zone: 'Zone 3', name: 'Agara (Sector 4)', waste: 171, buildings: 130, population: 38000, freq: '1x daily', color: '#f59e0b', status: 'Medium' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[77.6350, 12.9150],[77.6420, 12.9150],[77.6420, 12.9220],[77.6350, 12.9220],[77.6350, 12.9150]]] },
      properties: { zone: 'Zone 4', name: 'Somasundara (Sector 5)', waste: 216, buildings: 160, population: 48000, freq: '2x daily', color: '#ef4444', status: 'Critical' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[77.6280, 12.9080],[77.6350, 12.9080],[77.6350, 12.9220],[77.6280, 12.9220],[77.6280, 12.9080]]] },
      properties: { zone: 'Zone 5', name: '7th Sector (Sector 6-7)', waste: 167, buildings: 140, population: 37000, freq: '1x daily', color: '#22c55e', status: 'Low' }
    }
  ]
};

const LULC_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.641, 12.909], [77.650, 12.909], [77.650, 12.914], [77.641, 12.914], [77.641, 12.909]]] }, properties: { type: 'Built-up', color: '#e74c3c' } },
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.635, 12.920], [77.645, 12.920], [77.645, 12.925], [77.635, 12.925], [77.635, 12.920]]] }, properties: { type: 'Vegetation', color: '#27ae60' } },
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.631, 12.910], [77.636, 12.910], [77.636, 12.918], [77.631, 12.918], [77.631, 12.910]]] }, properties: { type: 'Open Bare Land', color: '#f39c12' } },
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.635, 12.921], [77.644, 12.921], [77.644, 12.924], [77.635, 12.924], [77.635, 12.921]]] }, properties: { type: 'Water Bodies', color: '#3498db' } },
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.630, 12.900], [77.640, 12.900], [77.640, 12.905], [77.630, 12.905], [77.630, 12.900]]] }, properties: { type: 'Mixed Use', color: '#9b59b6' } }
  ]
};

const HSR_BOUNDARY_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[77.630, 12.900], [77.655, 12.900], [77.655, 12.925], [77.630, 12.925], [77.630, 12.900]]] }, properties: { name: 'HSR Layout Boundary' } }
  ]
};

const TRUCK_HUBS_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6410, 12.9116] }, properties: { name: '27th Main Hub', limit: '8 tons', load: '6.5 tons', status: 'Available', autos: 3 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6380, 12.9180] }, properties: { name: '19th Main Hub', limit: '8 tons', load: '8.0 tons', status: 'Full', autos: 3 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6450, 12.9050] }, properties: { name: 'ORR Junction Hub', limit: '8 tons', load: '4.2 tons', status: 'Available', autos: 3 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.6460, 12.9130] }, properties: { name: 'BDA Complex Hub', limit: '8 tons', load: '7.1 tons', status: 'Available', autos: 3 } }
  ]
};

const MAIN_ROUTE_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature', 
    geometry: {
      type: 'LineString',
      coordinates: [
        // T1 to T2
        [77.6410, 12.9116],
        [77.6395, 12.9130],
        [77.6382, 12.9155],
        [77.6380, 12.9180],
        // T2 to T3
        [77.6360, 12.9160],
        [77.6390, 12.9100],
        [77.6450, 12.9050],
        // T3 to T4
        [77.6455, 12.9080],
        [77.6458, 12.9110],
        [77.6460, 12.9130],
        // T4 to Processing Unit
        [77.6420, 12.9100],
        [77.6350, 12.9080]
      ]
    }
  }]
};

const AUTO_ROUTES_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    // Hub 1 - Auto A
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[77.6410, 12.9116], [77.6430, 12.9120], [77.6445, 12.9125], [77.6410, 12.9116]] } },
    // Hub 1 - Auto B
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[77.6410, 12.9116], [77.6415, 12.9100], [77.6425, 12.9095], [77.6410, 12.9116]] } },
    // Hub 2 - Auto A
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[77.6380, 12.9180], [77.6395, 12.9190], [77.6410, 12.9195], [77.6380, 12.9180]] } },
    // Hub 2 - Auto B
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[77.6380, 12.9180], [77.6370, 12.9165], [77.6355, 12.9160], [77.6380, 12.9180]] } },
    // Hub 3 - Simulated Auto
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[77.6450, 12.9050], [77.6470, 12.9040], [77.6450, 12.9050]] } },
    // Hub 4 - Simulated Auto
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[77.6460, 12.9130], [77.6480, 12.9140], [77.6460, 12.9130]] } },
  ]
};

function interpolatePoint(line: number[][], fraction: number) {
  let totalDist = 0;
  const dists = [];
  for (let i = 0; i < line.length - 1; i++) {
    const dx = line[i+1][0] - line[i][0];
    const dy = line[i+1][1] - line[i][1];
    const d = Math.sqrt(dx*dx + dy*dy);
    totalDist += d;
    dists.push(d);
  }
  const targetDist = totalDist * (fraction % 1);
  let runDist = 0;
  for (let i = 0; i < dists.length; i++) {
    if (runDist + dists[i] >= targetDist || i === dists.length - 1) {
      const segFraction = (targetDist - runDist) / (dists[i] || 1);
      const x = line[i][0] + (line[i+1][0] - line[i][0]) * segFraction;
      const y = line[i][1] + (line[i+1][1] - line[i][1]) * segFraction;
      return [x, y];
    }
    runDist += dists[i];
  }
  return line[line.length - 1]; // Fallback
}

export default function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const hubMarkers = useRef<maplibregl.Marker[]>([]);
  const animationRef = useRef<number | null>(null);
  const activeLayers = useStore((s) => s.activeLayers);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [bldgFilter, setBldgFilter] = useState('All');

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [77.6410, 12.9116], // Centered on HSR
      zoom: 14,
      pitch: 40,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

    map.current.on('load', () => {
      map.current?.resize();

      // HSR boundary
      map.current!.addSource('hsr-boundary-source', { type: 'geojson', data: HSR_BOUNDARY_GEOJSON });
      map.current!.addLayer({
        id: 'hsr-boundary',
        type: 'line',
        source: 'hsr-boundary-source',
        paint: {
          'line-color': '#0d9488', // Teal
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });

      // Add sources
      map.current!.addSource('dumps-source', { type: 'geojson', data: DUMPS_GEOJSON });
      map.current!.addSource('dryWaste-source', { type: 'geojson', data: DRY_WASTE_GEOJSON });
      map.current!.addSource('processing-source', { type: 'geojson', data: PROCESSING_GEOJSON });
      map.current!.addSource('methane-source', { type: 'geojson', data: METHANE_GEOJSON });
      map.current!.addSource('wasteZones-source', { type: 'geojson', data: WASTE_ZONES_GEOJSON });
      map.current!.addSource('openSpaces-source', { type: 'geojson', data: OPEN_SPACES_GEOJSON });
      map.current!.addSource('segregation-source', { type: 'geojson', data: SEGREGATION_GEOJSON });
      map.current!.addSource('lulc-source', { type: 'geojson', data: LULC_GEOJSON });
      
      map.current!.addSource('mainRoute-source', { type: 'geojson', data: MAIN_ROUTE_GEOJSON });
      map.current!.addSource('autoRoutes-source', { type: 'geojson', data: AUTO_ROUTES_GEOJSON });
      map.current!.addSource('auto-dots', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current!.addSource('main-dot', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      map.current!.addSource('agara-source', { type: 'geojson', data: AGARA_GEOJSON });
      map.current!.addSource('agara-buffer', { type: 'geojson', data: AGARA_BUFFER_GEOJSON });
      map.current!.addSource('agara-lines', { type: 'geojson', data: AGARA_LINES_GEOJSON });

      // Add Layers
      // 1. Dumpyards (red circles)
      map.current!.addLayer({
        id: 'dumps',
        type: 'circle',
        source: 'dumps-source',
        paint: { 'circle-radius': 10, 'circle-color': '#ef4444', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' },
        layout: { visibility: 'visible' }
      });

      // 2. Dry Waste Centres (blue circles)
      map.current!.addLayer({
        id: 'dryWaste',
        type: 'circle',
        source: 'dryWaste-source',
        paint: { 'circle-radius': 8, 'circle-color': '#3b82f6', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' },
        layout: { visibility: 'visible' }
      });

      // 3. Processing Units (green circles)
      map.current!.addLayer({
        id: 'processing',
        type: 'circle',
        source: 'processing-source',
        paint: { 'circle-radius': 8, 'circle-color': '#10b981', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' },
        layout: { visibility: 'visible' }
      });

      // 4. Methane Plants (orange circles)
      map.current!.addLayer({
        id: 'methane',
        type: 'circle',
        source: 'methane-source',
        paint: { 'circle-radius': 8, 'circle-color': '#f97316', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' },
        layout: { visibility: 'visible' }
      });

      // 5. Waste Zone Polygons
      map.current!.addLayer({
        id: 'density',
        type: 'fill',
        source: 'wasteZones-source',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.32
        },
        layout: { visibility: 'visible' }
      });
      map.current!.addLayer({
        id: 'density-outline',
        type: 'line',
        source: 'wasteZones-source',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1.5,
          'line-opacity': 0.7
        },
        layout: { visibility: 'visible' }
      });
      map.current!.addLayer({
        id: 'density-labels',
        type: 'symbol',
        source: 'wasteZones-source',
        layout: {
          'text-field': ['concat', ['get', 'zone'], ' | ', ['to-string', ['get', 'waste']], ' kg/day'],
          'text-size': 11,
          'text-font': ['Open Sans SemiBold', 'Arial Unicode MS Regular'],
          'text-offset': [0, 0],
          'text-anchor': 'center',
          'visibility': 'visible'
        },
        paint: {
          'text-color': '#1e293b',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });

      // 6. Open Spaces (light green polygons)
      map.current!.addLayer({
        id: 'openSpaces',
        type: 'fill',
        source: 'openSpaces-source',
        paint: { 'fill-color': '#86efac', 'fill-opacity': 0.6 },
        layout: { visibility: 'none' }
      });

      // 6.b Agara Buffer
      map.current!.addLayer({
        id: 'agaraBuffer-fill',
        type: 'fill',
        source: 'agara-buffer',
        paint: { 'fill-color': '#f97316', 'fill-opacity': 0.15 },
        layout: { visibility: 'visible' }
      });
      map.current!.addLayer({
        id: 'agaraBuffer-line',
        type: 'line',
        source: 'agara-buffer',
        paint: { 'line-color': '#f97316', 'line-width': 1, 'line-dasharray': [2, 2] },
        layout: { visibility: 'visible' }
      });

      // 6.c Agara Lake
      map.current!.addLayer({
        id: 'agaraLake-fill',
        type: 'fill',
        source: 'agara-source',
        paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.5 },
        layout: { visibility: 'visible' }
      });
      map.current!.addLayer({
        id: 'agaraLake-line',
        type: 'line',
        source: 'agara-source',
        paint: { 'line-color': '#60a5fa', 'line-width': 2, 'line-opacity': 0.8 },
        layout: { visibility: 'visible' }
      });

      // 6.d Agara Lines (dump distances)
      map.current!.addLayer({
        id: 'agaraLines',
        type: 'line',
        source: 'agara-lines',
        paint: { 'line-color': '#ef4444', 'line-width': 1.5, 'line-dasharray': [2, 1] },
        layout: { visibility: 'visible' }
      });
      map.current!.addLayer({
        id: 'agaraLines-labels',
        type: 'symbol',
        source: 'agara-lines',
        layout: { 
          'text-field': ['get', 'label'], 
          'symbol-placement': 'line',
          'text-offset': [0, -1],
          'text-size': 10,
          'visibility': 'visible'
        },
        paint: { 'text-color': '#ef4444', 'text-halo-color': '#ffffff', 'text-halo-width': 2 }
      });

      // 7. Segregation Zones (colored polygons)
      map.current!.addLayer({
        id: 'segregation',
        type: 'fill',
        source: 'segregation-source',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.4 },
        layout: { visibility: 'none' }
      });

      // 8. LULC (colored polygons)
      map.current!.addLayer({
        id: 'lulc',
        type: 'fill',
        source: 'lulc-source',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.6 },
        layout: { visibility: 'none' }
      });

      // 9. Main Truck Route
      map.current!.addLayer({
        id: 'mainRoute',
        type: 'line',
        source: 'mainRoute-source',
        paint: { 'line-color': '#22c55e', 'line-width': 4 },
        layout: { visibility: 'visible' }
      });

      // 10. Auto Routes
      map.current!.addLayer({
        id: 'autoRoutes',
        type: 'line',
        source: 'autoRoutes-source',
        paint: { 'line-color': '#f97316', 'line-width': 2, 'line-dasharray': [2, 2] },
        layout: { visibility: 'visible' }
      });

      // 11. Animated Auto Dots
      map.current!.addLayer({
        id: 'autoRoutes-dots',
        type: 'circle',
        source: 'auto-dots',
        paint: { 'circle-radius': 5, 'circle-color': '#f97316', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#fff' },
        layout: { visibility: 'visible' } // same group as autoRoutes
      });

      // 12. Animated Main Truck Dot
      map.current!.addLayer({
        id: 'mainRoute-dot',
        type: 'circle',
        source: 'main-dot',
        paint: { 'circle-radius': 9, 'circle-color': '#3b82f6', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff', 'circle-pitch-alignment':'map' },
        layout: { visibility: 'visible' } // same group as mainRoute
      });

      // 13. Buildings Layer
      map.current!.addSource('buildings-source', { type: 'geojson', data: BUILDINGS_GEOJSON });
      map.current!.addLayer({
        id: 'buildings',
        type: 'circle',
        source: 'buildings-source',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'area'],
            0, 3,
            50, 4,
            100, 6,
            200, 8,
            500, 10,
            1000, 14
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'type'], 'Restaurant'], '#dc2626',
            ['==', ['get', 'type'], 'Hospital'], '#f97316',
            ['==', ['get', 'type'], 'School'], '#22c55e',
            ['==', ['get', 'type'], 'IT Office'], '#14b8a6',
            ['==', ['get', 'type'], 'Commercial/Mall'], '#f97316',
            ['==', ['get', 'type'], 'Commercial Shop'], '#eab308',
            ['>=', ['get', 'area'], 100], '#a855f7',
            '#3b82f6'
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.8
        },
        layout: { visibility: 'visible' }
      });

      // Add HTML Markers for Truck Hubs
      TRUCK_HUBS_GEOJSON.features.forEach((feature: any) => {
        const el = document.createElement('div');
        // Simple CSS animation via tailwind: animate-pulse, blue square
        el.className = 'w-6 h-6 bg-blue-600 border-2 border-white rounded-md shadow-[0_0_15px_rgba(37,99,235,0.8)] cursor-pointer hover:bg-blue-500 transition-colors duration-300';
        
        // Inline styles for extra pulse effect
        el.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';

        const p = feature.properties;
        const popupHtml = `<div style="font-family:Inter,sans-serif;color:#0f172a;padding:4px">
            <strong>🚛 ${p.name}</strong><br/>
            Capacity: ${p.limit}<br/>
            Load: <span style="color:${p.status === 'Full' ? '#ef4444' : '#10b981'}">${p.load}</span><br/>
            Status: <b>${p.status}</b><br/>
            Autos Feeding: <b>${p.autos}</b>
          </div>`;
          
        const popup = new maplibregl.Popup({ closeButton: true, offset: 15 }).setHTML(popupHtml);
        const marker = new maplibregl.Marker(el)
          .setLngLat(feature.geometry.coordinates)
          .setPopup(popup)
          .addTo(map.current!);
          
        hubMarkers.current.push(marker);
      });
      
      // Setup Popups
      const setupPopup = (layerId: string, getHtml: (p: any) => string) => {
        map.current!.on('click', layerId, (e) => {
          if (!e.features?.length) return;
          const p = e.features[0].properties;
          new maplibregl.Popup({ closeButton: true })
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font-family:Inter,sans-serif;color:#0f172a;padding:4px">` + getHtml(p) + `</div>`)
            .addTo(map.current!);
        });
        map.current!.on('mouseenter', layerId, () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; });
        map.current!.on('mouseleave', layerId, () => { if (map.current) map.current.getCanvas().style.cursor = ''; });
      };

      setupPopup('dumps', p => `<strong>🔴 ${p.name}</strong><br/>Capacity: ${p.capacity}<br/>Status: <b>${p.status}</b>`);
      setupPopup('dryWaste', p => `<strong>🔵 ${p.name}</strong><br/>Capacity: ${p.capacity}`);
      setupPopup('processing', p => `<strong>🟢 ${p.type}</strong><br/>Capacity: ${p.capacity}`);
      setupPopup('methane', p => `<strong>🟠 ${p.name}</strong><br/>Output: ${p.output}`);
      setupPopup('density', p => `
        <div style="font-family:Inter,sans-serif;font-size:12px;width:220px;color:#0f172a">
          <div style="font-weight:900;font-size:13px;border-bottom:2px solid ${p.color};margin-bottom:6px;padding-bottom:4px">
            🗺️ ${p.name}
          </div>
          <div style="margin-bottom:6px">
            <b>Daily Waste:</b> <span style="color:${p.color};font-weight:800">${p.waste} kg/day</span><br/>
            <b>Buildings:</b> ${p.buildings}<br/>
            <b>Population:</b> ${(p.population as number).toLocaleString()}<br/>
            <b>Collection:</b> ${p.freq}<br/>
            <b>Status:</b> <span style="color:${p.color};font-weight:700">${p.status}</span>
          </div>
        </div>
      `);
      setupPopup('agaraLake-fill', () => `
        <div style="font-family:Inter,sans-serif;font-size:12px;width:240px;color:#0f172a;">
          <div style="font-weight:900;font-size:14px;border-bottom:2px solid #3b82f6;margin-bottom:6px;padding-bottom:4px;display:flex;justify-content:space-between">
            <span>🌊 AGARA LAKE</span>
            <span>📍 HSR</span>
          </div>
          <div style="margin-bottom:8px">
            <b>Area:</b> 52,000 sqm (5.2 ha)<br/>
            <b>Status:</b> Protected Water Body<br/>
            <b>Depth:</b> 3-4 meters
          </div>
          <div style="font-size:11px;background:#fee2e2;border:1px solid #fca5a5;padding:6px;border-radius:6px;margin-bottom:8px">
            <span style="color:#dc2626;font-weight:900">⚠️ POLLUTION RISK: HIGH</span><br/>
            Near dump sites: 3 within 500m<br/>
            Buffer violations: 2
          </div>
          <div style="font-size:11px;color:#475569">
            🔴 Buffer zone 100m restricted<br/>
            🚫 No dumping warning active<br/>
            ♻️ Needs immediate cleanup
          </div>
        </div>
      `);
      setupPopup('lulc', p => `<strong>📡 LULC Analysis</strong><br/>Classification: <b>${p.type}</b>${p.type === 'Open Bare Land' ? '<br/><span style="color:#f39c12">⚠️ High illegal dump risk</span>' : ''}`);
      setupPopup('buildings', p => `
        <strong>🏢 Building Stats</strong><br/>
        Type: ${p.type}<br/>
        Size: ${p.area} sqm<br/>
        Floors: ${p.floors}<br/>
        Daily Waste: <b>${p.dailyWaste} kg</b><br/>
        Waste Type: ${p.wasteType}<br/>
        Collection: ${p.route}<br/>
        Distance to hub: ${p.distance}m
      `);

      let t = 0;
      const animateFlow = () => {
        t += 0.003; 
        if (!map.current) return;
        
        const autoFeatures = AUTO_ROUTES_GEOJSON.features.map((f: any, i: number) => {
           // The routes are now full circular polygons spanning outwards and tracking back to the hub.
           const pt = interpolatePoint(f.geometry.coordinates, (t * 2 + (i * 0.15)));
           return { type: 'Feature', geometry: { type: 'Point', coordinates: pt }, properties: {} };
        });
        
        const mainLine = MAIN_ROUTE_GEOJSON.features[0].geometry.coordinates;
        const mainTruckDot = interpolatePoint(mainLine, (t * 0.5));

        const adSource = map.current.getSource('auto-dots') as maplibregl.GeoJSONSource;
        if (adSource) adSource.setData({ type: 'FeatureCollection', features: autoFeatures });
        
        const mdSource = map.current.getSource('main-dot') as maplibregl.GeoJSONSource;
        if (mdSource) mdSource.setData({ type: 'FeatureCollection', features: [ { type: 'Feature', geometry: { type: 'Point', coordinates: mainTruckDot }, properties: {} } ] });
        
        // Agara ripples (opacity 0.4 to 0.9)
        if (map.current.getLayer('agaraLake-line')) {
          map.current.setPaintProperty('agaraLake-line', 'line-opacity', Math.sin(t * 15) * 0.25 + 0.65);
        }

        animationRef.current = requestAnimationFrame(animateFlow);
      };
      animateFlow();

      setMapLoaded(true);
    });

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      hubMarkers.current.forEach(m => m.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Setup Layer Filter
    let filterExpr = null;
    if (bldgFilter === 'Houses Only') filterExpr = ['<=', ['get', 'area'], 199];
    else if (bldgFilter === 'Large Only') filterExpr = ['all', ['>=', ['get', 'area'], 200], ['<=', ['get', 'area'], 499]];
    else if (bldgFilter === 'Commercial Only') filterExpr = ['>=', ['get', 'area'], 500];
    
    if (filterExpr) map.current.setFilter('buildings', filterExpr as any);
    else map.current.setFilter('buildings', null);

  }, [bldgFilter, mapLoaded]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const managedLayers = ['dumps', 'dryWaste', 'processing', 'methane', 'density', 'openSpaces', 'segregation', 'lulc', 'mainRoute', 'autoRoutes', 'agaraLake'];
    Object.entries(activeLayers).forEach(([layerId, isVisible]) => {
      const displayVal = isVisible ? 'visible' : 'none';
      if (layerId === 'density') {
        // Toggle all 3 zone sub-layers together
        ['density', 'density-outline', 'density-labels'].forEach(id => {
          if (map.current?.getLayer(id)) map.current.setLayoutProperty(id, 'visibility', displayVal);
        });
      } else if (layerId === 'agaraLake') {
        if (map.current?.getLayer('agaraLake-fill')) map.current.setLayoutProperty('agaraLake-fill', 'visibility', displayVal);
        if (map.current?.getLayer('agaraLake-line')) map.current.setLayoutProperty('agaraLake-line', 'visibility', displayVal);
        if (map.current?.getLayer('agaraBuffer-fill')) map.current.setLayoutProperty('agaraBuffer-fill', 'visibility', displayVal);
        if (map.current?.getLayer('agaraBuffer-line')) map.current.setLayoutProperty('agaraBuffer-line', 'visibility', displayVal);
        if (map.current?.getLayer('agaraLines')) map.current.setLayoutProperty('agaraLines', 'visibility', displayVal);
        if (map.current?.getLayer('agaraLines-labels')) map.current.setLayoutProperty('agaraLines-labels', 'visibility', displayVal);
      } else if (managedLayers.includes(layerId) && map.current?.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', displayVal);
        // Also toggle the animated dots for those routes
        if (layerId === 'mainRoute' && map.current.getLayer('mainRoute-dot')) {
           map.current.setLayoutProperty('mainRoute-dot', 'visibility', isVisible ? 'visible' : 'none');
        }
        if (layerId === 'autoRoutes' && map.current.getLayer('autoRoutes-dots')) {
           map.current.setLayoutProperty('autoRoutes-dots', 'visibility', isVisible ? 'visible' : 'none');
        }
      }
      
      // Toggle custom DOM markers for truckHubs
      if (layerId === 'truckHubs') {
        const displayVal = isVisible ? 'block' : 'none';
        hubMarkers.current.forEach(m => {
          m.getElement().style.display = displayVal;
        });
      }
    });

  }, [activeLayers, mapLoaded]);

  return (
    <div id="map-page" className="relative w-full h-full bg-slate-900 overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-50/80 to-transparent z-[1]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50/80 to-transparent z-[1]" />
      <LayerToggle />
      <WardSidebar />

      {/* Waste Zone Legend - bottom right */}
      <div className="absolute bottom-6 right-6 z-[10] bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl text-white text-xs">
        <h3 className="font-extrabold uppercase tracking-widest text-slate-300 mb-3 text-[10px] border-b border-slate-700/50 pb-1.5">Waste Zone Legend</h3>
        <div className="space-y-2">
          {[
            { color: '#ef4444', label: '>200 kg/day', level: 'Critical' },
            { color: '#f97316', label: '150-200 kg/day', level: 'High' },
            { color: '#f59e0b', label: '100-150 kg/day', level: 'Medium' },
            { color: '#22c55e', label: '<100 kg/day', level: 'Low' },
          ].map(({ color, label, level }) => (
            <div key={level} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: color, opacity: 0.85 }} />
              <span className="text-slate-300 font-semibold">{label}</span>
              <span className="ml-auto text-slate-500 font-bold">{level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Building Distribution Card */}
      <div className="absolute bottom-6 left-6 z-[10] w-[350px] bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 shadow-2xl text-white">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-300 mb-4 border-b border-slate-700/50 pb-2">Building Distribution</h3>
        
        <div className="space-y-4 mb-5 text-xs font-medium">
          <div>
            <div className="flex justify-between text-slate-300 mb-1"><span>🏠 Small Houses (&lt;100sqm)</span></div>
            <div className="flex items-center gap-3"><div className="h-2 bg-blue-500 rounded-full w-[45%]" /> <span>45% | 342 buildings</span></div>
          </div>
          <div>
            <div className="flex justify-between text-slate-300 mb-1"><span>🏘️ Medium Houses (100-200sqm)</span></div>
            <div className="flex items-center gap-3"><div className="h-2 bg-purple-500 rounded-full w-[28%]" /> <span>28% | 213 buildings</span></div>
          </div>
          <div>
            <div className="flex justify-between text-slate-300 mb-1"><span>🏢 Large Buildings (200-500sqm)</span></div>
            <div className="flex items-center gap-3"><div className="h-2 bg-purple-400 rounded-full w-[17%]" /> <span>17% | 129 buildings</span></div>
          </div>
          <div>
            <div className="flex justify-between text-slate-300 mb-1"><span>🏬 Commercial/Complex (&gt;500sqm)</span></div>
            <div className="flex items-center gap-3"><div className="h-2 bg-orange-500 rounded-full w-[10%]" /> <span>10% | 76 buildings</span></div>
          </div>
        </div>
        
        <div className="flex justify-between border-t border-slate-700/50 pt-3 text-sm mb-4">
          <span className="font-bold text-slate-400">Total Analyzed:</span>
          <span className="font-black text-teal-400">760 buildings</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {['All', 'Houses Only', 'Large Only', 'Commercial Only'].map(f => (
            <button 
              key={f}
              onClick={() => setBldgFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                bldgFilter === f 
                ? 'bg-teal-500 border-teal-400 text-white shadow-[0_0_10px_rgba(20,184,166,0.5)]' 
                : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {f === 'All' ? 'Show All' : f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
