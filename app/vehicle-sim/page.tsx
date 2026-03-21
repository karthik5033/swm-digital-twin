'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// ── REAL road-snapped waypoints per sector → DWCC ────────────────────────────
// Using OSRM routing API: https://router.project-osrm.org
// Each vehicle: Depot → zone stops → nearest DWCC (single trip, then stop)

const DEPOT_LON = 77.6392;
const DEPOT_LAT = 12.9158;

const DWCC_LOCATIONS = [
  { id: 'DWCC-001', name: 'DWCC Sector 2 East',    lon: 77.649028, lat: 12.91263  },
  { id: 'DWCC-002', name: 'DWCC Sector 3 Central', lon: 77.646882, lat: 12.922184 },
  { id: 'DWCC-003', name: 'DWCC Sector 2 West',    lon: 77.64545,  lat: 12.91811  },
  { id: 'DWCC-004', name: 'DWCC Sector 1 East',    lon: 77.647549, lat: 12.912182 },
];

const BMU_LOCATIONS = [
  { id: 'BMU-001', name: 'Bio-Methanisation Unit 1', lon: 77.614044, lat: 12.933803 },
  { id: 'BMU-002', name: 'Bio-Methanisation Unit 2', lon: 77.614061, lat: 12.933792 },
];

// Vehicles: each has a list of real road-network stops in HSR Layout
// Stops are actual road junctions/intersections in HSR Layout
const VEHICLE_DEFS = [
  {
    id: 'V1', type: 'auto' as const, sector: 'Sector 1', capacity: 1500, dwccIdx: 3,
    stops: [
      [77.6281, 12.9075], // 27th Main BTM border
      [77.6310, 12.9090], // 19th Main entry Sector 1
      [77.6340, 12.9105], // HSR Sector 1 junction
    ]
  },
  {
    id: 'V2', type: 'auto' as const, sector: 'Sector 2', capacity: 1500, dwccIdx: 3,
    stops: [
      [77.6370, 12.9055], // 24th Main South
      [77.6410, 12.9065], // Sector 2 internal road
      [77.6445, 12.9090], // 22nd Cross
    ]
  },
  {
    id: 'V3', type: 'truck' as const, sector: 'Sector 3', capacity: 5000, dwccIdx: 2,
    stops: [
      [77.6370, 12.9145], // Sector 3 West
      [77.6415, 12.9165], // 17th Main
      [77.6450, 12.9175], // 13th Cross Sector 3
    ]
  },
  {
    id: 'V4', type: 'auto' as const, sector: 'Sector 4', capacity: 1500, dwccIdx: 2,
    stops: [
      [77.6250, 12.9135], // Sector 4 far West
      [77.6290, 12.9155], // Intermediate
      [77.6330, 12.9160], // Sector 4 East end
    ]
  },
  {
    id: 'V5', type: 'auto' as const, sector: 'Sector 5', capacity: 1500, dwccIdx: 0,
    stops: [
      [77.6560, 12.9000], // Bellandur border East
      [77.6590, 12.9055], // Sector 5 central
      [77.6610, 12.9090], // Near ORR feeder
    ]
  },
  {
    id: 'V6', type: 'truck' as const, sector: 'Sector 6', capacity: 5000, dwccIdx: 1,
    stops: [
      [77.6575, 12.9160], // Agara junction
      [77.6620, 12.9200], // Outer ring side
      [77.6650, 12.9230], // Sector 6 far
    ]
  },
  {
    id: 'V7', type: 'auto' as const, sector: 'Sector 7', capacity: 1500, dwccIdx: 1,
    stops: [
      [77.6260, 12.9280], // Sector 7 NW
      [77.6340, 12.9310], // Sector 7 North
      [77.6420, 12.9330], // Upper HSR
    ]
  },
];

// ── OSRM route fetch ──────────────────────────────────────────────────────────
async function fetchOSRMRoute(
  waypoints: [number, number][]
): Promise<[number, number][]> {
  const coords = waypoints.map(([lon, lat]) => `${lon},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error: ${res.status}`);
  const data = await res.json();
  
  if (!data.routes || data.routes.length === 0) throw new Error('No route found');
  
  // Returns array of [lon, lat] coordinates following real roads
  return data.routes[0].geometry.coordinates as [number, number][];
}

