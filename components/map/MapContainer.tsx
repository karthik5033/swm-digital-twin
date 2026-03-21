'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '@/lib/store';
import LayerToggle from './LayerToggle';
import WardSidebar from './WardSidebar';

/* --- MOCK HSR LAYOUT DATA --- */
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

const DENSITY_GEOJSON: any = {
  type: 'FeatureCollection',
  features: Array.from({ length: 200 }).map(() => ({
    type: 'Feature',
    geometry: { 
      type: 'Point', 
      coordinates: [77.630 + Math.random() * 0.025, 12.900 + Math.random() * 0.025] 
    },
    properties: { weight: Math.random() }
  }))
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
      map.current!.addSource('density-source', { type: 'geojson', data: DENSITY_GEOJSON });
      map.current!.addSource('openSpaces-source', { type: 'geojson', data: OPEN_SPACES_GEOJSON });
      map.current!.addSource('segregation-source', { type: 'geojson', data: SEGREGATION_GEOJSON });
      map.current!.addSource('lulc-source', { type: 'geojson', data: LULC_GEOJSON });
      
      map.current!.addSource('mainRoute-source', { type: 'geojson', data: MAIN_ROUTE_GEOJSON });
      map.current!.addSource('autoRoutes-source', { type: 'geojson', data: AUTO_ROUTES_GEOJSON });
      map.current!.addSource('auto-dots', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current!.addSource('main-dot', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

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

      // 5. Density Heatmap (purple)
      map.current!.addLayer({
        id: 'density',
        type: 'heatmap',
        source: 'density-source',
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': 1.5,
          'heatmap-radius': 40,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(168,85,247,0)',
            0.5, 'rgba(168,85,247,0.5)',
            1, 'rgba(107,33,168,1)'
          ],
        },
        layout: { visibility: 'none' }
      });

      // 6. Open Spaces (light green polygons)
      map.current!.addLayer({
        id: 'openSpaces',
        type: 'fill',
        source: 'openSpaces-source',
        paint: { 'fill-color': '#86efac', 'fill-opacity': 0.6 },
        layout: { visibility: 'none' }
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
      setupPopup('lulc', p => `<strong>📡 LULC Analysis</strong><br/>Classification: <b>${p.type}</b>${p.type === 'Open Bare Land' ? '<br/><span style="color:#f39c12">⚠️ High illegal dump risk</span>' : ''}`);

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
    const managedLayers = ['dumps', 'dryWaste', 'processing', 'methane', 'density', 'openSpaces', 'segregation', 'lulc', 'mainRoute', 'autoRoutes'];
    Object.entries(activeLayers).forEach(([layerId, isVisible]) => {
      if (managedLayers.includes(layerId) && map.current?.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
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
    <div id="map-page" className="relative w-full bg-slate-100" style={{ height: 'calc(100vh - 65px)' }}>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-50/80 to-transparent z-[1]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50/80 to-transparent z-[1]" />
      <LayerToggle />
      <WardSidebar />
    </div>
  );
}
