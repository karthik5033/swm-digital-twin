'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useStore } from '@/lib/store';
import LayerToggle from './LayerToggle';
import WardSidebar from './WardSidebar';

import dumpSites from '@/data/dump_sites.json';
import wardScores from '@/data/ward_scores.json';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

/* ------------------------------------------------------------------ */
/* helper: build a GeoJSON FeatureCollection from dump_sites.json      */
/* ------------------------------------------------------------------ */
function buildDumpGeoJSON() {
  return {
    type: 'FeatureCollection' as const,
    features: dumpSites.map((site) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [site.lon, site.lat] },
      properties: { ...site },
    })),
  };
}

/* ------------------------------------------------------------------ */
/* helper: build a heatmap-ready GeoJSON from ward_scores.json         */
/* (methane / waste / dumpProbability all use ward centroids)           */
/* ------------------------------------------------------------------ */
function buildHeatGeoJSON(key: 'methaneIntensity' | 'dumpRisk' | 'wasteTons') {
  return {
    type: 'FeatureCollection' as const,
    features: wardScores.map((w) => {
      // Derive an approximate centroid from the geojson data
      const ward = wardsLookup[w.name];
      const coords = ward
        ? getCentroid(ward.geometry.coordinates[0])
        : [77.5946, 12.9716]; // fallback
      const weight = key === 'wasteTons' ? w[key] / 300 : w[key];
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: coords },
        properties: { weight },
      };
    }),
  };
}

