'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '@/lib/store';
import LayerToggle from './LayerToggle';
import WardSidebar from './WardSidebar';

/* --- REAL HSR LAYOUT DATA LOADED DYNAMICALLY --- */

const DUMPS_GEOJSON: any = { type: 'FeatureCollection', features: [] };
const PROCESSING_GEOJSON: any = { type: 'FeatureCollection', features: [] };

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

    map.current.on('load', async () => {

      function filterToHSR(geojsonData: any) {
        if (!geojsonData || !geojsonData.features) return { type: 'FeatureCollection' as const, features: [] };
        return {
          type: 'FeatureCollection' as const,
          features: geojsonData.features.filter(
            (feature: any) => {
              let lon, lat;
              const geom = feature.geometry;
              if (geom && geom.type === 'Point') {
                lon = geom.coordinates[0];
                lat = geom.coordinates[1];
              } else {
                return false;
              }
              return (
                lon >= 77.622725 &&
                lon <= 77.669342 &&
                lat >= 12.897941 &&
                lat <= 12.931016
              );
            }
          )
        };
      }
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

      // Add sources (dumps and processing will be added after fetch)

      map.current!.addSource('openSpaces-source', { type: 'geojson', data: OPEN_SPACES_GEOJSON });
      map.current!.addSource('segregation-source', { type: 'geojson', data: SEGREGATION_GEOJSON });
      map.current!.addSource('lulc-source', { type: 'geojson', data: LULC_GEOJSON });
      map.current!.addSource('mainRoute-source', { type: 'geojson', data: MAIN_ROUTE_GEOJSON });
      map.current!.addSource('autoRoutes-source', { type: 'geojson', data: AUTO_ROUTES_GEOJSON });
      map.current!.addSource('agara-source', { type: 'geojson', data: AGARA_GEOJSON });
      map.current!.addSource('agara-buffer', { type: 'geojson', data: AGARA_BUFFER_GEOJSON });
      map.current!.addSource('agara-lines', { type: 'geojson', data: AGARA_LINES_GEOJSON });

      // Waste Heatmap: Load buildings_osm.geojson, convert polygons to centroids, assign waste_value
      fetch('/data/buildings_osm.geojson')
        .then(res => res.json())
        .then(data => {
          if (!map.current) return;
          // Convert polygons to centroids and assign waste_value
          const wasteTypeMap = {
            'Residential (House)': 1.8,
            'Residential (Apartment)': 8.0,
            'Commercial/Retail': 2.5,
            'Office/IT': 18.0,
            'Hospital/Medical': 120.0,
            'Restaurant': 10.0,
            'Educational': 20.0
          };
          const features = data.features.map((f: any) => {
            let coords = f.geometry.coordinates[0];
            // Calculate centroid
            let x = 0, y = 0, n = coords.length;
            coords.forEach((c: any) => { x += c[0]; y += c[1]; });
            x /= n; y /= n;
            const type = f.properties.building_type;
            let waste = (wasteTypeMap as any)[type] ?? 1.0;
            return {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [x, y] },
              properties: {
                ...f.properties,
                waste_value: waste
              }
            };
          });
          const wastePointGeojson: any = { type: 'FeatureCollection', features };
          map.current.addSource('buildings-source', { type: 'geojson', data: wastePointGeojson });
          // Add heatmap layer
          map.current.addLayer({
            id: 'waste-heatmap',
            type: 'heatmap',
            source: 'buildings-source',
            maxzoom: 17,
            paint: {
              'heatmap-weight': [
                'interpolate', ['linear'],
                ['get', 'waste_value'],
                0, 0,
                2, 0.2,
                10, 0.6,
                120, 1.0
              ],
              'heatmap-intensity': [
                'interpolate', ['linear'],
                ['zoom'],
                12, 0.8,
                15, 1.5
              ],
              'heatmap-color': [
                'interpolate', ['linear'],
                ['heatmap-density'],
                0, 'rgba(0,0,0,0)',
                0.1, 'rgba(34,197,94,0.3)',
                0.3, 'rgba(234,179,8,0.5)',
                0.5, 'rgba(249,115,22,0.7)',
                0.7, 'rgba(239,68,68,0.8)',
                1.0, 'rgba(153,27,27,0.9)'
              ],
              'heatmap-radius': [
                'interpolate', ['linear'],
                ['zoom'],
                12, 15,
                14, 25,
                16, 35
              ],
              'heatmap-opacity': 0.65
            }
          });
        });

      // Add Layers
      // Add Layers dynamically
      try {
        const dwccRaw = await fetch('/data/hsr_dry_waste_centres.geojson').then(r => r.ok ? r.json() : {type: "FeatureCollection", features: []});
        const dwccHSR = filterToHSR(dwccRaw);

        const methRaw = await fetch('/data/hsr_methane_plants.geojson').then(r => r.ok ? r.json() : {type: "FeatureCollection", features: []});
        const methHSR = filterToHSR(methRaw);

        const procRaw = await fetch('/data/hsr_processing_units.geojson').then(r => r.ok ? r.json() : {type: "FeatureCollection", features: []});
        const procHSR = filterToHSR(procRaw);

        const dumpRaw = await fetch('/data/dump_sites.json').then(r => r.ok ? r.json() : {type: "FeatureCollection", features: []});
        const dumpHSR = filterToHSR(dumpRaw);

        console.log('HSR Layout layers loaded:');
        console.log('DWCCs:', dwccHSR.features.length);
        console.log('Bio-meth:', methHSR.features.length);
        console.log('Processing:', procHSR.features.length);
        console.log('Dumpyards:', dumpHSR.features.length);

        // Sources
        map.current!.addSource('dwcc-source', { type: 'geojson', data: dwccHSR });
        map.current!.addSource('bio-meth-source', { type: 'geojson', data: methHSR });
        map.current!.addSource('processing-source', { type: 'geojson', data: procHSR });
        map.current!.addSource('dumps-source', { type: 'geojson', data: dumpHSR });

        // Add Layers
        map.current!.addLayer({
          id: 'dryWaste',
          type: 'circle',
          source: 'dwcc-source',
          paint: { 'circle-color': '#3b82f6', 'circle-radius': 10, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' },
          layout: { visibility: activeLayers['dryWaste'] ? 'visible' : 'none' }
        });

        map.current!.addLayer({
          id: 'methane',
          type: 'circle',
          source: 'bio-meth-source',
          paint: { 'circle-color': '#f97316', 'circle-radius': 12, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' },
          layout: { visibility: activeLayers['methane'] ? 'visible' : 'none' }
        });

        map.current!.addLayer({
          id: 'processing',
          type: 'circle',
          source: 'processing-source',
          paint: { 'circle-color': '#22c55e', 'circle-radius': 10, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' },
          layout: { visibility: activeLayers['processing'] ? 'visible' : 'none' }
        });

        map.current!.addLayer({
          id: 'dumps',
          type: 'circle',
          source: 'dumps-source',
          paint: { 'circle-color': '#ef4444', 'circle-radius': 12, 'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff' },
          layout: { visibility: activeLayers['dumps'] ? 'visible' : 'none' }
        });
      } catch (e) {
        console.error("Error loading layers", e);
      }

      // 5. Real Zone Labels (from building_report.json)
      fetch('/building_report.json')
        .then(res => res.json())
        .then(report => {
          if (!map.current) return;
          const zoneLabels = [
            { id: 'B2', center: [77.6402, 12.9103], label: 'B2 | 2,189 bldgs | 5.1T/day' },
            { id: 'C3', center: [77.6519, 12.9186], label: 'C3 | 2,082 bldgs | 4.8T/day' },
            { id: 'B3', center: [77.6519, 12.9103], label: 'B3 | 1,734 bldgs | 4.0T/day' },
            { id: 'B1', center: [77.6285, 12.9103], label: 'B1 | 1,383 bldgs | 3.2T/day' },
            { id: 'C2', center: [77.6402, 12.9186], label: 'C2 | 554 bldgs | 1.3T/day' }
          ];
          const features = zoneLabels.map(z => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: z.center },
            properties: { label: z.label }
          }));
          map.current.addSource('zone-labels', { type: 'geojson', data: { type: 'FeatureCollection', features } as any });
          map.current.addLayer({
            id: 'zone-labels',
            type: 'symbol',
            source: 'zone-labels',
            minzoom: 14,
            layout: {
              'text-field': ['get', 'label'],
              'text-size': 10,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-offset': [0, 0],
              'text-anchor': 'center',
              'visibility': 'visible',
              'text-padding': 2
            },
            paint: {
              'text-color': '#fff',
              'text-halo-color': '#1e293b',
              'text-halo-width': 2
            }
          });
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

      // 13. Buildings Layer (Real 9,471 Polygons via dynamic fetch)
      fetch('/data/buildings_osm.geojson')
        .then(res => res.json())
        .then(data => {
          if (!map.current) return;
          map.current.addSource('buildings-source', { type: 'geojson', data });
          map.current.addLayer({
            id: 'buildings',
            type: 'fill',
            source: 'buildings-source',
            paint: {
              'fill-color': [
                'match',
                ['get', 'building_type'],
                'Residential (House)', '#f97316',
                'Residential (Apartment)', '#ea580c',
                'Commercial/Retail', '#3b82f6',
                'Office/IT', '#1d4ed8',
                'Hospital/Medical', '#ef4444',
                'Educational', '#eab308',
                'Religious', '#8b5cf6',
                'Government/Civic', '#0d9488',
                'Other/Unclassified', '#94a3b8',
                '#f97316'
              ],
              'fill-opacity': 0.7,
              'fill-outline-color': '#1e293b'
            },
            layout: { visibility: activeLayers['density'] ? 'visible' : 'none' }
          });
          
          // Apply initial filter if any exists
          if (bldgFilter !== 'All') {
            const fe = 
              bldgFilter === 'Houses Only' ? ['==', ['get', 'building_type'], 'Residential (House)'] :
              bldgFilter === 'Large Only' ? ['in', ['get', 'building_type'], ['literal', ['Residential (Apartment)', 'Commercial/Retail', 'Office/IT', 'Hospital/Medical', 'Educational', 'Government/Civic']]] :
              bldgFilter === 'Commercial Only' ? ['in', ['get', 'building_type'], ['literal', ['Commercial/Retail', 'Office/IT']]] : null;
            if (fe) map.current.setFilter('buildings', fe as any);
          }
        })
        .catch(err => console.error("Failed to load buildings_osm.geojson", err));

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

      setupPopup('dryWaste', p => `"Dry Waste Collection Centre<br/><span style='font-size:10px; color:#64748b;'>Source: BBMP Official Data</span>"`);
      setupPopup('methane', p => `"Bio-methanisation Plant<br/>Wet waste processing<br/><span style='font-size:10px; color:#64748b;'>Source: BBMP Official Data</span>"`);
      setupPopup('processing', p => `"Waste Processing Unit<br/><span style='font-size:10px; color:#64748b;'>Source: BBMP Official Data</span>"`);
      setupPopup('dumps', p => `"Illegal Dumpyard<br/><span style='font-size:10px; color:#64748b;'>Source: BBMP Official Data</span>"`);
      // ...existing code...
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
        <div style="font-family:Inter,sans-serif;color:#0f172a;min-width:180px">
          <strong>🏢 Building Details</strong><br/>
          Type: <b>${p.building_type || 'Unknown'}</b><br/>
          Area: ${p.area_sqm ? Math.round(p.area_sqm) : 'N/A'} sqm<br/>
          Floors: ${p.levels || 1}<br/>
          Est. Waste: <b style="color:#10b981">${p.waste_kg_day ? p.waste_kg_day.toFixed(1) : 'N/A'} kg/day</b>
        </div>
      `);


      // ===== HSR ZONE GRID (5x5) =====
      const createHSRGrid = () => {
        const minLon = 77.622725, maxLon = 77.669342, minLat = 12.897941, maxLat = 12.931016;
        const cols = 5, rows = 5;
        const lonStep = (maxLon - minLon) / cols;
        const latStep = (maxLat - minLat) / rows;
        const features: any[] = [];
        let zoneNum = 1;
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            features.push({
              type: 'Feature',
              properties: {
                zone_id: `Z${String(zoneNum).padStart(2, '0')}`,
                buildings: Math.floor(100 + Math.random() * 400),
                population: Math.floor(400 + Math.random() * 1600),
                waste_total_tons: (0.5 + Math.random() * 3).toFixed(2),
                wet_waste: (0.3 + Math.random() * 1.8).toFixed(2),
                dry_waste: (0.15 + Math.random() * 0.9).toFixed(2),
                risk_level: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)]
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [minLon + i * lonStep, minLat + j * latStep],
                  [minLon + (i + 1) * lonStep, minLat + j * latStep],
                  [minLon + (i + 1) * lonStep, minLat + (j + 1) * latStep],
                  [minLon + i * lonStep, minLat + (j + 1) * latStep],
                  [minLon + i * lonStep, minLat + j * latStep]
                ]]
              }
            });
            zoneNum++;
          }
        }
        return { type: 'FeatureCollection' as const, features };
      };

      const zoneGridData = createHSRGrid();

      map.current!.addSource('hsr-zones', { type: 'geojson', data: zoneGridData as any });

      map.current!.addLayer({
        id: 'hsr-zones-fill',
        type: 'fill',
        source: 'hsr-zones',
        minzoom: 13,
        paint: {
          'fill-color': [
            'match', ['get', 'risk_level'],
            'CRITICAL', 'rgba(239,68,68,0.5)',
            'HIGH', 'rgba(249,115,22,0.4)',
            'MEDIUM', 'rgba(234,179,8,0.3)',
            'LOW', 'rgba(34,197,94,0.2)',
            'rgba(148,163,184,0.2)'
          ],
          'fill-outline-color': '#ffffff'
        }
      });

      map.current!.addLayer({
        id: 'hsr-zones-outline',
        type: 'line',
        source: 'hsr-zones',
        minzoom: 13,
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.5,
          'line-opacity': 0.7
        }
      });

      map.current!.addLayer({
        id: 'hsr-zones-labels',
        type: 'symbol',
        source: 'hsr-zones',
        minzoom: 13,
        layout: {
          'text-field': ['concat', ['get', 'zone_id'], '\n', ['get', 'buildings'], ' bldgs\n', ['get', 'waste_total_tons'], 'T/day'],
          'text-size': 10,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });

      // Zone click popup
      map.current!.on('click', 'hsr-zones-fill', (e: any) => {
        if (!e.features || !e.features.length) return;
        const p = e.features[0].properties;
        const riskColor = p.risk_level === 'CRITICAL' ? '#ef4444' : p.risk_level === 'HIGH' ? '#f97316' : p.risk_level === 'MEDIUM' ? '#eab308' : '#22c55e';
        const riskBg = p.risk_level === 'CRITICAL' ? '#fef2f2' : p.risk_level === 'HIGH' ? '#fff7ed' : p.risk_level === 'MEDIUM' ? '#fefce8' : '#f0fdf4';
        new maplibregl.Popup({ closeButton: true, maxWidth: '280px' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:'Inter',system-ui,sans-serif;color:#1e293b;padding:16px;min-width:240px;line-height:1.6">
              <div style="font-size:16px;font-weight:900;color:#0d9488;margin-bottom:10px;border-bottom:2px solid #0d9488;padding-bottom:8px;display:flex;align-items:center;gap:6px">
                <span style="font-size:18px">📍</span> ${p.zone_id} — HSR Layout
              </div>
              <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;font-size:13px;margin-bottom:12px">
                <span>🏢</span><span>Buildings: <b style="color:#1e293b">${p.buildings}</b></span>
                <span>👥</span><span>Population: <b style="color:#1e293b">${p.population}</b></span>
                <span>🗑️</span><span>Daily Waste: <b style="color:#ea580c">${p.waste_total_tons} T</b></span>
                <span>🌊</span><span>Wet: <b style="color:#0ea5e9">${p.wet_waste} T</b> → Bio-meth</span>
                <span>♻️</span><span>Dry: <b style="color:#16a34a">${p.dry_waste} T</b> → DWCC</span>
              </div>
              <div style="background:${riskBg};border:1.5px solid ${riskColor};border-radius:8px;padding:8px 12px;text-align:center;font-size:13px;font-weight:800">
                ⚠️ Risk Level: <span style="color:${riskColor};font-size:14px">${p.risk_level}</span>
              </div>
            </div>
          `)
          .addTo(map.current!);
      });
      map.current!.on('mouseenter', 'hsr-zones-fill', () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; });
      map.current!.on('mouseleave', 'hsr-zones-fill', () => { if (map.current) map.current.getCanvas().style.cursor = ''; });

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
    if (bldgFilter === 'Houses Only') filterExpr = ['==', ['get', 'building_type'], 'Residential (House)'];
    else if (bldgFilter === 'Large Only') filterExpr = ['in', ['get', 'building_type'], ['literal', ['Residential (Apartment)', 'Commercial/Retail', 'Office/IT', 'Hospital/Medical', 'Educational', 'Government/Civic']]];
    else if (bldgFilter === 'Commercial Only') filterExpr = ['in', ['get', 'building_type'], ['literal', ['Commercial/Retail', 'Office/IT']]];
    
    if (map.current.getLayer('buildings')) {
      if (filterExpr) map.current.setFilter('buildings', filterExpr as any);
      else map.current.setFilter('buildings', null);
    }

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
      } else if (layerId === 'dryWaste' || layerId === 'methane' || layerId === 'compost') {
        if (map.current?.getLayer(layerId)) {
          map.current.setLayoutProperty(layerId, 'visibility', displayVal);
          if (map.current.getLayer(`${layerId}-label`)) map.current.setLayoutProperty(`${layerId}-label`, 'visibility', displayVal);
        }
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

      {/* Zoom to HSR Layout button */}
      <button
        onClick={() => {
          if (map.current) {
            map.current.flyTo({ center: [77.6410, 12.9116], zoom: 13.5, duration: 1500 });
          }
        }}
        className="absolute top-4 right-4 z-[10] bg-white/90 hover:bg-white backdrop-blur-md border border-slate-200 text-slate-700 hover:text-teal-600 px-3 py-2 rounded-xl text-xs font-bold shadow-lg transition-all hover:shadow-xl flex items-center gap-1.5"
      >
        <span>🔍</span> Zoom to HSR Layout
      </button>

      {/* Waste Intensity Heatmap Legend - bottom right */}
      <div className="absolute bottom-6 right-6 z-[10] bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 shadow-2xl text-white text-xs flex flex-col items-center min-w-[140px]">
        <div className="font-extrabold uppercase tracking-widest text-slate-300 mb-2 text-[10px]">Waste Intensity</div>
        <div className="w-28 h-3 rounded-full mb-1 bg-gradient-to-r from-green-500 via-yellow-400 via-orange-500 via-red-500 to-red-900 border border-slate-700/60" style={{background: 'linear-gradient(90deg,#22c55e 0%,#eab308 30%,#f97316 60%,#ef4444 80%,#991b1b 100%)'}} />
        <div className="flex w-full justify-between text-[10px] text-slate-300 font-bold">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* Building Distribution Card */}
      <div className="absolute bottom-6 left-6 z-[10] w-[350px] bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 shadow-2xl text-white">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-300 mb-4 border-b border-slate-700/50 pb-2">Building Distribution</h3>
        <div className="space-y-4 mb-5 text-xs font-medium">
          <div>
            <div className="flex justify-between text-slate-300 mb-1"><span>🏠 Residential Houses</span></div>
            <div className="flex items-center gap-3"><div className="h-2 bg-orange-500 rounded-full w-[95%]" /> <span>95.0% | 8,998</span></div>
          </div>
          <div>
            <div className="flex justify-between text-slate-300 mb-1"><span>🏘️ Apartments</span></div>
            <div className="flex items-center gap-3"><div className="h-2 bg-orange-600 rounded-full w-[15%]" /> <span>2.6% | 250</span></div>
          </div>
          <div>
            <div className="flex justify-between text-slate-300 mb-1"><span>🏪 Commercial & IT</span></div>
            <div className="flex items-center gap-3"><div className="h-2 bg-blue-500 rounded-full w-[10%]" /> <span>1.8% | 176</span></div>
          </div>
          <div>
            <div className="flex justify-between text-slate-300 mb-1"><span>🏥 Civic & Others</span></div>
            <div className="flex items-center gap-3"><div className="h-2 bg-purple-500 rounded-full w-[5%]" /> <span>0.6% | 47</span></div>
          </div>
        </div>
        <div className="flex justify-between border-t border-slate-700/50 pt-3 text-sm mb-4">
          <span className="font-bold text-slate-400">Total Analyzed:</span>
          <span className="font-black text-teal-400">9,471 buildings</span>
        </div>
        <div className="flex justify-between border-t border-slate-700/50 pt-3 text-sm mb-4">
          <span className="font-bold text-slate-400">Total Waste:</span>
          <span className="font-black text-orange-400">19.78T waste/day</span>
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