// ── Interpolation ─────────────────────────────────────────────────────────────
function interpolateAlongPath(
  coords: [number, number][],
  t: number
): [number, number] {
  if (coords.length === 0) return [77.64, 12.91];
  if (t <= 0) return coords[0];
  if (t >= 1) return coords[coords.length - 1];

  const dists: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i][0] - coords[i-1][0];
    const dy = coords[i][1] - coords[i-1][1];
    dists.push(dists[i-1] + Math.sqrt(dx*dx + dy*dy));
  }
  const total = dists[dists.length - 1];
  const target = t * total;

  for (let i = 1; i < dists.length; i++) {
    if (dists[i] >= target) {
      const seg = (target - dists[i-1]) / (dists[i] - dists[i-1]);
      const a = coords[i-1], b = coords[i];
      return [a[0] + seg * (b[0]-a[0]), a[1] + seg * (b[1]-a[1])];
    }
  }
  return coords[coords.length - 1];
}

function makeVehicleEl(
  type: 'auto' | 'truck',
  load: number,
  capacity: number,
  done: boolean
): HTMLDivElement {
  const pct = Math.min(1, load / capacity);
  const color = done ? '#94a3b8' : type === 'auto' ? '#22c55e' : '#3b82f6';
  const size  = type === 'auto' ? 30 : 36;
  const emoji = type === 'auto' ? '🛺' : '🚛';

  const el = document.createElement('div');
  el.style.cssText = `
    width:${size}px; height:${size}px; border-radius:50%;
    background:${color}; border:2.5px solid white;
    display:flex; align-items:center; justify-content:center;
    font-size:${Math.round(size*0.52)}px;
    box-shadow: 0 0 ${done ? 4 : 10 + pct*14}px ${color};
    position:relative; transition: box-shadow 0.3s;
  `;
  el.innerHTML = emoji;

  const ring = document.createElement('div');
  ring.style.cssText = `
    position:absolute; bottom:-7px; left:50%; transform:translateX(-50%);
    width:${size-4}px; height:4px; border-radius:2px;
    background: linear-gradient(to right, #22c55e ${pct*100}%, #1e293b ${pct*100}%);
    border:1px solid rgba(255,255,255,0.25);
  `;
  el.appendChild(ring);
  return el;
}

