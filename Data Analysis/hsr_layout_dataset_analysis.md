# 🗺️ HSR Layout Dataset Analysis Report

> **Location:** `c:\Users\Kishan Shetty\Downloads\Spacetech\HSR_Layput\HSR Layout`  
> **Date Analysed:** 21 March 2026  
> **Area of Interest:** HSR Layout, Bengaluru, Karnataka, India

---

## 📁 Dataset Overview

The workspace contains **3 sub-datasets**, all geospatially focused on the **HSR Layout** neighbourhood of Bengaluru:

| # | Dataset | Format | Type |
|---|---------|--------|------|
| 1 | HSR Layout Ward Boundary | Shapefile (SHP/DBF/PRJ/SHX/CPG) | Vector – Polygon |
| 2 | HSR Layout Road Network | Shapefile (SHP/DBF/PRJ/SHX/CPG) | Vector – Polyline |
| 3 | Satellite Data | GeoTIFF (.tif) | Raster – Imagery |

All vector datasets use **WGS 84 (EPSG:4326)** as the Coordinate Reference System (geographic coordinates: Longitude/Latitude in decimal degrees).

---

## 1. 🏙️ HSR Layout Ward Boundary

### Purpose
Defines the **administrative boundary** of the HSR Layout ward as a single polygon feature. This is used to delimit the geographic extent of the study area.

### Geometry
| Property | Value |
|----------|-------|
| Shape Type | **PolygonZ** (3D Polygon with Z elevation) |
| Total Features | **1** (single ward polygon) |
| File Size (SHP) | ~7.9 KB |

### Spatial Extent (WGS 84)
| Axis | Min | Max | Span |
|------|-----|-----|------|
| Longitude (X) | 77.622725° E | 77.669342° E | ~0.0466° |
| Latitude (Y) | 12.897941° N | 12.931016° N | ~0.0331° |

> **Approximate real-world coverage: ~3.67 km (N-S) × ~5.04 km (E-W)**

### Attribute Fields (12 columns)
| Field | Type | Description |
|-------|------|-------------|
| `OID_` | Numeric | Object ID / unique record identifier |
| `Name` | Text (254) | Ward name (e.g., "Ward 174") |
| `FolderPath` | Text (254) | Source folder label (e.g., "BBMP Wards") |
| `SymbolID` | Numeric | Symbology identifier |
| `AltMode` | Numeric | Altitude mode (KML-style flag) |
| `Base` | Numeric | Base elevation value |
| `Clamped` | Numeric | KML clamped-to-ground flag |
| `Extruded` | Numeric | KML extrusion flag |
| `Snippet` | Text (254) | Short descriptive snippet |
| `PopupInfo` | Text (254) | HTML popup content (e.g., "Ward Name: HSR Layout, Constituency: Bangalore South") |
| `Shape_Leng` | Numeric | Perimeter/length of the polygon |
| `Shape_Area` | Numeric | Area of the polygon |

### Sample Record
```
OID_       : 0
Name       : Ward 174
FolderPath : BBMP Wards
SymbolID   : 21
AltMode    : 0
Clamped    : -1
Extruded   : 0
PopupInfo  : Ward Name: HSR Layout, Constituency: Bangalore South
```

> [!NOTE]
> This dataset appears to have been **exported from Google Earth / KML format** (evidenced by the `AltMode`, `Clamped`, `Extruded`, `Snippet`, and `PopupInfo` fields — all standard KML attributes). The ward corresponds to **BBMP Ward 174**, falling under the **Bangalore South** assembly constituency.

---

## 2. 🛣️ HSR Layout Road Network

### Purpose
Captures the **complete road and path network** within HSR Layout, sourced from **OpenStreetMap (OSM)**. Each segment (road, footpath, lane, etc.) is a separate feature.

### Geometry
| Property | Value |
|----------|-------|
| Shape Type | **Polyline** (2D line segments) |
| Total Features | **2,027 road/path segments** |
| File Size (SHP) | ~253 KB |

### Spatial Extent (WGS 84)
| Axis | Min | Max |
|------|-----|-----|
| Longitude (X) | 77.622741° E | 77.669342° E |
| Latitude (Y) | 12.897952° N | 12.931016° N |

> The road network bbox closely matches the ward boundary — **confirming it was clipped to the ward extent**.

### Attribute Fields (4 columns)
| Field | Type | Description |
|-------|------|-------------|
| `full_id` | Text (254) | Full OSM element ID (e.g., `w24240670`) |
| `osm_id` | Text (254) | Numeric OpenStreetMap Way ID |
| `osm_type` | Text (254) | OSM element type (always `way` for roads) |
| `highway` | Text (254) | OSM highway classification tag |

### 🚦 Road Type Distribution (2,027 segments)

