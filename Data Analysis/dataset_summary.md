# Bengaluru Geospatial Datasets Analysis

This document provides a detailed overview of the two primary structural GIS datasets for the AstraCity/Spacetech project: the **BBMP Boundary** and the **Bengaluru Road Network**.

---

## 1. BBMP Boundary Dataset

**Path:** `Bengaluru_BBMP_Boundary/Bengaluru_BBMP_Boundary/`
**Files:** `BBMP_Boundary.shp / .dbf / .shx / .prj / .cpg`

### 1.1 Overview & Geography
*   **Format:** ESRI Shapefile
*   **Geometry:** PolygonZ (3D Polygon, though Z-values are 0)
*   **Coordinate System:** WGS 1984 / EPSG:4326 (Geographic, Lat/Lon)
*   **Features:** 1 Polygon (the complete outer boundary of the BBMP area)
*   **Vertices:** 2,475 points outlining the city limits
*   **Bounding Box Extent:** 
    *   Longitude: $77.460^\circ$ E to $77.784^\circ$ E (~35 km width)
    *   Latitude: $12.834^\circ$ N to $13.144^\circ$ N (~34 km height)
*   **Area:** ~715 sq. km. (matches Bengaluru's official administrative area)

### 1.2 Attribute Information
The associated `.dbf` file contains 1 record with 12 fields. The most important field is `PopupInfo`, which contains rich HTML metadata outlining the administrative hierarchy:
*   **Ward Name:** Kempegowda Ward (used as a representative record for the whole export)
*   **Zone:** Yelahanka
*   **Division / Subdivision:** Yelahanka
*   **Assembly (MLA) Constituency:** Yelahanka
*   **Parliament (MP) Constituency:** Chikballapur

*(Note: The dataset contains only 1 record representing the overall BBMP limit, inherited from a KML export that tagged it with one specific ward's details rather than all 198 individual wards).*

---

## 2. Bengaluru Road Network (Rural & Urban)

**Path:** `Road_Network/Bengaluru Road Network/`
**Files:** `Bengaluru Road Network R&U.shp / .dbf / .shx / .prj / .cpg`

### 2.1 Overview & Geography
*   **Format:** ESRI Shapefile
*   **Geometry:** Polyline (2D line segments)
*   **Coordinate System:** WGS 1984 / EPSG:4326
*   **Features:** 268,001 individual road and path segments
*   **Source:** OpenStreetMap (OSM)
*   **Bounding Box Extent:**
    *   Longitude: $77.184^\circ$ E to $77.964^\circ$ E (~85 km width)
    *   Latitude: $12.660^\circ$ N to $13.499^\circ$ N (~93 km height)
*   **Coverage Range:** Covers the entire BBMP jurisdiction plus extensive surrounding rural areas (~7,900 sq. km. total bounding area).

### 2.2 Attribute Information
The `.dbf` contains 4 main text attributes for every segment:
1.  **`full_id`**: The full OSM identifier (e.g., `w4354938`)
2.  **`osm_id`**: The numeric OSM object ID
3.  **`osm_type`**: The OSM data type (100% are `way`)
4.  **`highway`**: The road classification. This is the **most analytical field**.

### 2.3 Highway Classification Breakdown
Out of 268,001 segments, there are 29 distinct road classifications. Key highlights:

*   **Tier 1 & 2 (Highways / Arterial): ~3.8%**
    *   `motorway` & `trunk` (Expressways & State Highways): 2,786 segments
    *   `primary` & `secondary` (Major City Roads): 7,453 segments
*   **Tier 3 (Local / Residential): ~71%**
    *   `tertiary` (Neighbourhood mains): 8,563 segments
    *   `residential` (Internal housing streets): **178,608 segments** (66.6% of all data)
*   **Tier 4 (Non-Motorised / Footways): ~6.2%**
    *   `footway`, `path`, `steps`, `pedestrian`: 16,719 segments
*   **Tier 5 (Service tracks & Others): ~19%**
    *   `service` (Driveways, parking aisles): 39,778 segments
    *   `track` (Unpaved rural roads): 5,780 segments
    *   `construction`: 2,726 segments

---

## 3. Dataset Integration & Usage in Spacetech

Both datasets natively share the **WGS 1984 (EPSG:4326)** coordinate system, making them perfectly compatible for overlay mapping and spatial joins without reprojection.

### Planned GIS Workflows:
1.  **Spatial Clipping:** Use the BBMP Boundary (Polygon) to clip the massive Road Network (Polyline) to evaluate purely "urban" roads vs. the wider rural dataset.
2.  **Network Analysis:** Filter the road network by `highway` type to build routing graphs (e.g., ignoring `construction`, `footway`, and `track` when routing vehicles).
3.  **Visual Overlays:** Render the BBMP boundary prominently on the dashboard map to orient users, while layering the road network underneath it to show infrastructure density.
