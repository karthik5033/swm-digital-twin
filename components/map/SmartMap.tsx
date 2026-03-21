'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';
import { HSR_DATA } from '@/lib/constants';

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

interface TruckRoutes {
  baseline: { segments: number[][][]; total_km: number };
  optimized: { segments: number[][][]; total_km: number };
}

// ─── Layer config ─────────────────────────────────────────────────────────────

type LayerCategory = 'SPATIAL' | 'BUILDING' | 'DATA';

interface LayerConfig {
  id: string;
  label: string;
  color: string;
  defaultOn: boolean;
  count?: string;
  category: LayerCategory;
}

const LAYERS: LayerConfig[] = [
  // SPATIAL
  { id: 'ward',    label: 'Ward Boundary', color: '#00d4aa', defaultOn: true, category: 'SPATIAL' },
  { id: 'roads',   label: 'Road Network',  color: '#475569', defaultOn: true, category: 'SPATIAL' },
  { id: 'dumps',   label: 'Dry Waste Centers', color: '#0ea5e9', defaultOn: true, count: '29', category: 'SPATIAL' },
  { id: 'heatmap', label: 'Waste Heatmap', color: '#f59e0b', defaultOn: false, category: 'SPATIAL' },
  { id: 'routes',  label: 'Truck Routes',  color: '#00d4aa', defaultOn: false, category: 'SPATIAL' },

  // BUILDING
  { id: 'building-footprints', label: 'Building Footprints', color: '#a855f7', defaultOn: false, count: '9,483', category: 'BUILDING' },
  { id: '3d-buildings',        label: '3D Buildings',        color: '#3b82f6', defaultOn: false, category: 'BUILDING' },
  { id: 'building-types',      label: 'Building Types',      color: '#f4a460', defaultOn: false, category: 'BUILDING' },

  // DATA
  { id: 'zone-grid',   label: 'Zone Grid',   color: '#fb923c', defaultOn: false, category: 'DATA' },
  { id: 'openspaces',  label: 'Open Spaces',  color: '#22c55e', defaultOn: false, category: 'DATA' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SmartMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [zoneAnalysisData, setZoneAnalysisData] = useState<any>(null); // Added state for zone summary
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>(
    () => Object.fromEntries(LAYERS.map((l) => [l.id, l.defaultOn]))
  );

  // ── Initialize Map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: [77.6483, 12.9145],   // FIX 1: Start on HSR Layout
      zoom: 14,
      pitch: 0,
      bearing: 0,
    });

    map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    popup.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '280px',
    });

    map.current.on('load', async () => {
      const m = map.current!;

      // ── Fetch all data ─────────────────────────────────────────────────
      const [ward, roads, dumps, buildingsOsm, truckRaw, zoneRaw, openSpaces] =
        await Promise.all([
          fetch('/data/hsr_ward_boundary.geojson').then((r) => r.json()),
          fetch('/data/hsr_road_network.geojson').then((r) => r.json()),
          fetch('/data/dump_sites.json').then((r) => r.json()),
          fetch('/data/buildings_osm.geojson').then((r) => r.json()).catch(() => null),
          fetch('/data/truck_routes.json').then((r) => r.json()),
          fetch('/data/zone_analysis.json').then((r) => r.json()),
          fetch('/data/open_spaces.geojson').then((r) => r.json()),
        ]);

      const truckRoutes: TruckRoutes = truckRaw;
      const zoneAnalysis: ZoneAnalysis = zoneRaw;

      // ═══════════════════════════════════════════════════════════════
      // FIX 7: Ward Boundary — 3px wide, full opacity, subtle fill
      // ═══════════════════════════════════════════════════════════════
      m.addSource('ward-source', { type: 'geojson', data: ward });
      m.addLayer({
        id: 'ward-fill',
        type: 'fill',
        source: 'ward-source',
        paint: { 'fill-color': '#00d4aa', 'fill-opacity': 0.04 },
        layout: { visibility: 'visible' },
      });
      m.addLayer({
        id: 'ward-line',
        type: 'line',
        source: 'ward-source',
        paint: { 'line-color': '#00d4aa', 'line-width': 3, 'line-opacity': 1.0 },
        layout: { visibility: 'visible' },
      });

      m.on('click', 'ward-fill', () => setSidebarOpen(true));
      m.on('mouseenter', 'ward-fill', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'ward-fill', () => { m.getCanvas().style.cursor = ''; });

      // ═══════════════════════════════════════════════════════════════
      // FIX ZONE GRID - GeoJSON features from zone bounds
      // ═══════════════════════════════════════════════════════════════
      setZoneAnalysisData(zoneAnalysis); // Store for sidebar summary

      const zoneFeatures = (zoneAnalysis.zones || []).map((zone: any) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [zone.bounds[0], zone.bounds[1]], // SW
            [zone.bounds[2], zone.bounds[1]], // SE
            [zone.bounds[2], zone.bounds[3]], // NE
            [zone.bounds[0], zone.bounds[3]], // NW
            [zone.bounds[0], zone.bounds[1]]  // close
          ]]
        },
        properties: {
          zone_id: zone.zone_id,
          waste_kg_day: zone.waste_kg_day,
          population: zone.population_estimate || Math.round(zone.waste_kg_day / 0.45) || 0,
          residential: zone.residential_count || 0,
          commercial: zone.commercial_count || 0,
          risk: zone.risk,
          center_lon: zone.center?.[0] || 0,
          center_lat: zone.center?.[1] || 0
        }
      }));

      m.addSource('zone-grid-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: zoneFeatures }
      });

      m.addLayer({
        id: 'zone-grid-fill',
        type: 'fill',
        source: 'zone-grid-source',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'interpolate', ['linear'], ['get', 'waste_kg_day'],
            0,   '#22c55e',   // green
            100, '#f59e0b',   // amber
            200, '#ef4444',   // red
            400, '#7f1d1d'    // dark red
          ],
          'fill-opacity': 0.45
        }
      });

      m.addLayer({
        id: 'zone-grid-border',
        type: 'line',
        source: 'zone-grid-source',
        layout: { visibility: 'none' },
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.5,
          'line-opacity': 0.7,
          'line-dasharray': [3, 2]
        }
      });

      m.addLayer({
        id: 'zone-grid-labels',
        type: 'symbol',
        source: 'zone-grid-source',
        layout: {
          visibility: 'none',
          'text-field': [
            'concat',
            ['get', 'zone_id'],
            '\n',
            ['to-string', ['round', ['get', 'waste_kg_day']]],
            ' kg'
          ],
          'text-size': 11,
          'text-anchor': 'center',
          'text-justify': 'center',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1.5
        }
      });

      m.on('click', 'zone-grid-fill', (e) => {
        const props = e.features?.[0]?.properties as any;
        if (!props) return;
        
        const riskColor = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }[props.risk as string] || '#6b7280';
        const riskBadge = `<span style="background:${riskColor}22;color:${riskColor};border:1px solid ${riskColor};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold;text-transform:uppercase;">${props.risk} risk</span>`;

        const wkg = Math.round(props.waste_kg_day);
        const wetT = (wkg * 0.61 / 1000).toFixed(2);
        const dryT = (wkg * 0.30 / 1000).toFixed(2);
        const hazT = (wkg * 0.05 / 1000).toFixed(2);

        new maplibregl.Popup({ maxWidth: '300px', className: 'zone-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="background:#111827;color:white;padding:14px;border-radius:8px;font-family:sans-serif;width:265px;box-sizing:border-box;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-size:16px;font-weight:bold;color:#00d4aa;text-shadow:none;">Zone ${props.zone_id}</span>${riskBadge}
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                <div style="background:#1f2937;padding:8px;border-radius:6px;">
                  <div style="color:#94a3b8;font-size:10px;text-transform:uppercase;">Waste/Day</div>
                  <div style="color:#f59e0b;font-size:16px;font-weight:bold;text-shadow:none;">${wkg} kg</div>
                </div>
                <div style="background:#1f2937;padding:8px;border-radius:6px;">
                  <div style="color:#94a3b8;font-size:10px;text-transform:uppercase;">Population</div>
                  <div style="color:#00d4aa;font-size:16px;font-weight:bold;text-shadow:none;">${Number(props.population).toLocaleString()}</div>
                </div>
                <div style="background:#1f2937;padding:8px;border-radius:6px;">
                  <div style="color:#94a3b8;font-size:10px;text-transform:uppercase;">Residential</div>
                  <div style="color:white;font-size:16px;font-weight:bold;text-shadow:none;">${props.residential} bldgs</div>
                </div>
                <div style="background:#1f2937;padding:8px;border-radius:6px;">
                  <div style="color:#94a3b8;font-size:10px;text-transform:uppercase;">Commercial</div>
                  <div style="color:white;font-size:16px;font-weight:bold;text-shadow:none;">${props.commercial} bldgs</div>
                </div>
              </div>
              <div style="background:#0f172a;border:1px solid #1e3a5f;padding:10px;border-radius:8px;margin-bottom:8px;">
                <div style="color:#3b82f6;font-size:10px;font-weight:bold;text-transform:uppercase;margin-bottom:6px;letter-spacing:0.06em;">WASTE JOURNEY (BBMP 2013)</div>
                <div style="display:grid;gap:4px;">
                  <div style="color:#22c55e;font-size:11px;">🟢 ${Math.round(wkg*0.61)}kg → <span style="color:#94a3b8;">Bio-methanisation unit</span></div>
                  <div style="color:#3b82f6;font-size:11px;">🔵 ${Math.round(wkg*0.30)}kg → <span style="color:#94a3b8;">Nearest DWCC centre</span></div>
                  <div style="color:#ef4444;font-size:11px;">🔴 ${Math.round(wkg*0.05)}kg → <span style="color:#94a3b8;">Special contractor pickup</span></div>
                </div>
              </div>
              <div style="background:#1f2937;padding:8px;border-radius:6px;font-size:11px;color:#94a3b8;line-height:1.4;text-shadow:none;">
                ${props.risk === 'high' ? '⚠️ Priority collection zone — schedule daily pickup' : props.risk === 'medium' ? '📋 Standard collection — every 2 days' : '✅ Low priority — weekly collection sufficient'}
              </div>
              <div style="font-size:9px;color:#475569;margin-top:6px;text-align:center">
                Composition: BBMP Official 2013 · Rate: CPCB 0.5kg/person/day
              </div>
            </div>
          `)
          .addTo(m);
      });

      m.on('mouseenter', 'zone-grid-fill', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'zone-grid-fill', () => { m.getCanvas().style.cursor = ''; });


      // ═══════════ Road Network ═══════════
      m.addSource('roads-source', { type: 'geojson', data: roads });
      m.addLayer({
        id: 'roads-line',
        type: 'line',
        source: 'roads-source',
        paint: { 'line-color': '#475569', 'line-width': 1, 'line-opacity': 0.5 },
        layout: { visibility: 'visible' },
      });

      // ═══════════════════════════════════════════════════════════════
      // Accurate Waste Heatmap — True Density via Building Points
      // ═══════════════════════════════════════════════════════════════
      // buildings.geojson contains point features with precise waste_kg_day counts
      m.addSource('heatmap-source', {
        type: 'geojson',
        data: '/data/buildings.geojson',
      });

      m.addLayer({
        id: 'heatmap-fill', // keep id so toggleLayer('heatmap') works
        type: 'heatmap',
        source: 'heatmap-source',
        paint: {
          // Flatten the weight curve so even low waste buildings contribute to base density
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'waste_kg_day'],
            0, 0,
            10, 0.2,
            100, 0.6,
            500, 1
          ],
          // Massively scale up intensity to reveal the heatmap layers
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            12, 1,
            15, 3,
            18, 5
          ],
          // Gorgeous modern UI colors (Blue->Green->Yellow->Red)
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.1, '#3b82f6', // blue (low)
            0.3, '#22c55e', // green (moderate)
            0.5, '#eab308', // yellow (medium)
            0.7, '#f97316', // orange (high)
            0.9, '#ef4444', // red (severe)
            1.0, '#7f1d1d'  // dark red (critical)
          ],
          // Much larger radius so the 9000+ building points overlap naturally and blend
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            11, 15,
            14, 30,
            16, 60,
            18, 120
          ],
          'heatmap-opacity': 0.75
        },
        layout: { visibility: 'none' },
      });

      // ═══════════════════════════════════════════════════════════════
      // FIX 6: DWCC Sites — proper markers with pulse ring
      // ═══════════════════════════════════════════════════════════════
      const dumpFeatures = (dumps as DumpSite[]).map((d) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [d.lon, d.lat] },
        properties: { id: d.id, risk: d.risk, area_sqm: d.area_sqm, ward: d.ward },
      }));

      m.addSource('dumps-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: dumpFeatures },
      });

      // Pulse halo for high-risk dumps -> large DWCC
      m.addLayer({
        id: 'dumps-pulse',
        type: 'circle',
        source: 'dumps-source',
        filter: ['==', ['get', 'risk'], 'high'],
        paint: {
          'circle-radius': 22,
          'circle-color': '#0ea5e9',
          'circle-opacity': 0.25,
          'circle-stroke-width': 0,
        },
        layout: { visibility: 'visible' },
      });

      m.addLayer({
        id: 'dumps-circle',
        type: 'circle',
        source: 'dumps-source',
        paint: {
          'circle-color': ['match', ['get', 'risk'], 'high', '#0ea5e9', 'medium', '#38bdf8', 'low', '#7dd3fc', '#7dd3fc'],
          'circle-radius': ['match', ['get', 'risk'], 'high', 12, 'medium', 9, 'low', 7, 8],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.95,
        },
        layout: { visibility: 'visible' },
      });

      // DWCC click popup
      m.on('click', 'dumps-circle', (e) => {
        if (!e.features?.length) return;
        const p = e.features[0].properties as { id: string; risk: string; area_sqm: number };
        const capacityColor = p.risk === 'high' ? '#0ea5e9' : p.risk === 'medium' ? '#38bdf8' : '#7dd3fc';
        const capacityLabel = p.risk === 'high' ? '📦 Large Capacity' : p.risk === 'medium' ? '📦 Medium Capacity' : '📦 Small Capacity';
        popup.current!
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:Inter,sans-serif;padding:12px 4px 4px;min-width:200px">
              <div style="font-weight:800;font-size:13px;color:#0f172a;margin-bottom:8px">📍 ${p.id.replace('Dump', 'DWCC')}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <span style="background:${capacityColor};color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px">${capacityLabel}</span>
              </div>
              <div style="font-size:12px;color:#475569">
                <div><b>Area:</b> ${(p.area_sqm / 10000).toFixed(2)} ha</div>
                <div><b>Type:</b> Dry Waste Collection</div>
              </div>
            </div>
          `)
          .addTo(m);
      });
      m.on('mouseenter', 'dumps-circle', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'dumps-circle', () => { m.getCanvas().style.cursor = ''; });

      // ═══════════════════════════════════════════════════════════════
      // FIX 3: Building Footprints — Polygon fill from buildings_osm
      // ═══════════════════════════════════════════════════════════════
      if (buildingsOsm) {
        m.addSource('buildings-source', { type: 'geojson', data: buildingsOsm });

        const firstGeomType = buildingsOsm.features?.[0]?.geometry?.type || 'Polygon';
        const isPolygon = firstGeomType === 'Polygon' || firstGeomType === 'MultiPolygon';

        if (isPolygon) {
          m.addLayer({
            id: 'building-footprints-fill',
            type: 'fill',
            source: 'buildings-source',
            minzoom: 13,
            paint: {
              'fill-color': [
                'match', ['get', 'building_type'],
                'Residential (House)',     '#F4A460',
                'Residential (Apartment)', '#E8824A',
                'Commercial/Retail',       '#6CB4E4',
                'Office/IT',               '#4169E1',
                'Hospital/Medical',        '#FF4444',
                'Educational',             '#FFD700',
                'Religious',               '#9370DB',
                'Government/Civic',        '#20B2AA',
                'Hotel/Hospitality',       '#FF69B4',
                'Industrial',              '#A0A0A0',
                '#94a3b8',
              ],
              'fill-opacity': 0.85,
            },
            layout: { visibility: 'none' },
          });

          m.addLayer({
            id: 'building-footprints-outline',
            type: 'line',
            source: 'buildings-source',
            minzoom: 13,
            paint: { 'line-color': '#00000033', 'line-width': 0.5 },
            layout: { visibility: 'none' },
          });

          // ═══════════════════════════════════════════════════════
          // 3D Building Extrusion — dramatic blue gradient by height
          // ═══════════════════════════════════════════════════════
          const heightByType: Record<string, number> = {
            'Residential (House)': 6,
            'Residential (Apartment)': 18,
            'Commercial/Retail': 10,
            'Office/IT': 28,
            'Hospital/Medical': 14,
            'Educational': 8,
            'Religious': 12,
            'Government/Civic': 10,
            'Hotel/Hospitality': 15,
            'Industrial': 12,
          };

          m.addLayer({
            id: '3d-buildings-classified',
            type: 'fill-extrusion',
            source: 'buildings-source',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['match', ['get', 'building_type'],
                  'Residential (House)', 6,
                  'Residential (Apartment)', 18,
                  'Commercial/Retail', 10,
                  'Office/IT', 28,
                  'Hospital/Medical', 14,
                  'Educational', 8,
                  'Religious', 12,
                  'Government/Civic', 10,
                  8
                ],
                0,   '#0f2027',
                5,   '#1a3a4a',
                10,  '#1e3a5f',
                20,  '#1d4e89',
                30,  '#2563a8',
              ],
              'fill-extrusion-height': [
                'interpolate', ['linear'], ['zoom'],
                14, 0,
                14.05, ['match', ['get', 'building_type'],
                  'Residential (House)', 6,
                  'Residential (Apartment)', 18,
                  'Commercial/Retail', 10,
                  'Office/IT', 28,
                  'Hospital/Medical', 14,
                  'Educational', 8,
                  'Religious', 12,
                  'Government/Civic', 10,
                  'Hotel/Hospitality', 15,
                  'Industrial', 12,
                  8
                ],
              ],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.85,
            },
            layout: { visibility: 'none' },
          });

          console.log('✅ 3D buildings layer added successfully');
        } else {
          // Point geometry fallback
          m.addLayer({
            id: 'building-footprints-fill',
            type: 'circle',
            source: 'buildings-source',
            minzoom: 13,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 3, 15, 6, 17, 10],
              'circle-color': [
                'match', ['get', 'building_type'],
                'Residential (House)',     '#F4A460',
                'Residential (Apartment)', '#E8824A',
                'Commercial/Retail',       '#6CB4E4',
                'Office/IT',               '#4169E1',
                'Hospital/Medical',        '#FF4444',
                'Educational',             '#FFD700',
                'Religious',               '#9370DB',
                'Government/Civic',        '#20B2AA',
                '#94a3b8',
              ],
              'circle-opacity': 0.9,
              'circle-stroke-width': 0.5,
              'circle-stroke-color': '#00000066',
            },
            layout: { visibility: 'none' },
          });
        }

        // Hover popup for buildings
        m.on('mousemove', 'building-footprints-fill', (e) => {
          if (!e.features?.length) return;
          m.getCanvas().style.cursor = 'pointer';
          const p = e.features[0].properties as any;
          const bType = p.building_type || 'Unknown';
          const area = Math.round(p.area_sqm || 0);
          const waste = (area * 0.02).toFixed(1);
          popup.current!
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family:Inter,sans-serif;padding:6px;min-width:150px;color:#0f172a">
                <div style="font-weight:800;font-size:12px;margin-bottom:4px;color:#1e3a5f">🏠 ${bType}</div>
                <div style="font-size:11px;color:#475569">
                  <div><b>Area:</b> ${area} sqm</div>
                  <div><b>Est. waste:</b> ${waste} kg/day</div>
                </div>
              </div>
            `)
            .addTo(m);
        });
        m.on('mouseleave', 'building-footprints-fill', () => {
          m.getCanvas().style.cursor = '';
          popup.current?.remove();
        });
      }

      // ═══════════ Truck Routes ═══════════
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
        id: 'routes-baseline-line', type: 'line', source: 'routes-baseline',
        paint: { 'line-color': '#ef4444', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.8 },
        layout: { visibility: 'none' },
      });
      m.addLayer({
        id: 'routes-optimized-line', type: 'line', source: 'routes-optimized',
        paint: { 'line-color': '#00d4aa', 'line-width': 2, 'line-opacity': 0.9 },
        layout: { visibility: 'none' },
      });

      // ═══════════ Open Spaces ═══════════
      m.addSource('openspaces-source', { type: 'geojson', data: openSpaces });
      m.addLayer({
        id: 'openspaces-circle', type: 'circle', source: 'openspaces-source',
        paint: {
          'circle-color': ['match', ['get', 'type'], 'green', '#22c55e', 'water', '#3b82f6', '#22c55e'],
          'circle-radius': 8, 'circle-opacity': 0.75, 'circle-stroke-width': 1.5, 'circle-stroke-color': '#ffffff',
        },
        layout: { visibility: 'none' },
      });

      // ═══════════ Ambient Lighting for 3D ═══════════
      if (typeof m.setLight === 'function') {
        try {
          m.setLight({
            anchor: 'viewport',
            color: '#ffffff',
            intensity: 0.45,
            position: [1.5, 210, 35],
          });
        } catch (_) {}
      }

      setMapLoaded(true);

      // Show hint toast after load
      setShowHint(true);
      setTimeout(() => setShowHint(false), 4000);
    });

    return () => {
      popup.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // ── Shared 3D toggle function ──────────────────────────────────────────────
  const toggle3D = useCallback(() => {
    if (!map.current || !mapLoaded) return;
    const m = map.current;

    if (!is3D) {
      // ── Turn ON 3D ──
      if (m.getLayer('3d-buildings-classified')) {
        m.setLayoutProperty('3d-buildings-classified', 'visibility', 'visible');
      }
      // Hide 2D building footprints while 3D is on
      if (m.getLayer('building-footprints-fill')) {
        m.setLayoutProperty('building-footprints-fill', 'visibility', 'none');
      }
      if (m.getLayer('building-footprints-outline')) {
        m.setLayoutProperty('building-footprints-outline', 'visibility', 'none');
      }
      m.easeTo({
        pitch: 52,
        bearing: -20,
        zoom: 15.5,
        center: [77.6400, 12.9130],
        duration: 1200,
      });
      // Dramatic lighting
      if (typeof m.setLight === 'function') {
        try {
          m.setLight({ anchor: 'viewport', color: '#ffffff', intensity: 0.55, position: [2, 220, 30] });
        } catch (_) {}
      }
      setIs3D(true);
      setLayerVisibility((prev) => ({ ...prev, '3d-buildings': true, 'building-footprints': false }));
    } else {
      // ── Turn OFF 3D ──
      if (m.getLayer('3d-buildings-classified')) {
        m.setLayoutProperty('3d-buildings-classified', 'visibility', 'none');
      }
      m.easeTo({
        pitch: 0,
        bearing: 0,
        zoom: 14,
        center: [77.6483, 12.9145],
        duration: 800,
      });
      setIs3D(false);
      setLayerVisibility((prev) => ({ ...prev, '3d-buildings': false }));
    }
  }, [mapLoaded, is3D]);

  // ── Toggle layer visibility ────────────────────────────────────────────────
  const toggleLayer = useCallback(
    (layerId: string) => {
      if (!map.current || !mapLoaded) return;

      // If toggling 3D from the layer panel, delegate to toggle3D
      if (layerId === '3d-buildings') {
        toggle3D();
        return;
      }

      setLayerVisibility((prev) => {
        const next = { ...prev, [layerId]: !prev[layerId] };
        const vis = next[layerId] ? 'visible' : 'none';
        const m = map.current!;

        const setVis = (id: string) => {
          if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', vis);
        };

        if (layerId === 'ward')               { setVis('ward-fill'); setVis('ward-line'); }
        else if (layerId === 'roads')          { setVis('roads-line'); }
        else if (layerId === 'heatmap')        { setVis('heatmap-fill'); }
        else if (layerId === 'dumps')          { setVis('dumps-circle'); setVis('dumps-pulse'); }
        else if (layerId === 'building-footprints') {
          setVis('building-footprints-fill');
          if (m.getLayer('building-footprints-outline')) setVis('building-footprints-outline');
        }
        else if (layerId === 'building-types') {
          // Show classified 3D with tilt
          const showTyped = next[layerId];
          if (m.getLayer('3d-buildings-classified')) m.setLayoutProperty('3d-buildings-classified', 'visibility', showTyped ? 'visible' : 'none');
          if (showTyped) {
            m.easeTo({ pitch: 52, bearing: -20, zoom: 15.5, center: [77.6400, 12.9130], duration: 1200 });
          } else {
            m.easeTo({ pitch: 0, bearing: 0, duration: 800 });
          }
        }
        else if (layerId === 'zone-grid') {
          setVis('zone-grid-fill');
          setVis('zone-grid-border');
          setVis('zone-grid-labels');
        }
        else if (layerId === 'routes')         { setVis('routes-baseline-line'); setVis('routes-optimized-line'); }
        else if (layerId === 'openspaces')     { setVis('openspaces-circle'); }

        return next;
      });
    },
    [mapLoaded, toggle3D]
  );

  return (
    <div id="smart-map-page" className="flex flex-col h-full w-full">
      {/* ══════════════════════════════════════════════════════ */}
      {/* FIX 9: Stats Bar — teal numbers, | dividers          */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="shrink-0 bg-[#0a0f1a] border-b border-white/10 px-6 py-2 flex items-center justify-center gap-0 text-xs font-semibold tracking-wide">
        {[
          { label: 'sq km', value: `${HSR_DATA.area_sq_km}`, warn: false },
          { label: 'population', value: HSR_DATA.population_building_based.toLocaleString(), warn: false },
          { label: 'waste/day', value: `${HSR_DATA.waste_daily_tons}T`, warn: false },
          { label: 'route saving', value: `${HSR_DATA.route_improvement_pct}%`, warn: false },
          { label: 'dump sites', value: `${HSR_DATA.dump_sites_detected}`, warn: true },
        ].map(({ label, value, warn }, i) => (
          <React.Fragment key={label}>
            {i > 0 && <span className="text-white/15 mx-4 select-none">|</span>}
            <div className="flex items-center gap-2 text-white/55">
              <span className={`text-sm font-black ${warn ? 'text-orange-400' : 'text-[#00d4aa]'}`}>{value}</span>
              <span>{label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* ── Map Container ───────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

        {/* ── Floating 3D Toggle Button ── */}
        <div className="absolute z-10" style={{ top: 120, right: 10 }}>
          <button
            onClick={toggle3D}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300"
            style={{
              background: is3D ? '#00d4aa' : '#1f2937',
              border: is3D ? '1px solid #00d4aa' : '1px solid #374151',
              color: is3D ? '#0a0f1e' : '#ffffff',
              boxShadow: is3D ? '0 0 16px rgba(0,212,170,0.4), 0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>3D</span>
          </button>
        </div>

        {/* ── Hint Toast ── */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-500"
          style={{
            opacity: showHint ? 1 : 0,
            transform: `translateX(-50%) translateY(${showHint ? '0' : '12px'})`,
          }}
        >
          <div
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white flex items-center gap-2"
            style={{
              background: 'rgba(10,15,26,0.92)',
              border: '1px solid rgba(0,212,170,0.3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span>💡</span>
            <span>Click <b style={{ color: '#00d4aa' }}>3D</b> button to see HSR Layout in three dimensions</span>
          </div>
        </div>

        {/* ── Layer Toggle Panel ── */}
        <div className="absolute top-4 left-4 z-10 w-56">
          <div
            className="rounded-2xl p-4 flex flex-col gap-4 max-h-[calc(100vh-200px)] overflow-y-auto"
            style={{
              background: 'rgba(10,15,26,0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {(['SPATIAL', 'BUILDING', 'DATA'] as LayerCategory[]).map((category) => (
              <div key={category} className="flex flex-col gap-2">
                <div className="text-white/40 font-bold text-[10px] uppercase tracking-widest pl-1">
                  {category} LAYERS
                </div>
                {LAYERS.filter((l) => l.category === category).map((layer) => {
                  const on = layerVisibility[layer.id];
                  return (
                    <button
                      key={layer.id}
                      id={`toggle-${layer.id}`}
                      onClick={() => toggleLayer(layer.id)}
                      className="flex items-center gap-3 w-full text-left group pr-2"
                    >
                      <div
                        className="shrink-0 w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors"
                        style={{
                          background: on ? layer.color : 'transparent',
                          borderColor: on ? layer.color : 'rgba(255,255,255,0.2)',
                        }}
                      >
                        {on && <span className="text-white text-[9px] font-bold">✓</span>}
                      </div>
                      <span
                        className="flex-1 text-[11px] font-semibold transition-colors"
                        style={{ color: on ? '#f1f5f9' : '#94a3b8' }}
                      >
                        {layer.label}
                      </span>
                      {layer.count && (
                        <span className="text-[10px] font-bold" style={{ color: on ? layer.color : '#475569' }}>
                          ({layer.count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ── Zone Grid Summary Sidebar ── */}
        {layerVisibility['zone-grid'] && zoneAnalysisData?.zones && (
          <div 
            className="absolute right-4 z-10 w-[260px] bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden pointer-events-auto"
            style={{ top: '220px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
          >
            {/* Header */}
            <div className="bg-teal-900/40 px-4 py-3 border-b border-teal-500/20">
              <h3 className="text-white font-extrabold text-[15px] flex items-center gap-2">
                <span className="text-lg leading-none">📊</span> Zone Analysis
              </h3>
              <div className="text-teal-400/80 text-[10px] font-bold uppercase tracking-wider mt-1">
                HSR Layout · 36 zones · 500m grid
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Population Section */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">POPULATION (Building-Based Method)</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Total:</span>
                    <span className="font-mono font-bold text-white">{HSR_DATA.population_building_based.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Houses 8,998 × 4:</span>
                    <span>35,992</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Apartments 250 × 30:</span>
                    <span>7,500</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Others (offices/etc):</span>
                    <span>2,727</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Method:</span>
                    <span>{HSR_DATA.population_source}</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-800 w-full" />

              {/* Daily Waste Section */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">DAILY WASTE</div>
                <div className="flex justify-between text-xs text-slate-300 font-bold mb-1">
                  <span>Total:</span>
                  <span className="text-white">{HSR_DATA.daily_waste_kg.toLocaleString()} kg</span>
                </div>
                <div className="text-[10px] text-slate-500 text-right -mt-1 mb-2">({HSR_DATA.daily_waste_display}/day)</div>
                
                <div className="space-y-1 border-b border-slate-800 pb-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5"><span className="text-[10px]">🟢</span> Wet 61%:</span>
                    <span className="font-mono text-slate-400">14,100 kg</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5"><span className="text-[10px]">🔵</span> Dry 30%:</span>
                    <span className="font-mono text-slate-400">6,933 kg</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5"><span className="text-[10px]">🔴</span> Haz 5%:</span>
                    <span className="font-mono text-slate-400">1,156 kg</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5"><span className="text-[10px]">⚪</span> Other 4%:</span>
                    <span className="font-mono text-slate-400">921 kg</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 leading-relaxed">
                  <div className="flex justify-between"><span>Rate:</span><span className="text-slate-400">{HSR_DATA.waste_per_capita_kg}kg/person/day (CPCB)</span></div>
                </div>
              </div>

              <div className="h-px bg-slate-800 w-full" />
              
              {/* Risk Profile */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">RISK PROFILE</div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-md p-1.5 text-center">
                    <div className="text-[10px] text-red-500 font-bold mb-0.5">High</div>
                    <div className="text-sm font-bold text-white">8</div>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-1.5 text-center">
                    <div className="text-[10px] text-amber-500 font-bold mb-0.5">Med</div>
                    <div className="text-sm font-bold text-white">11</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-md p-1.5 text-center">
                    <div className="text-[10px] text-green-500 font-bold mb-0.5">Low</div>
                    <div className="text-sm font-bold text-white">17</div>
                  </div>
                </div>
              </div>
              
              <div className="h-px bg-slate-800 w-full" />

              {/* Infrastructure */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">INFRASTRUCTURE</div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>🏭</span>
                  <span>16 DWCC centers</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>♻️</span>
                  <span>2 Bio-methanisation units</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>🚯</span>
                  <span>0 Open dumpyards</span>
                </div>
              </div>

              {/* Footer Source */}
              <div className="pt-2 text-[9px] text-slate-600 bg-slate-800/30 p-2 rounded border border-slate-700/50">
                <div className="font-semibold">Source: Census 2011 · geoiq.io</div>
                <div>Method: CPCB 0.5kg/person/day</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Ward Info Sidebar ── */}
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
          <button
            id="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors text-xl"
          >
            ✕
          </button>
          <div className="p-6 pt-8 flex flex-col gap-5">
            <div>
              <div className="text-[#00d4aa] text-xs font-bold uppercase tracking-widest mb-1">Ward Intelligence</div>
              <h2 className="text-white text-xl font-black tracking-tight">HSR Layout</h2>
              <p className="text-white/40 text-xs mt-1">📍 Bengaluru South Zone · BBMP</p>
            </div>
            <div className="h-px bg-white/10" />
            <SidebarSection title="Satellite Analysis" icon="🛰️">
              <SidebarRow icon="🏠" label="Rooftops mapped" value={HSR_DATA.total_buildings.toLocaleString()} />
              <SidebarRow icon="👥" label="Population (building-based)" value={HSR_DATA.population_building_based.toLocaleString()} />
              <SidebarRow icon="📦" label="Waste generated" value={`${HSR_DATA.daily_waste_tons} T/day`} highlight />
              <SidebarRow icon="🌿" label="Green cover" value={`${HSR_DATA.lulc_vegetation}%`} warn />
              <SidebarRow icon="📐" label="Total area" value={`${HSR_DATA.area_sq_km} sq km`} />
            </SidebarSection>
            <div className="h-px bg-white/10" />
            <SidebarSection title="Collection Centers" icon="♻️">
              <SidebarRow icon="🔵" label="Large capacity" value="10" />
              <SidebarRow icon="🟢" label="Medium capacity" value="3" />
              <SidebarRow icon="⚪" label="Small capacity" value="16" />
              <SidebarRow icon="📊" label="Total centers" value={HSR_DATA.dump_sites_detected.toString()} highlight />
            </SidebarSection>
            <div className="h-px bg-white/10" />
            <SidebarSection title="Route Optimization" icon="🚛">
              <SidebarRow icon="📍" label="Before (baseline)" value={`${HSR_DATA.baseline_route_km} km/day`} />
              <SidebarRow icon="✅" label="After (optimized)" value={`${HSR_DATA.optimized_route_km} km/day`} highlight />
              <div
                className="mt-2 px-3 py-2 rounded-xl text-xs font-bold text-center"
                style={{ background: 'rgba(0,212,170,0.1)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.2)' }}
              >
                🎉 {HSR_DATA.route_improvement_pct}% distance reduction achieved
              </div>
            </SidebarSection>
            <div className="h-px bg-white/10" />
            <SidebarSection title="Land Cover (LULC)" icon="🗺️">
              <LandCoverBar label="Rooftops" pct={20.9} color="#f59e0b" />
              <LandCoverBar label="Roads" pct={31.3} color="#475569" />
              <LandCoverBar label="Vegetation" pct={4.0} color="#22c55e" />
              <LandCoverBar label="Water" pct={3.2} color="#3b82f6" />
              <LandCoverBar label="Mixed" pct={38.5} color="#a855f7" />
            </SidebarSection>
            <div className="h-px bg-white/10" />
            <div className="flex flex-col gap-3">
              <Link href="/impact" className="w-full py-3 rounded-xl text-center text-sm font-bold transition-all" style={{ background: 'rgba(0,212,170,0.12)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.25)' }}>
                View Economic Impact →
              </Link>
              <Link href="/simulation" className="w-full py-3 rounded-xl text-center text-sm font-bold transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                Run Simulation →
              </Link>
            </div>
          </div>
        </div>

        {sidebarOpen && (
          <div className="absolute inset-0 z-[9]" onClick={() => setSidebarOpen(false)} style={{ cursor: 'default' }} />
        )}
      </div>

      <style>{`
        /* Maplibre Popup Resets for Zone Popups */
        .maplibregl-popup-content, .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        }
        .maplibregl-popup-tip, .mapboxgl-popup-tip {
          border-top-color: #111827 !important;
          border-bottom-color: #111827 !important;
        }
        .zone-popup .maplibregl-popup-close-button, .zone-popup .mapboxgl-popup-close-button {
          color: #94a3b8;
          font-size: 16px;
          padding: 4px 8px;
        }
        .zone-popup .maplibregl-popup-close-button:hover, .zone-popup .mapboxgl-popup-close-button:hover {
          color: #ffffff;
          background: transparent;
        }
      `}</style>
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

function SidebarRow({ icon, label, value, highlight, warn, danger }: {
  icon: string; label: string; value: string; highlight?: boolean; warn?: boolean; danger?: boolean;
}) {
  const valueColor = danger ? '#ef4444' : warn ? '#f59e0b' : highlight ? '#00d4aa' : '#94a3b8';
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/50 flex items-center gap-1.5"><span>{icon}</span>{label}</span>
      <span className="font-bold" style={{ color: valueColor }}>{value}</span>
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
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
