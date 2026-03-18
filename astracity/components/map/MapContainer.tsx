'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '@/lib/store';
import LayerToggle from './LayerToggle';
import WardSidebar from './WardSidebar';

import dumpSites from '@/data/dump_sites.json';
import wardScores from '@/data/ward_scores.json';

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
  let x = 0, y = 0;
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
  const map = useRef<maplibregl.Map | null>(null);
  const activeLayers = useStore((s) => s.activeLayers);
  const setSelectedWardId = useStore((s) => s.setSelectedWardId);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [77.5946, 12.9716],
      zoom: 11,
      pitch: 40,
      antialias: true,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

    map.current.on('load', async () => {
      map.current?.resize(); // <--- Forces MapLibre to read the actual screen dimensions

      try {
        const res = await fetch('/api/geojson');
        const geojson = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        geojson.features.forEach((f: any) => {
          wardsLookup[f.properties.name] = f;
        });

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

        map.current!.addSource('wards-source', { type: 'geojson', data: enriched });
        map.current!.addSource('dumps-source', { type: 'geojson', data: buildDumpGeoJSON() as GeoJSON.FeatureCollection });
        map.current!.addSource('methane-source', { type: 'geojson', data: buildHeatGeoJSON('methaneIntensity') as GeoJSON.FeatureCollection });
        map.current!.addSource('waste-source', { type: 'geojson', data: buildHeatGeoJSON('wasteTons') as GeoJSON.FeatureCollection });
        map.current!.addSource('dumpprob-source', { type: 'geojson', data: buildHeatGeoJSON('dumpRisk') as GeoJSON.FeatureCollection });
        map.current!.addSource('routes-source', { type: 'geojson', data: buildRouteGeoJSON() });

        map.current!.addLayer({
          id: 'wardVulnerability',
          type: 'fill',
          source: 'wards-source',
          paint: {
            'fill-color': [
              'interpolate', ['linear'], ['get', 'score'],
              0,  '#ef4444',
              30, '#f97316',
              50, '#f59e0b',
              70, '#84cc16',
              100,'#10b981',
            ],
            'fill-opacity': 0.3,
          },
          layout: { visibility: 'visible' },
        });

        map.current!.addLayer({
          id: 'ward-lines',
          type: 'line',
          source: 'wards-source',
          paint: {
            'line-color': '#475569',
            'line-opacity': 0.15,
            'line-width': 1.5,
          },
        });

        map.current!.addLayer({
          id: 'dumps',
          type: 'circle',
          source: 'dumps-source',
          paint: {
            'circle-radius': 8,
            'circle-color': [
              'match', ['get', 'risk'],
              'high',   '#ef4444',
              'medium', '#f59e0b',
              'low',    '#10b981',
              '#ffffff',
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9,
          },
          layout: { visibility: 'visible' },
        });

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
              0,   'rgba(255,255,255,0)',
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
              0,   'rgba(255,255,255,0)',
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
              0,   'rgba(255,255,255,0)',
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

        map.current!.on('click', 'dumps', (e) => {
          if (!e.features?.length) return;
          const p = e.features[0].properties!;
          new maplibregl.Popup({ closeButton: true })
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:Inter,sans-serif;color:#0f172a;padding:4px 0">
                <strong style="font-size:13px">🗑️ ${p.ward}</strong>
                <div style="margin-top:4px;font-size:12px;color:#64748b">
                  Risk: <span style="color:${p.risk === 'high' ? '#ef4444' : p.risk === 'medium' ? '#f59e0b' : '#10b981'};font-weight:600;text-transform:uppercase">${p.risk}</span>
                </div>
                <div style="font-size:12px;color:#64748b">Area: ${p.area_sqm} m²</div>
                <div style="font-size:12px;color:#64748b">Detected: ${p.detected}</div>
              </div>`
            )
            .addTo(map.current!);
        });

        map.current!.on('click', 'wardVulnerability', (e) => {
          if (e.features?.length) {
            const wardId = e.features[0].properties?.id;
            if (wardId) setSelectedWardId(wardId);
          }
        });

        map.current!.on('mouseenter', 'wardVulnerability', () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; });
        map.current!.on('mouseleave', 'wardVulnerability', () => { if (map.current) map.current.getCanvas().style.cursor = ''; });
        map.current!.on('mouseenter', 'dumps', () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; });
        map.current!.on('mouseleave', 'dumps', () => { if (map.current) map.current.getCanvas().style.cursor = ''; });

        setMapLoaded(true);
      } catch (err) {
        console.error('Failed to load map data', err);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const managedLayers = ['dumps', 'methane', 'waste', 'dumpProbability', 'routes', 'wardVulnerability'];
    Object.entries(activeLayers).forEach(([layerId, isVisible]) => {
      if (managedLayers.includes(layerId) && map.current?.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
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

function buildRouteGeoJSON(): GeoJSON.FeatureCollection {
  const highRisk = [...wardScores].sort((a, b) => a.score - b.score).slice(0, 8);
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
