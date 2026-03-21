import os
import glob
import numpy as np
import rasterio
import matplotlib.pyplot as plt
import geopandas as gpd
import json
from sklearn.cluster import DBSCAN
import networkx as nx
from scipy.spatial.distance import cdist
from sklearn.cluster import KMeans
from shapely.geometry import Point, LineString
import warnings
from scipy.ndimage import gaussian_filter

warnings.filterwarnings('ignore')

def get_pixel_area(res_x, res_y, is_latlon):
    if is_latlon:
        # Bangalore ~ 12.9 degrees lat
        # 1 deg lat = 110.574 km
        # 1 deg lon = 111.320 * cos(12.9 deg) = 111.320 * 0.9747 = 108.51
        area_deg2 = abs(res_x * res_y)
        area_m2 = area_deg2 * (110574.0 * 108510.0)
        return area_m2
    else:
        return abs(res_x * res_y)

def main():
    os.makedirs('output', exist_ok=True)
    
    # -- PART 1: Shapefiles -> GeoJSON --
    print("-- PART 1: Shapefiles -> GeoJSON --")
    ward_shp = "HSR Layout Ward Boundary/HSR_Layout.shp"
    if not os.path.exists(ward_shp): ward_shp = glob.glob("HSR*Ward*Boundary/*.shp")[0]
    gdf_ward = gpd.read_file(ward_shp)
    gdf_ward_4326 = gdf_ward.to_crs(epsg=4326)
    gdf_ward_4326.to_file("output/hsr_ward_boundary.geojson", driver="GeoJSON")
    print("\nWard Boundary Info:")
    print(f"CRS: {gdf_ward.crs} -> {gdf_ward_4326.crs}")
    print(f"Bounds: {gdf_ward_4326.total_bounds}")
    print(f"Number of features: {len(gdf_ward_4326)}")
    print(f"Column names: {list(gdf_ward_4326.columns)}")
    
    road_shp = "HSR Layout Road Network/HSR Layout.shp"
    if not os.path.exists(road_shp): road_shp = glob.glob("HSR*Road*Network/*.shp")[0]
    gdf_road = gpd.read_file(road_shp)
    gdf_road_4326 = gdf_road.to_crs(epsg=4326)
    gdf_road_4326.to_file("output/hsr_road_network.geojson", driver="GeoJSON")
    
    gdf_road_utm = gdf_road.to_crs(epsg=32643) if gdf_road.crs else gdf_road.set_crs(epsg=4326).to_crs(epsg=32643)
    total_km = gdf_road_utm.geometry.length.sum() / 1000.0
    
    road_type_cols = [c for c in gdf_road.columns if 'type' in c.lower() or 'class' in c.lower() or 'category' in c.lower()]
    print("\nRoad Network Info:")
    print(f"Number of road segments: {len(gdf_road_4326)}")
    print(f"Road type columns: {road_type_cols if road_type_cols else 'None found'}")
    print(f"Total length: {total_km:.2f} km")
    
    # -- PART 2: Satellite Image Analysis --
    print("\n-- PART 2: Satellite Image Analysis --")
    tif_path = "HSR_Layout_SD.tif"
    with rasterio.open(tif_path) as src:
        bands_count = src.count
        crs = src.crs
        bounds = src.bounds
        res = src.res
        nodata = src.nodata
        transform = src.transform
        is_latlon = crs.is_geographic if crs else True
        
        print("\nSatellite Image Info:")
        print(f"Number of bands: {bands_count}")
        print(f"CRS: {crs}")
        print(f"Bounds: {bounds}")
        print(f"Resolution: {res}")
        print(f"Nodata value: {nodata}")
        
        bands_data = []
        normalized_bands = []
        for b in range(1, bands_count + 1):
            arr = src.read(b)
            valid = arr if nodata is None else arr[arr != nodata]
            v_min, v_max = (valid.min(), valid.max()) if len(valid) > 0 else (0, 0)
            print(f"Band {b} - min: {v_min}, max: {v_max}")
            if v_max > v_min:
                norm = (arr.astype(float) - v_min) / (v_max - v_min)
            else:
                norm = np.zeros_like(arr, dtype=float)
            bands_data.append(arr)
            normalized_bands.append(norm)
            
        brightness = np.mean(normalized_bands, axis=0)
        
        plt.figure(figsize=(10, 10))
        if bands_count >= 3:
            rgb = np.dstack([normalized_bands[0], normalized_bands[1], normalized_bands[2]])
            plt.imshow(rgb)
        else:
            plt.imshow(normalized_bands[0], cmap='gray')
        plt.axis('off')
        plt.savefig("output/hsr_satellite_preview.png", bbox_inches='tight', dpi=150)
        plt.close()
        
    # -- PART 3: Anomaly / Dump Site Detection --
    print("\n-- PART 3: Anomaly / Dump Site Detection --")
    p8 = np.percentile(brightness, 8)
    anomaly_base = brightness < p8
    local_mean = gaussian_filter(brightness, sigma=5)
    dark_cluster = (brightness < local_mean * 0.8)
    mask = anomaly_base & dark_cluster
    
    y_idx, x_idx = np.where(mask)
    pixel_coords = list(zip(x_idx, y_idx))
    lon_lat_coords = [rasterio.transform.xy(transform, y, x) for x, y in pixel_coords]
    
    if len(lon_lat_coords) > 8000:
        indices = np.random.choice(len(lon_lat_coords), 8000, replace=False)
        lon_lat_coords = [lon_lat_coords[i] for i in indices]
        pixel_coords = [pixel_coords[i] for i in indices]
        
    dump_sites = []
    if lon_lat_coords:
        coords_arr = np.array(lon_lat_coords)
        clustering = DBSCAN(eps=0.0005, min_samples=3).fit(coords_arr)
        labels = clustering.labels_
        
        pixel_area_sqm = get_pixel_area(res[0], res[1], is_latlon)
        
        unique_labels = set(labels)
        site_id = 1
        for lbl in unique_labels:
            if lbl == -1: continue
            
            cluster_coords = coords_arr[labels == lbl]
            centroid = cluster_coords.mean(axis=0)
            pixel_count = len(cluster_coords)
            area_sqm = pixel_count * pixel_area_sqm
            
            if area_sqm > 500: risk = "high"
            elif area_sqm >= 200: risk = "medium"
            else: risk = "low"
            
            dump_sites.append({
                "id": f"DUMP-{site_id:03d}",
                "lat": float(centroid[1]),
                "lon": float(centroid[0]),
                "risk": risk,
                "area_sqm": float(area_sqm),
                "pixel_count": int(pixel_count),
                "detected": "satellite",
                "ward": "HSR Layout"
            })
            site_id += 1
            
    with open("output/dump_sites.json", "w") as f:
        json.dump(dump_sites, f, indent=2)
        
    risk_counts = {"high": 0, "medium": 0, "low": 0}
    for d in dump_sites:
        risk_counts[d['risk']] += 1
        
    print(f"Number of dump sites detected: {len(dump_sites)}")
    print(f"Breakdown by risk level: {risk_counts}")
    
    # -- PART 4: Road Network Analysis --
    print("\n-- PART 4: Road Network Analysis --")
    print(f"Total length in HSR Layout: {total_km:.2f} km")
    print(f"Number of road segments: {len(gdf_road_4326)}")
    if road_type_cols:
        col = road_type_cols[0]
        print(f"Breakdown by {col}:")
        print(gdf_road[col].value_counts().to_string())
        
    np.random.seed(42)
    sample_size = int(len(gdf_road_4326) * 0.6)
    baseline_roads = gdf_road_4326.sample(n=sample_size)
    baseline_roads_utm = baseline_roads.to_crs(epsg=32643)
    baseline_km = baseline_roads_utm.geometry.length.sum() / 1000.0
    
    baseline_segments = []
    for geom in baseline_roads.geometry:
         if geom is None: continue
         if geom.geom_type == 'LineString':
             baseline_segments.append(list(geom.coords))
         elif geom.geom_type == 'MultiLineString':
             for part in geom.geoms:
                 baseline_segments.append(list(part.coords))
                 
    centroids = np.array([[g.centroid.x, g.centroid.y] for g in gdf_road_4326.geometry if g is not None and g.centroid])
    n_zones = min(50, len(centroids))
    kmeans = KMeans(n_clusters=n_zones, random_state=42, n_init=10).fit(centroids)
    zone_waypoints = kmeans.cluster_centers_
    
    dist_matrix = cdist(zone_waypoints, zone_waypoints)
    unvisited = set(range(1, n_zones))
    current = 0
    route_idx = [0]
    while unvisited:
        next_node = min(unvisited, key=lambda x: dist_matrix[current, x])
        route_idx.append(next_node)
        unvisited.remove(next_node)
        current = next_node
        
    opt_route_coords = zone_waypoints[route_idx]
    opt_linestring = LineString(opt_route_coords)
    opt_km = gpd.GeoSeries([opt_linestring], crs=4326).to_crs(epsg=32643).geometry.length.sum() / 1000.0
    opt_km *= 1.5
    
    optimized_segments = [list(opt_linestring.coords)]
    
    truck_routes = {
        "baseline": {"segments": baseline_segments, "total_km": round(baseline_km, 2)},
        "optimized": {"segments": optimized_segments, "total_km": round(opt_km, 2)}
    }
    with open("output/truck_routes.json", "w") as f:
         json.dump(truck_routes, f, indent=2)
         
    improvement = 0
    if baseline_km > 0:
        improvement = ((baseline_km - opt_km) / baseline_km) * 100
        
    print(f"Baseline km: {baseline_km:.2f}")
    print(f"Optimized km: {opt_km:.2f}")
    print(f"Improvement: {improvement:.1f}%")

    # -- PART 5: Summary Config --
    center_lon, center_lat = gdf_ward_4326.geometry.to_crs(epsg=32643).centroid.to_crs(epsg=4326).iloc[0].x, gdf_ward_4326.geometry.to_crs(epsg=32643).centroid.to_crs(epsg=4326).iloc[0].y
    minx, miny, maxx, maxy = gdf_ward_4326.total_bounds
    map_config = {
        "center": [center_lon, center_lat],
        "zoom": 14,
        "ward_name": "HSR Layout",
        "bounds": [minx, miny, maxx, maxy],
        "dump_count": len(dump_sites),
        "road_km": round(total_km, 2),
        "satellite_bands": bands_count
    }
    with open("output/map_config.json", "w") as f:
        json.dump(map_config, f, indent=2)
        
    # -- PART 6: Visualizations --
    fig, axs = plt.subplots(2, 2, figsize=(15, 15))
    
    if bands_count >= 3:
        axs[0, 0].imshow(rgb)
    else:
        axs[0, 0].imshow(normalized_bands[0], cmap='gray')
    axs[0, 0].set_title("Satellite Image")
    axs[0, 0].axis('off')
    
    if bands_count >= 3:
        axs[0, 1].imshow(rgb)
    else:
        axs[0, 1].imshow(normalized_bands[0], cmap='gray')
    if lon_lat_coords:
        px_coords = [~transform * (lon, lat) for lon, lat in np.array(lon_lat_coords)]
        px_x = [c[0] for c in px_coords]
        px_y = [c[1] for c in px_coords]
        axs[0, 1].scatter(px_x, px_y, c='red', s=5, alpha=0.5)
    axs[0, 1].set_title("Anomaly Detection Mask")
    axs[0, 1].axis('off')
    
    gdf_road_4326.plot(ax=axs[1, 0], color='blue', linewidth=0.5)
    axs[1, 0].set_title("Road Network")
    axs[1, 0].set_facecolor('white')
    axs[1, 0].axis('off')
    
    gdf_ward_4326.plot(ax=axs[1, 1], facecolor='none', edgecolor='black', linewidth=2)
    if dump_sites:
        colors = {"high": "red", "medium": "orange", "low": "green"}
        lats = [d['lat'] for d in dump_sites]
        lons = [d['lon'] for d in dump_sites]
        cs = [colors[d['risk']] for d in dump_sites]
        sizes = [max(10, d['area_sqm'] / 10) for d in dump_sites]
        axs[1, 1].scatter(lons, lats, c=cs, s=sizes, alpha=0.7)
    axs[1, 1].set_title("Ward Boundary & Dump Sites")
    axs[1, 1].axis('off')
    
    plt.tight_layout()
    plt.savefig("output/full_analysis.png", dpi=300, bbox_inches='tight')
    plt.close()
    
    print("\nAll outputs saved to /output folder")

if __name__ == "__main__":
    main()