// ── State types ───────────────────────────────────────────────────────────────
interface VehicleState {
  id: string;
  type: 'auto' | 'truck';
  sector: string;
  capacity: number;
  dwccIdx: number;
  route: [number, number][];   // full road-snapped route
  progress: number;            // 0 → 1
  currentLoad: number;
  done: boolean;
  marker?: maplibregl.Marker;
  distanceKm: number;
  durationMin: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function VehicleSimulationPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const vehiclesRef  = useRef<VehicleState[]>([]);
  const markerRefs   = useRef<maplibregl.Marker[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef  = useRef<number>(0);
  const speedRef     = useRef(1);
  const isRunningRef = useRef(false);

  const [mapReady,  setMapReady]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [loadMsg,   setLoadMsg]   = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [speed,     setSpeed]     = useState(0.5);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showZones,  setShowZones]  = useState(true);
  const [totalCollected, setTotalCollected] = useState(0);
  const [stats, setStats] = useState<{
    id:string; type:string; load:number; cap:number; done:boolean;
    dist:number; dur:number; sector:string;
  }[]>([]);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  // ── Init map ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap'
          }
        },
        layers: [{
          id: 'osm', type: 'raster', source: 'osm',
          paint: { 'raster-brightness-max': 0.18, 'raster-saturation': -1 }
        }]
      },
      center: [77.6390, 12.9140],
      zoom: 13.8,
    });

    mapRef.current = map;

    map.on('load', async () => {
      // Ward boundary
      try {
        const wardData = await fetch('/data/hsr_ward_boundary.geojson').then(r => r.json());
        map.addSource('ward', { type: 'geojson', data: wardData });
        map.addLayer({ id: 'ward-fill', type: 'fill', source: 'ward', paint: { 'fill-color': '#00d4aa', 'fill-opacity': 0.04 }});
        map.addLayer({ id: 'ward-line', type: 'line', source: 'ward', paint: { 'line-color': '#00d4aa', 'line-width': 2, 'line-opacity': 0.85 }});
      } catch {}

      // Road network
      try {
        const roadData = await fetch('/data/hsr_road_network.geojson').then(r => r.json());
        map.addSource('roads', { type: 'geojson', data: roadData });
        map.addLayer({ id: 'roads-line', type: 'line', source: 'roads',
          paint: { 'line-color': '#334155', 'line-width': 1.2, 'line-opacity': 0.5 }
        });
      } catch {}

      // Zone overlay
      try {
        const zoneData = await fetch('/data/zone_analysis.json').then(r => r.json());
        const features = zoneData.zones.map((z: any) => ({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[
            [z.bounds[0], z.bounds[1]], [z.bounds[2], z.bounds[1]],
            [z.bounds[2], z.bounds[3]], [z.bounds[0], z.bounds[3]],
            [z.bounds[0], z.bounds[1]]
          ]]},
          properties: { waste: z.waste_kg_day }
        }));
        map.addSource('zones', { type: 'geojson', data: { type: 'FeatureCollection', features } });
        map.addLayer({ id: 'zones-fill', type: 'fill', source: 'zones',
          paint: { 'fill-color': ['interpolate', ['linear'], ['get','waste'], 0,'#1e293b', 5000,'#f59e0b', 20000,'#ef4444'], 'fill-opacity': 0.2 }
        });
        map.addLayer({ id: 'zones-line', type: 'line', source: 'zones',
          paint: { 'line-color': '#475569', 'line-width': 0.5, 'line-opacity': 0.4 }
        });
      } catch {}

      // Route lines source (empty until routes loaded)
      map.addSource('vehicle-routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'vehicle-routes-line', type: 'line', source: 'vehicle-routes',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2.5,
          'line-opacity': 0.65,
          'line-dasharray': [3, 2]
        }
      });

      // DWCC markers
      DWCC_LOCATIONS.forEach(d => {
        const el = document.createElement('div');
        el.style.cssText = `width:38px;height:38px;border-radius:50%;background:#f59e0b;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 18px rgba(245,158,11,0.7);cursor:pointer;`;
        el.innerHTML = '🏭';
        new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([d.lon, d.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<div style="padding:8px;font-family:Inter"><b style="color:#f59e0b">${d.name}</b><br/><small>Dry Waste Collection Centre</small></div>`))
          .addTo(map);
      });

      // BMU markers
      BMU_LOCATIONS.forEach(b => {
        const el = document.createElement('div');
        el.style.cssText = `width:38px;height:38px;border-radius:50%;background:#ef4444;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 18px rgba(239,68,68,0.7);cursor:pointer;`;
        el.innerHTML = '♻️';
        new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([b.lon, b.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<div style="padding:8px;font-family:Inter"><b style="color:#ef4444">${b.name}</b><br/><small>Bio-Methanisation Unit</small></div>`))
          .addTo(map);
      });

      // Depot marker
      const depotEl = document.createElement('div');
      depotEl.style.cssText = `width:34px;height:34px;border-radius:8px;background:#6366f1;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 16px rgba(99,102,241,0.7);`;
      depotEl.innerHTML = '🏪';
      new maplibregl.Marker({ element: depotEl, anchor: 'center' })
        .setLngLat([DEPOT_LON, DEPOT_LAT])
        .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML('<div style="padding:8px;font-family:Inter"><b>🏪 Vehicle Depot</b><br/><small>All vehicles start here</small></div>'))
        .addTo(map);

      setMapReady(true);
    });

    return () => { map.remove(); };
  }, []);

  // Toggle visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer('zones-fill')) {
      map.setLayoutProperty('zones-fill', 'visibility', showZones ? 'visible' : 'none');
      map.setLayoutProperty('zones-line', 'visibility', showZones ? 'visible' : 'none');
    }
  }, [showZones, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer('vehicle-routes-line')) {
      map.setLayoutProperty('vehicle-routes-line', 'visibility', showRoutes ? 'visible' : 'none');
    }
  }, [showRoutes, mapReady]);

  // ── Fetch all vehicle routes from OSRM ─────────────────────────────────────
  const fetchAllRoutes = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    setLoading(true);
    setIsRunning(false);

    // Clear old markers
    markerRefs.current.forEach(m => m.remove());
    markerRefs.current = [];
    vehiclesRef.current = [];

    const routeColors: Record<'auto'|'truck', string> = { auto: '#22c55e', truck: '#3b82f6' };
    const routeFeatures: any[] = [];
    const newVehicles: VehicleState[] = [];

    for (let i = 0; i < VEHICLE_DEFS.length; i++) {
      const def = VEHICLE_DEFS[i];
      const dwcc = DWCC_LOCATIONS[def.dwccIdx];

      setLoadMsg(`Fetching real road route for ${def.id} (${def.sector})...`);

      // Full waypoints: depot → zone stops → DWCC
      const waypoints: [number,number][] = [
        [DEPOT_LON, DEPOT_LAT],
        ...def.stops as [number,number][],
        [dwcc.lon, dwcc.lat]
      ];

      let roadCoords: [number, number][] = waypoints; // fallback
      let distKm = 0;
      let durMin = 0;

      try {
        const osrmCoords = waypoints.map(([lon, lat]) => `${lon},${lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes[0]) {
          roadCoords = data.routes[0].geometry.coordinates as [number, number][];
          distKm = Math.round(data.routes[0].distance / 100) / 10;
          durMin = Math.round(data.routes[0].duration / 60);
        }
      } catch (e) {
        console.warn(`OSRM failed for ${def.id}, using waypoints`, e);
      }

      // Add route line to map
      routeFeatures.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: roadCoords },
        properties: { color: routeColors[def.type], id: def.id }
      });

      // Create vehicle marker
      const el = makeVehicleEl(def.type, 0, def.capacity, false);
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([DEPOT_LON, DEPOT_LAT])
        .addTo(map);
      markerRefs.current.push(marker);

      newVehicles.push({
        id: def.id,
        type: def.type,
        sector: def.sector,
        capacity: def.capacity,
        dwccIdx: def.dwccIdx,
        route: roadCoords,
        progress: 0,
        currentLoad: 0,
        done: false,
        marker,
        distanceKm: distKm,
        durationMin: durMin,
      });
    }

    vehiclesRef.current = newVehicles;

    // Update route lines on map
    if (map.getSource('vehicle-routes')) {
      (map.getSource('vehicle-routes') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: routeFeatures
      });
    }

    setStats(newVehicles.map(v => ({
      id: v.id, type: v.type, load: 0, cap: v.capacity,
      done: false, dist: v.distanceKm, dur: v.durationMin, sector: v.sector
    })));

    setTotalCollected(0);
    setLoading(false);
    setLoadMsg('');
  }, []);

  // ── Animation loop ─────────────────────────────────────────────────────────
  const animate = useCallback((timestamp: number) => {
    if (!isRunningRef.current) return;

    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;

    // Speed: 1x = ~4 min real route in ~40 sec animation
    const progressPerSec = 0.008 * speedRef.current;

    let allDone = true;
    let totalWaste = 0;

    vehiclesRef.current.forEach((v, idx) => {
      if (v.done) {
        totalWaste += v.currentLoad;
        return;
      }
      allDone = false;

      // Advance along route
      v.progress = Math.min(1, v.progress + progressPerSec * dt * 10);

      const pos = interpolateAlongPath(v.route, v.progress);
      v.marker?.setLngLat(pos);

      // Simulate waste accumulation as vehicle travels through zones
      v.currentLoad = Math.min(v.capacity, v.capacity * 0.85 * v.progress / 0.75);

      // Done = reached DWCC (progress = 1)
      if (v.progress >= 1) {
        v.done = true;
        v.currentLoad = v.capacity * 0.85; // "delivered" load
        const el = makeVehicleEl(v.type, 0, v.capacity, true);
        el.title = `${v.id} — Delivered to DWCC ✅`;
        if (v.marker) {
          const existing = v.marker.getElement();
          existing.innerHTML = el.innerHTML;
          existing.style.background = el.style.background;
          existing.style.boxShadow = el.style.boxShadow;
        }
      }

      totalWaste += v.currentLoad;
    });

    setTotalCollected(Math.round(totalWaste));
    setStats(vehiclesRef.current.map(v => ({
      id: v.id, type: v.type, load: Math.round(v.currentLoad),
      cap: v.capacity, done: v.done, dist: v.distanceKm, dur: v.durationMin, sector: v.sector
    })));

    if (allDone) {
      setIsRunning(false);
      isRunningRef.current = false;
      return;
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const handlePlay = useCallback(() => {
    if (vehiclesRef.current.length === 0) return;
    if (vehiclesRef.current.every(v => v.done)) return; // already finished
    setIsRunning(true);
    isRunningRef.current = true;
    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    isRunningRef.current = false;
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleReset = useCallback(() => {
    handlePause();
    setTimeout(() => fetchAllRoutes(), 200);
  }, [handlePause, fetchAllRoutes]);

  // Auto-load routes when map is ready
  useEffect(() => { if (mapReady) fetchAllRoutes(); }, [mapReady, fetchAllRoutes]);

  useEffect(() => () => { cancelAnimationFrame(animFrameRef.current); }, []);

  const allDone = stats.length > 0 && stats.every(v => v.done);
  const doneCount = stats.filter(v => v.done).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0a0f1a', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15,23,42,0.97)', borderBottom: '1px solid rgba(0,212,170,0.2)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/map" style={{ color: '#00d4aa', textDecoration: 'none', fontSize: 13, opacity: 0.8 }}>← Map</Link>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 17, fontWeight: 800, background: 'linear-gradient(135deg, #00d4aa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🚛 HSR Layout — Waste Collection Simulation
          </span>
          <div style={{ fontSize: 11, background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 20, padding: '3px 10px', color: '#00d4aa' }}>
            OSRM Road-Optimised Routes
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '4px 14px', fontSize: 13, color: '#22c55e' }}>
            {doneCount}/{stats.length} completed
          </div>
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '4px 14px', fontSize: 13, color: '#f59e0b' }}>
            ♻️ {totalCollected.toLocaleString()} kg
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 57px)' }}>
        {/* Sidebar */}
        <div style={{ width: 295, background: 'rgba(15,23,42,0.98)', borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* Controls */}
          <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#64748b', marginBottom: 10 }}>SIMULATION CONTROLS</div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={isRunning ? handlePause : handlePlay}
                disabled={loading || allDone || stats.length === 0}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: loading || allDone ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: 14,
                  background: loading || allDone ? 'rgba(100,116,139,0.2)' : isRunning ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg,#00d4aa,#0ea5e9)',
                  color: loading || allDone ? '#64748b' : isRunning ? '#ef4444' : 'white' }}>
                {loading ? '⏳ Loading...' : allDone ? '✅ Complete' : isRunning ? '⏸ Pause' : '▶ Play'}
              </button>
              <button onClick={handleReset} disabled={loading}
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', cursor: loading ? 'not-allowed' : 'pointer',
                  background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontWeight: 700, fontSize: 15 }}>
                ↺
              </button>
            </div>

            {loading && (
              <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#a5b4fc', marginBottom: 10 }}>
                {loadMsg || 'Calculating routes...'}
              </div>
            )}

            {/* Speed */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>
                <span>Playback Speed</span>
                <span style={{ color: '#00d4aa', fontWeight: 700 }}>{speed}x</span>
              </div>
              <input type="range" min={0.5} max={5} step={0.5} value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#00d4aa', cursor: 'pointer' }} />
            </div>

            {/* Toggles */}
            {[
              { label: 'Show Vehicle Routes', val: showRoutes, set: setShowRoutes },
              { label: 'Show Waste Zones', val: showZones, set: setShowZones },
            ].map(({ label, val, set }) => (
              <button key={label} onClick={() => set(!val)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', marginBottom: 6, borderRadius: 8,
                  border: `1px solid ${val ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  background: val ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', color: 'white', fontSize: 12 }}>
                <span>{label}</span>
                <span style={{ width: 36, height: 18, borderRadius: 9, background: val ? '#00d4aa' : '#334155', display: 'inline-flex', alignItems: 'center', padding: '0 2px', justifyContent: val ? 'flex-end' : 'flex-start', transition: 'background 0.2s' }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'white' }} />
                </span>
              </button>
            ))}
          </div>

          {/* Vehicle cards */}
          <div style={{ padding: '14px 16px', flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#64748b', marginBottom: 10 }}>
              VEHICLE STATUS — SINGLE TRIP
            </div>
            {stats.length === 0 && !loading && (
              <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', marginTop: 20 }}>Waiting for routes...</div>
            )}
            {stats.map(v => {
              const loadPct = Math.min(100, (v.load / v.cap) * 100);
              const barColor = loadPct > 80 ? '#ef4444' : loadPct > 50 ? '#f59e0b' : '#22c55e';
              return (
                <div key={v.id} style={{ background: v.done ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${v.done ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      {v.type === 'auto' ? '🛺' : '🚛'} {v.id} — {v.sector}
                    </span>
                    <span style={{ fontSize: 11, borderRadius: 20, padding: '2px 8px',
                      background: v.done ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)',
                      color: v.done ? '#22c55e' : '#60a5fa',
                      border: `1px solid ${v.done ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.3)'}` }}>
                      {v.done ? '✅ Delivered' : '🔄 Collecting'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 5 }}>
                    <span>{v.load} / {v.cap} kg</span>
                    <span>{v.dist} km · ~{v.dur} min</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: '#1e293b', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${loadPct}%`, background: barColor, transition: 'width 0.4s, background 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#64748b', marginBottom: 10 }}>LEGEND</div>
            {[
              { color: '#22c55e', icon: '🛺', label: 'Auto Tipper (1.5T)', sub: 'Residential zones' },
              { color: '#3b82f6', icon: '🚛', label: 'Compactor Truck (5T)', sub: 'Major sectors' },
              { color: '#f59e0b', icon: '🏭', label: '4 DWCCs', sub: 'Dry waste destinations' },
              { color: '#ef4444', icon: '♻️', label: 'Bio-Methanisation', sub: 'Wet waste processing' },
              { color: '#6366f1', icon: '🏪', label: 'Depot', sub: 'All vehicles start here' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0, boxShadow: `0 0 5px ${item.color}` }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{item.icon} {item.label}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

          {/* Overlay stats */}
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
            {[
              { label: 'On Route', value: stats.filter(v=>!v.done).length, color: '#3b82f6' },
              { label: 'Delivered', value: doneCount, color: '#22c55e' },
              { label: 'Waste Collected', value: `${(totalCollected/1000).toFixed(1)}T`, color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(10,15,26,0.88)', backdropFilter: 'blur(8px)',
                border: `1px solid ${s.color}33`, borderRadius: 10, padding: '8px 14px', minWidth: 130 }}>
                <div style={{ fontSize: 10, color: '#64748b' }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Start prompt */}
          {!loading && !isRunning && stats.length > 0 && !allDone && stats.every(v=>v.load === 0) && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 5 }}>
              <div style={{ background: 'rgba(10,15,26,0.93)', border: '1px solid rgba(0,212,170,0.4)', borderRadius: 20, padding: '28px 44px', textAlign: 'center', backdropFilter: 'blur(16px)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🗺️</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Real Road Routes Ready</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                  7 vehicles · OSRM road-optimised paths<br/>
                  Single trip per vehicle · Ends at nearest DWCC
                </div>
                <div style={{ fontSize: 11, color: '#00d4aa', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', padding: '8px 18px', borderRadius: 20 }}>
                  Press ▶ Play to begin
                </div>
              </div>
            </div>
          )}

          {/* All done overlay */}
          {allDone && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 5 }}>
              <div style={{ background: 'rgba(10,15,26,0.93)', border: '1px solid rgba(34,197,94,0.5)', borderRadius: 20, padding: '28px 44px', textAlign: 'center', backdropFilter: 'blur(16px)' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>Collection Cycle Complete!</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {totalCollected.toLocaleString()} kg collected · All 7 vehicles at DWCC<br/>
                  Press ↺ Reset to run again
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
