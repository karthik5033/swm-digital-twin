'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DumpSite {
  id: string;
  lat: number;
  lon: number;
  risk: 'high' | 'medium' | 'low';
  area_sqm: number;
  ward: string;
}

interface Zone {
  zone_id: string;
  bounds: [number, number, number, number];
  waste_kg_day: number;
  risk: string;
}

interface ZoneAnalysis {
  total_structures: number;
  estimated_population: number;
  waste_per_day_kg: number;
  zones: Zone[];
  residential_count: number;
  commercial_count: number;
  mixed_count: number;
}

interface LulcData {
  total_area_hectares: number;
  lulc_summary: {
    rooftop: { pct: number; rooftop_count: number };
    road_paved: { pct: number };
    vegetation: { pct: number };
    water: { pct: number };
    mixed: { pct: number };
  };
}

interface TruckRoutes {
  baseline: { segments: number[][][]; total_km: number };
  optimized: { segments: number[][][]; total_km: number };
}

// ─── Layer config ─────────────────────────────────────────────────────────────

interface LayerConfig {
  id: string;
  label: string;
  color: string;
  defaultOn: boolean;
  count?: string;
}

const LAYERS: LayerConfig[] = [
  { id: 'ward', label: 'Ward Boundary', color: '#00d4aa', defaultOn: true },
  { id: 'roads', label: 'Road Network', color: '#475569', defaultOn: false },
  { id: 'heatmap', label: 'Waste Heatmap', color: '#f59e0b', defaultOn: true },
  { id: 'dumps', label: 'Dump Sites', color: '#ef4444', defaultOn: true, count: '29' },
  { id: 'buildings', label: 'Buildings', color: '#a855f7', defaultOn: false, count: '760' },
  { id: 'routes', label: 'Truck Routes', color: '#00d4aa', defaultOn: false },
  { id: 'openspaces', label: 'Open Spaces', color: '#22c55e', defaultOn: false },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SmartMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>(
    () => Object.fromEntries(LAYERS.map((l) => [l.id, l.defaultOn]))
  );

  // ── Initialize Map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: [77.6464, 12.9137],
      zoom: 14,
      pitch: 0,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    popup.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '280px',
    });

    map.current.on('load', async () => {
      const m = map.current!;

      // ── Fetch all data in parallel ─────────────────────────────────────────
      const [ward, roads, dumps, buildings, truckRaw, zoneRaw, openSpaces, lulcRaw] =
        await Promise.all([
          fetch('/data/hsr_ward_boundary.geojson').then((r) => r.json()),
          fetch('/data/hsr_road_network.geojson').then((r) => r.json()),
          fetch('/data/dump_sites.json').then((r) => r.json()),
          fetch('/data/buildings.geojson').then((r) => r.json()),
          fetch('/data/truck_routes.json').then((r) => r.json()),
          fetch('/data/zone_analysis.json').then((r) => r.json()),
          fetch('/data/open_spaces.geojson').then((r) => r.json()),
          fetch('/data/lulc_classification.json').then((r) => r.json()),
        ]);

      const truckRoutes: TruckRoutes = truckRaw;
      const zoneAnalysis: ZoneAnalysis = zoneRaw;

      // ── 1. Ward Boundary ─────────────────────────────────────────────────
      m.addSource('ward-source', { type: 'geojson', data: ward });
      m.addLayer({
        id: 'ward-fill',
        type: 'fill',
        source: 'ward-source',
        paint: { 'fill-color': '#00d4aa', 'fill-opacity': 0.08 },
        layout: { visibility: 'visible' },
      });
      m.addLayer({
        id: 'ward-line',
        type: 'line',
        source: 'ward-source',
        paint: { 'line-color': '#00d4aa', 'line-width': 2.5, 'line-opacity': 0.9 },
        layout: { visibility: 'visible' },
      });

      // click ward → open sidebar
      m.on('click', 'ward-fill', () => setSidebarOpen(true));
      m.on('mouseenter', 'ward-fill', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'ward-fill', () => { m.getCanvas().style.cursor = ''; });

      // ── 2. Road Network ──────────────────────────────────────────────────
      m.addSource('roads-source', { type: 'geojson', data: roads });
      m.addLayer({
        id: 'roads-line',
        type: 'line',
        source: 'roads-source',
        paint: { 'line-color': '#475569', 'line-width': 1, 'line-opacity': 0.5 },
        layout: { visibility: 'none' },
      });

      // ── 3. Waste Heatmap Zones ───────────────────────────────────────────
      const zoneFeatures = zoneAnalysis.zones.map((z: Zone) => {
        const [minLng, minLat, maxLng, maxLat] = z.bounds;
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [minLng, minLat],
                [maxLng, minLat],
                [maxLng, maxLat],
                [minLng, maxLat],
                [minLng, minLat],
              ],
            ],
          },
          properties: {
            waste_kg_day: z.waste_kg_day,
            zone_id: z.zone_id,
            risk: z.risk,
          },
        };
      });

      m.addSource('heatmap-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: zoneFeatures },
      });

      m.addLayer({
        id: 'heatmap-fill',
        type: 'fill',
        source: 'heatmap-source',
        paint: {
          'fill-color': [
            'case',
            ['>', ['get', 'waste_kg_day'], 200], '#ef4444',
            ['>', ['get', 'waste_kg_day'], 100], '#f59e0b',
            '#22c55e',
          ],
          'fill-opacity': [
            'case',
            ['>', ['get', 'waste_kg_day'], 200], 0.40,
            ['>', ['get', 'waste_kg_day'], 100], 0.35,
            0.25,
          ],
        },
        layout: { visibility: 'visible' },
      });

      // ── 4. Dump Sites ────────────────────────────────────────────────────
      const dumpFeatures = (dumps as DumpSite[]).map((d) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [d.lon, d.lat] },
        properties: { id: d.id, risk: d.risk, area_sqm: d.area_sqm, ward: d.ward },
      }));

      m.addSource('dumps-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: dumpFeatures },
      });

      m.addLayer({
        id: 'dumps-circle',
        type: 'circle',
        source: 'dumps-source',
        paint: {
          'circle-color': [
            'match', ['get', 'risk'],
            'high', '#ef4444',
            'medium', '#f59e0b',
            '#6b7280',
          ],
          'circle-radius': [
            'match', ['get', 'risk'],
            'high', 10,
            'medium', 8,
            6,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
        layout: { visibility: 'visible' },
      });

      // dump click popup
      m.on('click', 'dumps-circle', (e) => {
        if (!e.features?.length) return;
        const p = e.features[0].properties as { id: string; risk: string; area_sqm: number };
        const riskColor = p.risk === 'high' ? '#ef4444' : p.risk === 'medium' ? '#f59e0b' : '#6b7280';
        const riskLabel = p.risk === 'high' ? '🔴 High Risk' : p.risk === 'medium' ? '🟡 Medium Risk' : '⚫ Low Risk';
        popup.current!
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:Inter,sans-serif;padding:12px 4px 4px;min-width:200px">
              <div style="font-weight:800;font-size:13px;color:#0f172a;margin-bottom:8px">📍 ${p.id}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <span style="background:${riskColor};color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px">${riskLabel}</span>
              </div>
              <div style="font-size:12px;color:#475569">
                <div><b>Area:</b> ${(p.area_sqm / 10000).toFixed(2)} ha</div>
                <div><b>Detected:</b> Satellite Imagery</div>
              </div>
            </div>
          `)
          .addTo(m);
      });
      m.on('mouseenter', 'dumps-circle', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'dumps-circle', () => { m.getCanvas().style.cursor = ''; });

      // ── 5. Buildings ─────────────────────────────────────────────────────
      m.addSource('buildings-source', { type: 'geojson', data: buildings });
      m.addLayer({
        id: 'buildings-circle',
        type: 'circle',
        source: 'buildings-source',
        paint: {
          'circle-color': [
            'match', ['get', 'type'],
            'commercial', '#f59e0b',
            'residential', '#22c55e',
            '#a855f7',
          ],
          'circle-radius': 3,
          'circle-opacity': 0.7,
        },
        layout: { visibility: 'none' },
      });

      // ── 6. Truck Routes ──────────────────────────────────────────────────
      const baselineFeatures = (truckRoutes.baseline?.segments || []).map((seg: number[][]) => ({
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates: seg },
        properties: { type: 'baseline' },
      }));
      const optimizedFeatures = (truckRoutes.optimized?.segments || []).map((seg: number[][]) => ({
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates: seg },
        properties: { type: 'optimized' },
      }));

      m.addSource('routes-baseline', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: baselineFeatures },
      });
      m.addSource('routes-optimized', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: optimizedFeatures },
      });

      m.addLayer({
        id: 'routes-baseline-line',
        type: 'line',
        source: 'routes-baseline',
        paint: {
          'line-color': '#ef4444',
          'line-width': 2,
          'line-dasharray': [2, 2],
          'line-opacity': 0.8,
        },
        layout: { visibility: 'none' },
      });
      m.addLayer({
        id: 'routes-optimized-line',
        type: 'line',
        source: 'routes-optimized',
        paint: { 'line-color': '#00d4aa', 'line-width': 2, 'line-opacity': 0.9 },
        layout: { visibility: 'none' },
      });

      // ── 7. Open Spaces ───────────────────────────────────────────────────
      m.addSource('openspaces-source', { type: 'geojson', data: openSpaces });
      m.addLayer({
        id: 'openspaces-circle',
        type: 'circle',
        source: 'openspaces-source',
        paint: {
          'circle-color': [
            'match', ['get', 'type'],
            'green', '#22c55e',
            'water', '#3b82f6',
            '#22c55e',
          ],
          'circle-radius': 8,
          'circle-opacity': 0.75,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
        layout: { visibility: 'none' },
      });

      setMapLoaded(true);
    });

    return () => {
      popup.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // ── Toggle layer visibility ────────────────────────────────────────────────
  const toggleLayer = useCallback(
    (layerId: string) => {
      if (!map.current || !mapLoaded) return;

      setLayerVisibility((prev) => {
        const next = { ...prev, [layerId]: !prev[layerId] };
        const vis = next[layerId] ? 'visible' : 'none';
        const m = map.current!;

        const setVis = (id: string) => {
          if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', vis);
        };

        if (layerId === 'ward') { setVis('ward-fill'); setVis('ward-line'); }
        else if (layerId === 'roads') { setVis('roads-line'); }
        else if (layerId === 'heatmap') { setVis('heatmap-fill'); }
        else if (layerId === 'dumps') { setVis('dumps-circle'); }
        else if (layerId === 'buildings') { setVis('buildings-circle'); }
        else if (layerId === 'routes') { setVis('routes-baseline-line'); setVis('routes-optimized-line'); }
        else if (layerId === 'openspaces') { setVis('openspaces-circle'); }

        return next;
      });
    },
    [mapLoaded]
  );

  return (
    <div id="smart-map-page" className="flex flex-col h-full w-full">
      {/* ── Top Stats Bar ───────────────────────────────────────────────── */}
      <div className="shrink-0 bg-[#0a0f1a] border-b border-white/10 px-6 py-2 flex items-center justify-center gap-8 text-xs font-semibold tracking-wide">
        {[
          { label: 'mapped', value: '704 ha' },
          { label: 'buildings analyzed', value: '9,471' },
          { label: 'dumps detected', value: '29' },
          { label: 'waste/day', value: '19.78T' },
          { label: 'route saving', value: '75.5%' },
          { label: '⚠️ lake at risk', value: '1', warn: true },
        ].map(({ label, value, warn }) => (
          <div key={label} className="flex items-center gap-2 text-white/50">
            <span className={`text-sm font-black ${warn ? 'text-orange-400' : 'text-[#00d4aa]'}`}>{value}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Map Container ───────────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

        {/* ── Layer Toggle Panel ─────────────────────────────────────────── */}
        <div className="absolute top-4 left-4 z-10 w-56">
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: 'rgba(10,15,26,0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div className="text-white font-bold text-sm tracking-wide mb-1">Map Layers</div>
            {LAYERS.map((layer) => {
              const on = layerVisibility[layer.id];
              return (
                <button
                  key={layer.id}
                  id={`toggle-${layer.id}`}
                  onClick={() => toggleLayer(layer.id)}
                  className="flex items-center gap-3 w-full text-left group"
                >
                  {/* colored dot */}
                  <span
                    className="shrink-0 w-2.5 h-2.5 rounded-full transition-opacity"
                    style={{
                      background: layer.color,
                      opacity: on ? 1 : 0.3,
                      boxShadow: on ? `0 0 6px ${layer.color}` : 'none',
                    }}
                  />
                  {/* label */}
                  <span
                    className="flex-1 text-xs font-semibold transition-colors"
                    style={{ color: on ? '#f1f5f9' : '#64748b' }}
                  >
                    {layer.label}
                  </span>
                  {/* count badge */}
                  {layer.count && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: on ? layer.color + '22' : 'rgba(255,255,255,0.05)',
                        color: on ? layer.color : '#475569',
                      }}
                    >
                      {layer.count}
                    </span>
                  )}
                  {/* Toggle switch */}
                  <div
                    className="shrink-0 w-8 h-4 rounded-full relative transition-colors duration-200"
                    style={{ background: on ? layer.color : 'rgba(255,255,255,0.15)' }}
                  >
                    <div
                      className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200"
                      style={{ transform: on ? 'translateX(16px)' : 'translateX(2px)' }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Ward Info Sidebar ──────────────────────────────────────────── */}
        <div
          className="absolute top-0 right-0 h-full z-10 transition-transform duration-500 ease-in-out overflow-y-auto"
          style={{
            width: '320px',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
            background: 'rgba(10,15,26,0.92)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* close btn */}
          <button
            id="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors text-xl"
          >
            ✕
          </button>

          <div className="p-6 pt-8 flex flex-col gap-5">
            {/* Header */}
            <div>
              <div className="text-[#00d4aa] text-xs font-bold uppercase tracking-widest mb-1">
                Ward Intelligence
              </div>
              <h2 className="text-white text-xl font-black tracking-tight">HSR Layout</h2>
              <p className="text-white/40 text-xs mt-1">📍 Bengaluru South Zone · BBMP</p>
            </div>

            <div className="h-px bg-white/10" />

            {/* Satellite Analysis */}
            <SidebarSection title="Satellite Analysis" icon="🛰️">
              <SidebarRow icon="🏠" label="Rooftops mapped" value="760" />
              <SidebarRow icon="👥" label="Population est." value="1,20,000" />
              <SidebarRow icon="📦" label="Waste generated" value="12.25 T/day" highlight />
              <SidebarRow icon="🌿" label="Green cover" value="4.0%" warn />
              <SidebarRow icon="📐" label="Total area" value="704 ha" />
            </SidebarSection>

            <div className="h-px bg-white/10" />

            {/* Dump Intelligence */}
            <SidebarSection title="Dump Intelligence" icon="🗑️">
              <SidebarRow icon="🔴" label="High risk sites" value="10" danger />
              <SidebarRow icon="🟡" label="Medium risk sites" value="3" />
              <SidebarRow icon="⚫" label="Low risk sites" value="16" />
              <SidebarRow icon="📊" label="Total detected" value="29" highlight />
            </SidebarSection>

            <div className="h-px bg-white/10" />

            {/* Route Optimization */}
            <SidebarSection title="Route Optimization" icon="🚛">
              <SidebarRow icon="📍" label="Before (baseline)" value="132.44 km/day" />
              <SidebarRow icon="✅" label="After (optimized)" value="32.41 km/day" highlight />
              <div
                className="mt-2 px-3 py-2 rounded-xl text-xs font-bold text-center"
                style={{ background: 'rgba(0,212,170,0.1)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.2)' }}
              >
                🎉 75.5% distance reduction achieved
              </div>
            </SidebarSection>

            <div className="h-px bg-white/10" />

            {/* Land Cover */}
            <SidebarSection title="Land Cover (LULC)" icon="🗺️">
              <LandCoverBar label="Rooftops" pct={20.9} color="#f59e0b" />
              <LandCoverBar label="Roads" pct={31.3} color="#475569" />
              <LandCoverBar label="Vegetation" pct={4.0} color="#22c55e" />
              <LandCoverBar label="Water" pct={3.2} color="#3b82f6" />
              <LandCoverBar label="Mixed" pct={38.5} color="#a855f7" />
            </SidebarSection>

            <div className="h-px bg-white/10" />

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link
                href="/impact"
                className="w-full py-3 rounded-xl text-center text-sm font-bold transition-all"
                style={{
                  background: 'rgba(0,212,170,0.12)',
                  color: '#00d4aa',
                  border: '1px solid rgba(0,212,170,0.25)',
                }}
              >
                View Economic Impact →
              </Link>
              <Link
                href="/simulation"
                className="w-full py-3 rounded-xl text-center text-sm font-bold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Run Simulation →
              </Link>
            </div>
          </div>
        </div>

        {/* Click-outside to close sidebar */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-[9]"
            onClick={() => setSidebarOpen(false)}
            style={{ cursor: 'default' }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SidebarSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{title}</span>
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function SidebarRow({
  icon, label, value, highlight, warn, danger,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
  danger?: boolean;
}) {
  const valueColor = danger
    ? '#ef4444'
    : warn
    ? '#f59e0b'
    : highlight
    ? '#00d4aa'
    : '#94a3b8';

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/50 flex items-center gap-1.5">
        <span>{icon}</span>
        {label}
      </span>
      <span className="font-bold" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  );
}

function LandCoverBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <span className="text-white/70 font-bold">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
