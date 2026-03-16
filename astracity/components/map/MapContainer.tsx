'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useStore } from '@/lib/store';
import LayerToggle from './LayerToggle';
import WardSidebar from './WardSidebar';

import dumpSites from '@/data/dump_sites.json';
import wardScores from '@/data/ward_scores.json';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYmFyYmFyYSIsImEiOiJjamthejd6NWcxM2N1M3FwYm04OWR0bjUzIn0.06rXYyTj7O4fD-k_Qj6QCA';

export default function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const activeLayers = useStore((state) => state.activeLayers);
  const setSelectedWardId = useStore((state) => state.setSelectedWardId);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [77.5946, 12.9716],
      zoom: 11,
      pitch: 45,
    });

    map.current.on('load', async () => {
      setMapLoaded(true);
      
      try {
          const res = await fetch('/api/geojson');
          const geojson = await res.json();
          
          const enrichedGeojson = {
              ...geojson,
              // @ts-expect-error - geojson properties access
              features: geojson.features.map((f) => {
                  const scoreData = wardScores.find(w => w.name === f.properties.name);
                  return {
                      ...f,
                      properties: {
                          ...f.properties,
                          score: scoreData ? scoreData.score : 50,
                          dumpRisk: scoreData ? scoreData.dumpRisk : 0.5
                      }
                  };
              })
          };

          map.current?.addSource('wards-source', {
              type: 'geojson',
              data: enrichedGeojson
          });

          // Vulnerability Fill Layer
          map.current?.addLayer({
              id: 'wardVulnerability',
              type: 'fill',
              source: 'wards-source',
              paint: {
                  'fill-color': [
                      'interpolate',
                      ['linear'],
                      ['get', 'score'],
                      0, '#ef4444',
                      50, '#f59e0b',
                      100, '#10b981'
                  ],
                  'fill-opacity': 0.35,
                  'fill-outline-color': '#ffffff'
              }
          }, 'waterway-label');

          // Ward Border Lines Layer
          map.current?.addLayer({
              id: 'ward-lines',
              type: 'line',
              source: 'wards-source',
              paint: {
                  'line-color': '#ffffff',
                  'line-opacity': 0.15,
                  'line-width': 1.5
              }
          });

          // Dump Sites Cirlce Layer
          const dumpGeoJSON = {
              type: 'FeatureCollection',
              features: dumpSites.map(site => ({
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: [site.lon, site.lat] },
                  properties: site
              }))
          };

          map.current?.addSource('dumps-source', {
              type: 'geojson',
              data: dumpGeoJSON
          });

          map.current?.addLayer({
              id: 'dumps',
              type: 'circle',
              source: 'dumps-source',
              paint: {
                  'circle-radius': 8,
                  'circle-color': [
                      'match',
                      ['get', 'risk'],
                      'high', '#ef4444', // Red 
                      'medium', '#f59e0b', // Amber
                      'low', '#10b981', // Green
                      '#ffffff'
                  ],
                  'circle-stroke-width': 1.5,
                  'circle-stroke-color': '#111827'
              }
          });

          map.current?.on('click', 'wardVulnerability', (e) => {
              if (e.features && e.features.length > 0) {
                  const wardId = e.features[0].properties?.id;
                  if (wardId) {
                      setSelectedWardId(wardId);
                  }
              }
          });

          map.current?.on('mouseenter', 'wardVulnerability', () => {
              if (map.current) map.current.getCanvas().style.cursor = 'pointer';
          });

          map.current?.on('mouseleave', 'wardVulnerability', () => {
              if (map.current) map.current.getCanvas().style.cursor = '';
          });

      } catch (err) {
          console.error("Failed to load map data", err);
      }
    });

  }, [setSelectedWardId]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Check supported visible layers created matching the 6 toggle buttons
    const definedLayers = ['dumps', 'wardVulnerability'];

    Object.entries(activeLayers).forEach(([layerId, isVisible]) => {
      if (definedLayers.includes(layerId) && map.current?.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
      }
    });
  }, [activeLayers, mapLoaded]);

  return (
    <div className="relative w-full h-[calc(100vh-73px)] overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      <LayerToggle />
      <WardSidebar />
    </div>
  );
}