/* fast ward lookup (populated after geojson fetch) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wardsLookup: Record<string, any> = {};

function getCentroid(ring: number[][]) {
  let x = 0,
    y = 0;
  for (const p of ring) {
    x += p[0];
    y += p[1];
  }
  return [x / ring.length, y / ring.length];
}

/* ------------------------------------------------------------------ */
/* MapContainer Component                                              */
/* ------------------------------------------------------------------ */
export default function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const activeLayers = useStore((s) => s.activeLayers);
  const setSelectedWardId = useStore((s) => s.setSelectedWardId);
  const [mapLoaded, setMapLoaded] = useState(false);

  /* ---------------------------------------------------------------- */
  /* One-time map initialization                                       */
  /* ---------------------------------------------------------------- */
  const initMap = useCallback(async () => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [77.5946, 12.9716],
      zoom: 11,
      pitch: 40,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'bottom-right');

    map.current.on('load', async () => {
      try {
        /* -------- fetch ward geojson -------- */
        const res = await fetch('/api/geojson');
        const geojson = await res.json();

        // build lookup for centroid calculation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        geojson.features.forEach((f: any) => {
          wardsLookup[f.properties.name] = f;
        });

        /* -------- enrich ward features with score data -------- */
        const enriched = {
          ...geojson,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          features: geojson.features.map((f: any) => {
            const s = wardScores.find((w) => w.name === f.properties.name);
            return {
              ...f,
              properties: {
                ...f.properties,
                score: s?.score ?? 50,
                dumpRisk: s?.dumpRisk ?? 0.5,
              },
            };
          }),
        };

        /* ====================================================== */
        /* SOURCES                                                  */
        /* ====================================================== */
        map.current!.addSource('wards-source', { type: 'geojson', data: enriched });

        map.current!.addSource('dumps-source', {
          type: 'geojson',
          data: buildDumpGeoJSON() as GeoJSON.FeatureCollection,
        });

        map.current!.addSource('methane-source', {
          type: 'geojson',
          data: buildHeatGeoJSON('methaneIntensity') as GeoJSON.FeatureCollection,
        });

        map.current!.addSource('waste-source', {
          type: 'geojson',
          data: buildHeatGeoJSON('wasteTons') as GeoJSON.FeatureCollection,
        });

        map.current!.addSource('dumpprob-source', {
          type: 'geojson',
          data: buildHeatGeoJSON('dumpRisk') as GeoJSON.FeatureCollection,
        });

        // Optimized routes: create a synthetic set of route lines between high-risk wards
        map.current!.addSource('routes-source', {
          type: 'geojson',
          data: buildRouteGeoJSON(),
        });

        /* ====================================================== */
        /* LAYERS                                                   */
        /* ====================================================== */

        /* 1 — Ward Vulnerability fill */
        map.current!.addLayer({
          id: 'wardVulnerability',
          type: 'fill',
          source: 'wards-source',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'score'],
              0,  '#ef4444',   // red = low score
              30, '#f97316',
              50, '#f59e0b',
              70, '#84cc16',
              100,'#10b981',   // green = high score
            ],
            'fill-opacity': 0.3,
          },
          layout: { visibility: 'visible' },
        });

        /* 2 — Ward border lines */
        map.current!.addLayer({
          id: 'ward-lines',
          type: 'line',
          source: 'wards-source',
          paint: {
            'line-color': '#ffffff',
            'line-opacity': 0.12,
            'line-width': 1.5,
          },
        });

        /* 3 — Dump sites circles */
        map.current!.addLayer({
          id: 'dumps',
          type: 'circle',
          source: 'dumps-source',
          paint: {
            'circle-radius': 8,
            'circle-color': [
              'match',
              ['get', 'risk'],
              'high',   '#ef4444',
              'medium', '#f59e0b',
              'low',    '#10b981',
              '#ffffff',
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#0a0f1e',
            'circle-opacity': 0.9,
          },
          layout: { visibility: 'visible' },
        });

        /* 4 — Methane heatmap */
        map.current!.addLayer({
          id: 'methane',
          type: 'heatmap',
          source: 'methane-source',
          paint: {
            'heatmap-weight': ['get', 'weight'],
            'heatmap-intensity': 1.4,
            'heatmap-radius': 60,
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0,   'rgba(0,0,0,0)',
              0.2, '#7f1d1d',
              0.4, '#b91c1c',
              0.6, '#ef4444',
              0.8, '#f87171',
              1,   '#fca5a5',
            ],
            'heatmap-opacity': 0.7,
          },
          layout: { visibility: 'none' },
        });

        /* 5 — Waste generation heatmap */
        map.current!.addLayer({
          id: 'waste',
          type: 'heatmap',
          source: 'waste-source',
          paint: {
            'heatmap-weight': ['get', 'weight'],
            'heatmap-intensity': 1.2,
            'heatmap-radius': 55,
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0,   'rgba(0,0,0,0)',
              0.2, '#713f12',
              0.4, '#a16207',
              0.6, '#eab308',
              0.8, '#facc15',
              1,   '#fef08a',
            ],
            'heatmap-opacity': 0.65,
          },
          layout: { visibility: 'none' },
        });

        /* 6 — Dumping probability heatmap */
        map.current!.addLayer({
          id: 'dumpProbability',
          type: 'heatmap',
          source: 'dumpprob-source',
          paint: {
            'heatmap-weight': ['get', 'weight'],
            'heatmap-intensity': 1.3,
            'heatmap-radius': 50,
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0,   'rgba(0,0,0,0)',
              0.2, '#1e3a5f',
              0.4, '#1d4ed8',
              0.6, '#3b82f6',
              0.8, '#60a5fa',
              1,   '#93c5fd',
            ],
            'heatmap-opacity': 0.65,
          },
          layout: { visibility: 'none' },
        });

        /* 7 — Optimized truck routes */
        map.current!.addLayer({
          id: 'routes',
          type: 'line',
          source: 'routes-source',
          paint: {
            'line-color': '#10b981',
            'line-width': 3,
            'line-opacity': 0.8,
            'line-dasharray': [2, 1.5],
          },
          layout: { visibility: 'none' },
        });

        /* ====================================================== */
        /* INTERACTIONS                                             */
        /* ====================================================== */

        // Popup for dump sites
        map.current!.on('click', 'dumps', (e) => {
          if (!e.features?.length) return;
          const p = e.features[0].properties!;
          new mapboxgl.Popup({ closeButton: true, className: 'dark-popup' })
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:Inter,sans-serif;color:#fff;padding:4px 0">
                <strong style="font-size:13px">🗑️ ${p.ward}</strong>
                <div style="margin-top:4px;font-size:12px;color:#9ca3af">
                  Risk: <span style="color:${p.risk === 'high' ? '#ef4444' : p.risk === 'medium' ? '#f59e0b' : '#10b981'};font-weight:600;text-transform:uppercase">${p.risk}</span>
                </div>
                <div style="font-size:12px;color:#9ca3af">Area: ${p.area_sqm} m²</div>
                <div style="font-size:12px;color:#9ca3af">Detected: ${p.detected}</div>
              </div>`
            )
            .addTo(map.current!);
        });

        // Ward click → sidebar
        map.current!.on('click', 'wardVulnerability', (e) => {
          if (e.features?.length) {
            const wardId = e.features[0].properties?.id;
            if (wardId) setSelectedWardId(wardId);
          }
        });

        map.current!.on('mouseenter', 'wardVulnerability', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current!.on('mouseleave', 'wardVulnerability', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
        map.current!.on('mouseenter', 'dumps', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current!.on('mouseleave', 'dumps', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });

        setMapLoaded(true);
      } catch (err) {
        console.error('Failed to load map data', err);
      }
    });
  }, [setSelectedWardId]);

  useEffect(() => {
    initMap();
    return () => {
      map.current?.remove();
      map.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------- */
  /* Sync layer visibility with store                                  */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const managedLayers = ['dumps', 'methane', 'waste', 'dumpProbability', 'routes', 'wardVulnerability'];

    Object.entries(activeLayers).forEach(([layerId, isVisible]) => {
      if (managedLayers.includes(layerId) && map.current?.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
      }
    });
  }, [activeLayers, mapLoaded]);

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div id="map-page" className="relative w-screen" style={{ height: '100vh' }}>
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Subtle gradient overlays for premium feel */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0a0f1ecc] to-transparent z-[1]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0f1ecc] to-transparent z-[1]" />

      {/* Floating UI */}
      <LayerToggle />
      <WardSidebar />

      {/* Map attribution override dark popup styles */}
      <style jsx global>{`
        .mapboxgl-popup-content {
          background: rgba(18, 24, 43, 0.95) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
        }
        .mapboxgl-popup-close-button {
          color: rgba(255,255,255,0.5) !important;
          font-size: 18px !important;
        }
        .mapboxgl-popup-close-button:hover {
          color: #fff !important;
          background: transparent !important;
        }
        .mapboxgl-popup-tip {
          border-top-color: rgba(18, 24, 43, 0.95) !important;
          border-bottom-color: rgba(18, 24, 43, 0.95) !important;
        }
        .mapboxgl-ctrl-group {
          background: rgba(18, 24, 43, 0.8) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .mapboxgl-ctrl-group button {
          border-color: rgba(255,255,255,0.08) !important;
        }
        .mapboxgl-ctrl-group button span {
          filter: invert(1) !important;
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* helper: build synthetic truck routes between high-risk ward centers */
/* ------------------------------------------------------------------ */
function buildRouteGeoJSON(): GeoJSON.FeatureCollection {
  // Sort wards by risk (low score = high risk) and create routes between them
  const highRisk = [...wardScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 8);

  const coordinates: number[][][] = [];

  for (let i = 0; i < highRisk.length - 1; i++) {
    const wardA = wardsLookup[highRisk[i].name];
    const wardB = wardsLookup[highRisk[i + 1].name];
    if (wardA && wardB) {
      const cA = getCentroid(wardA.geometry.coordinates[0]);
      const cB = getCentroid(wardB.geometry.coordinates[0]);
      coordinates.push([cA, cB]);
    }
  }

  return {
    type: 'FeatureCollection',
    features: coordinates.map((coords, i) => ({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: { id: i },
    })),
  };
}