| Road Type | Count | % of Total | Description |
|-----------|-------|-----------|-------------|
| `residential` | 840 | **41.4%** | Standard residential streets |
| `footway` | 509 | **25.1%** | Dedicated pedestrian footpaths |
| `tertiary` | 191 | **9.4%** | Minor collector roads |
| `service` | 179 | **8.8%** | Service lanes, parking aisles |
| `secondary` | 113 | **5.6%** | Secondary arterial roads |
| `path` | 51 | **2.5%** | Informal paths/trails |
| `trunk` | 38 | **1.9%** | Major urban arterials (e.g., Outer Ring Road) |
| `track` | 23 | **1.1%** | Unpaved rural/agricultural tracks |
| `steps` | 20 | **1.0%** | Stairways |
| `construction` | 18 | **0.9%** | Roads under construction |
| `trunk_link` | 11 | **0.5%** | On/off ramps to trunk roads |
| `primary` | 10 | **0.5%** | Primary arterial roads |
| `living_street` | 7 | **0.3%** | Pedestrian-priority shared streets |
| `unclassified` | 4 | **0.2%** | Minor roads without classification |
| `cycleway` | 4 | **0.2%** | Dedicated cycle tracks |
| `motorway` | 3 | **0.1%** | Expressway segments |
| `secondary_link` | 2 | **0.1%** | Secondary road ramps |
| `proposed` | 2 | **0.1%** | Planned/proposed roads |
| `tertiary_link` | 1 | **0.0%** | Tertiary road junction links |
| `primary_link` | 1 | **0.0%** | Primary road ramps |

> [!TIP]
> **Residential roads (41.4%) + Footways (25.1%) = 66.5%** of all segments — reflecting HSR Layout's character as a dense residential neighbourhood with significant pedestrian infrastructure.

### Sample Records
```
Record 1: full_id=w24240670, osm_id=24240670, osm_type=way, highway=unclassified
Record 2: full_id=w24307306, osm_id=24307306, osm_type=way, highway=residential
Record 3: full_id=w24307938, osm_id=24307938, osm_type=way, highway=residential
```

---

## 3. 🛰️ Satellite Data

Two GeoTIFF raster files providing satellite/aerial imagery of the study area.

### Files

| File | Size | Coverage |
|------|------|----------|
| `HSR_Layout_SD.tif` | **4.25 MB** | HSR Layout neighbourhood only |
| `BBMP_BOUNDARY_SD.tif` | **275.9 MB** | Entire BBMP (Greater Bengaluru) boundary |

### HSR_Layout_SD.tif – Detailed Metadata
| Property | Value |
|----------|-------|
| Dimensions | **1002 × 740 pixels** |
| Bands | **3** (RGB colour image) |
| Photometric Interpretation | BlackIsZero / Grayscale → RGB |
| Compression | None (uncompressed) |
| Format | GeoTIFF (georeferenced raster) |
| File Size | 4.25 MB |

### BBMP_BOUNDARY_SD.tif – Overview
| Property | Value |
|----------|-------|
| File Size | **275.9 MB** (much larger – city-wide extent) |
| Coverage | Full BBMP (Bruhat Bengaluru Mahanagara Palike) boundary |
| Format | GeoTIFF |

> [!NOTE]
> The large `BBMP_BOUNDARY_SD.tif` (275.9 MB) covers the entire BBMP jurisdiction (≈ 741 km²), while `HSR_Layout_SD.tif` (4.25 MB) is a clipped subset for just the ~18.5 km² HSR Layout ward. These provide the **visual basemap context** for any GIS or remote sensing analysis.

---

## 📊 Summary Statistics

| Dataset | Features/Size | Geometry | CRS | Source |
|---------|--------------|----------|-----|--------|
| Ward Boundary | 1 polygon | PolygonZ | WGS 84 | BBMP / KML export |
| Road Network | 2,027 segments | Polyline | WGS 84 | OpenStreetMap |
| HSR Satellite | 1002×740 px, 3 bands | Raster | GeoTIFF | Satellite imagery |
| BBMP Satellite | City-wide, 275.9 MB | Raster | GeoTIFF | Satellite imagery |

---

## 🔎 Key Insights

1. **Study Area**: HSR Layout (Ward 174), Bengaluru, under BBMP jurisdiction, Bangalore South constituency.
2. **Geographic Extent**: Approximately **3.7 km × 5.0 km** (~18.5 km²).
3. **Road Network Density**: 2,027 road/path segments — averaging **~110 segments/km²**, indicating a very dense urban road network.
4. **Pedestrian Infrastructure**: 25.1% of features are footways/paths/steps — notable for urban planning and accessibility studies.
5. **Multi-scale Imagery**: Both a detailed ward-level and city-wide satellite image are available, enabling **multi-scale spatial analysis**.
6. **Data Sources**: OpenStreetMap (roads), BBMP administrative data (ward boundary), and commercial/open satellite imagery — all standard sources for urban GIS projects.

---

## 🎯 Potential Use Cases

- **Urban Route Planning** – Road network analysis, shortest path, connectivity
- **Land Use / Land Cover Mapping** – Using satellite imagery
- **Infrastructure Assessment** – Road type distribution, pedestrian access
- **SmartCity / Spacetech Applications** – Geospatial intelligence, drone path planning
- **Change Detection** – Comparing BBMP-wide imagery with ward-level data

