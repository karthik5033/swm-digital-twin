import os
import json
import numpy as np
import rasterio
import geopandas as gpd
from shapely.geometry import Point, box, Polygon
from scipy import ndimage
from skimage import filters, color, morphology
import matplotlib.pyplot as plt
import warnings

warnings.filterwarnings('ignore')

def get_pixel_area(res_x, res_y, is_latlon):
    if is_latlon:
        area_deg2 = abs(res_x * res_y)
        area_m2 = area_deg2 * (110574.0 * 108510.0)
        return area_m2
    else:
        return abs(res_x * res_y)

def main():
    os.makedirs('output', exist_ok=True)
    
    # 1. Inputs
    tif_path = "HSR_Layout_SD.tif"
    road_path = "output/hsr_road_network.geojson"
    ward_path = "output/hsr_ward_boundary.geojson"
    
    if not os.path.exists(road_path):
        print(f"Error: {road_path} not found.")
        return
        
    gdf_road = gpd.read_file(road_path)
    gdf_ward = gpd.read_file(ward_path) if os.path.exists(ward_path) else None
    
    with rasterio.open(tif_path) as src:
        transform = src.transform
        res = src.res
        is_latlon = src.crs.is_geographic if src.crs else True
        pixel_area_sqm = get_pixel_area(res[0], res[1], is_latlon)
        
        red = src.read(1)
        green = src.read(2)
        blue = src.read(3)
        
        def norm_band(b):
            v_min, v_max = b[b < 65535].min(), b[b < 65535].max()
            if v_max > v_min:
                n = (b.astype(float) - v_min) / (v_max - v_min) * 255.0
                return np.clip(n, 0, 255).astype(np.uint8)
            return np.zeros_like(b, dtype=np.uint8)
            
        r = norm_band(red)
        g = norm_band(green)
        b = norm_band(blue)
        rgb = np.dstack([r, g, b])
        
    print("-- STEP 1: Building Detection from Satellite --")
    gray = color.rgb2gray(rgb)
    edges = filters.sobel(gray)
    
    # Handle nodata edges dominating threshold
    mask_data = (gray > 0)
    mask_eroded = morphology.binary_erosion(mask_data, morphology.disk(5))
    edges[~mask_eroded] = 0
    
    thresh = filters.threshold_local(edges, block_size=35, offset=-0.01)
    binary = (edges > thresh) & mask_eroded
    
    cleaned = morphology.remove_small_objects(binary, min_size=5)
    
    labels, num_features = ndimage.label(cleaned)
    slices = ndimage.find_objects(labels)
    
    structures = []
    for i, slc in enumerate(slices):
        if slc is None: continue
        label_id = i + 1
        mask = (labels[slc] == label_id)
        area_px = np.sum(mask)
        if 8 <= area_px <= 2000:
            y0, x0 = slc[0].start, slc[1].start
            com_y, com_x = ndimage.center_of_mass(mask)
            cy, cx = y0 + com_y, x0 + com_x
            
            h, w = mask.shape
            aspect = float(w) / float(h) if h > 0 else 1.0
            
            lon, lat = rasterio.transform.xy(transform, cy, cx)
            mean_b = np.mean(gray[slc][mask])
            
            structures.append({
                "id": label_id,
                "lon": lon,
                "lat": lat,
                "area_sqm": area_px * pixel_area_sqm,
                "aspect": aspect,
                "brightness": mean_b,
                "pixel_area": area_px,
                "type": 'mixed'
            })
            
    total_structures = len(structures)
    print(f"Total structures detected: {total_structures}")
    
    if total_structures == 0:
        print("No structures detected.")
        return
        
    print("\n-- STEP 2: Classify Residential vs Commercial --")
    gdf_road_utm = gdf_road.to_crs(epsg=32643)
    gdf_road_utm['len'] = gdf_road_utm.geometry.length
    p75 = gdf_road_utm['len'].quantile(0.75)
    major_roads = gdf_road_utm[gdf_road_utm['len'] >= p75]
    
    major_roads_buffer = major_roads.geometry.buffer(50)
    major_roads_union = major_roads_buffer.unary_union
    
    points = [Point(s['lon'], s['lat']) for s in structures]
    gdf_structures = gpd.GeoDataFrame(structures, geometry=points, crs="EPSG:4326")
    gdf_structures_utm = gdf_structures.to_crs(epsg=32643)
    
    in_comm_zone = gdf_structures_utm.geometry.within(major_roads_union)
    
    res_count = 0
    com_count = 0
    mix_count = 0
    
    for idx, row in gdf_structures.iterrows():
        area = row['area_sqm']
        aspect = row['aspect']
        
        if area < 300 and 0.5 <= aspect <= 2.0:
            base_type = 'residential'
        elif area >= 300 or aspect > 2.5:
            base_type = 'commercial'
        else:
            base_type = 'mixed'
            
        is_comm = in_comm_zone.iloc[idx]
        if is_comm and base_type == 'residential':
            final_type = 'mixed'
        elif is_comm and base_type == 'mixed':
            final_type = 'commercial'
        else:
            final_type = base_type
            
        gdf_structures.at[idx, 'type'] = final_type
        if final_type == 'residential': res_count += 1
        elif final_type == 'commercial': com_count += 1
        else: mix_count += 1
        
    print(f"Residential count: {res_count}")
    print(f"Commercial count: {com_count}")
    print(f"Mixed count: {mix_count}")
    
    print("\n-- STEP 3: Population Estimation --")
    KNOWN_POPULATION = 120000
    
    def estimate_pop(far):
        pop = 0
        for idx, row in gdf_structures.iterrows():
            if row['type'] == 'residential':
                pop += (row['area_sqm'] * far) / 85.0 * 4.2
            elif row['type'] == 'mixed':
                pop += (row['area_sqm'] * far * 0.5) / 85.0 * 4.2
        return pop
        
    far_assumed = 2.0
    estimated_pop = estimate_pop(far_assumed)
    
    if estimated_pop > 0 and abs(estimated_pop - KNOWN_POPULATION) / KNOWN_POPULATION > 0.30:
        far_assumed = (KNOWN_POPULATION / estimated_pop) * far_assumed
        estimated_pop = estimate_pop(far_assumed)
        
    print(f"Estimated population: {int(estimated_pop)} (Known: ~{KNOWN_POPULATION})")
    
    print("\n-- STEP 4: Waste Generation Calculation --")
    res_waste_per_day = 0
    com_waste_per_day = 0
    mix_waste_per_day = 0
    gdf_structures['waste_kg_day'] = 0.0
    
    for idx, row in gdf_structures.iterrows():
        t = row['type']
        if t == 'residential':
            persons = (row['area_sqm'] * far_assumed) / 85.0 * 4.2
            w = persons * 0.45
            res_waste_per_day += w
            gdf_structures.at[idx, 'waste_kg_day'] = w
        elif t == 'commercial':
            com_waste_per_day += 2.5
            gdf_structures.at[idx, 'waste_kg_day'] = 2.5
        else:
            mix_waste_per_day += 1.2
            gdf_structures.at[idx, 'waste_kg_day'] = 1.2
            
    total_waste_kg = res_waste_per_day + com_waste_per_day + mix_waste_per_day
    total_waste_tons_year = (total_waste_kg * 365) / 1000.0
    
    print(f"Residential waste per day: {res_waste_per_day:.2f} kg")
    print(f"Commercial waste per day: {com_waste_per_day:.2f} kg")
    print(f"Total waste per day: {total_waste_kg:.2f} kg ({total_waste_kg/1000.0:.2f} tons)")
    print(f"Total waste per year: {total_waste_tons_year:.2f} tons")
    
    minx, miny, maxx, maxy = gdf_ward.total_bounds if gdf_ward is not None else (77.622725, 12.897941, 77.66935, 12.931065)
    dx = (maxx - minx) / 4.0
    dy = (maxy - miny) / 4.0
    
    grid_zones = []
    letters = ['A', 'B', 'C', 'D']
    for i in range(4):
        for j in range(4):
            z_minx = minx + j * dx
            z_maxx = minx + (j + 1) * dx
            z_miny = miny + i * dy
            z_maxy = miny + (i + 1) * dy
            poly = box(z_minx, z_miny, z_maxx, z_maxy)
            
            in_zone = gdf_structures.geometry.within(poly)
            z_structs = gdf_structures[in_zone]
            
            z_res = len(z_structs[z_structs['type'] == 'residential'])
            z_com = len(z_structs[z_structs['type'] == 'commercial'])
            z_waste = z_structs['waste_kg_day'].sum()
            z_pop = sum([(r['area_sqm'] * far_assumed) / 85.0 * 4.2 for _, r in z_structs.iterrows() if r['type'] in ('residential', 'mixed')])
            
            grid_zones.append({
                "zone_id": f"{letters[i]}{j+1}",
                "bounds": [z_minx, z_miny, z_maxx, z_maxy],
                "center": [(z_minx+z_maxx)/2, (z_miny+z_maxy)/2],
                "residential_count": z_res,
                "commercial_count": z_com,
                "population_estimate": int(z_pop),
                "waste_kg_day": round(z_waste, 2)
            })
            
    waste_loads = [z['waste_kg_day'] for z in grid_zones]
    p75_waste = np.percentile(waste_loads, 75) if waste_loads else 0
    p25_waste = np.percentile(waste_loads, 25) if waste_loads else 0
    high_risk_count = 0
    
    for z in grid_zones:
        if z['waste_kg_day'] >= p75_waste:
            z['risk'] = 'high'
            high_risk_count += 1
        elif z['waste_kg_day'] <= p25_waste:
            z['risk'] = 'low'
        else:
            z['risk'] = 'medium'
            
    out_json = {
      "total_structures": total_structures,
      "residential_count": res_count,
      "commercial_count": com_count, 
      "mixed_count": mix_count,
      "estimated_population": int(estimated_pop),
      "waste_per_day_kg": round(total_waste_kg, 2),
      "waste_per_year_tons": round(total_waste_tons_year, 2),
      "residential_waste_kg_day": round(res_waste_per_day, 2),
      "commercial_waste_kg_day": round(com_waste_per_day, 2),
      "zones": grid_zones
    }
    
    with open("output/zone_analysis.json", "w") as f:
        json.dump(out_json, f, indent=2)
        
    gdf_export = gdf_structures[['type', 'area_sqm', 'waste_kg_day', 'geometry']]
    gdf_export.to_file("output/buildings.geojson", driver="GeoJSON")
    
    fig, axs = plt.subplots(2, 2, figsize=(15, 15))
    
    axs[0,0].imshow(rgb)
    xs = [~transform * (p.x, p.y) for p in gdf_structures.geometry]
    px_x = [c[0] for c in xs]
    px_y = [c[1] for c in xs]
    axs[0,0].scatter(px_x, px_y, c='yellow', s=1, alpha=0.5)
    axs[0,0].set_title("Building Detection Overlay")
    axs[0,0].axis('off')
    
    axs[0,1].imshow(rgb)
    c_map = {'residential': 'green', 'commercial': 'red', 'mixed': 'yellow'}
    colors = [c_map[t] for t in gdf_structures['type']]
    axs[0,1].scatter(px_x, px_y, c=colors, s=2, alpha=0.8)
    axs[0,1].set_title("Classification Map")
    axs[0,1].axis('off')
    
    axs[1,0].imshow(gray, cmap='gray')
    for z in grid_zones:
        box_px = [~transform * (lon, lat) for lon, lat in [
            (z['bounds'][0], z['bounds'][1]),
            (z['bounds'][2], z['bounds'][1]),
            (z['bounds'][2], z['bounds'][3]),
            (z['bounds'][0], z['bounds'][3])
        ]]
        pol = plt.Polygon(box_px, alpha=0.5, edgecolor='black', 
                          facecolor='red' if z['risk'] == 'high' else 'orange' if z['risk'] == 'medium' else 'green')
        axs[1,0].add_patch(pol)
    axs[1,0].set_title("Waste Generation Heatmap (4x4)")
    axs[1,0].axis('off')
    
    axs[1,1].imshow(gray, cmap='gray')
    pops = [z['population_estimate'] for z in grid_zones]
    max_p = max(pops) if pops and max(pops) > 0 else 1
    for z in grid_zones:
        box_px = [~transform * (lon, lat) for lon, lat in [
            (z['bounds'][0], z['bounds'][1]),
            (z['bounds'][2], z['bounds'][1]),
            (z['bounds'][2], z['bounds'][3]),
            (z['bounds'][0], z['bounds'][3])
        ]]
        intensity = z['population_estimate'] / max_p
        pol = plt.Polygon(box_px, alpha=intensity*0.8, edgecolor='black', facecolor='blue')
        axs[1,1].add_patch(pol)
    axs[1,1].set_title("Population Density Map")
    axs[1,1].axis('off')
    
    plt.tight_layout()
    plt.savefig("output/zone_analysis.png", dpi=200, bbox_inches='tight')
    plt.close()
    
    print("\n=== HSR LAYOUT ANALYSIS SUMMARY ===")
    print(f"Total buildings detected: {total_structures}")
    res_pct = (res_count/total_structures)*100 if total_structures else 0
    com_pct = (com_count/total_structures)*100 if total_structures else 0
    mix_pct = (mix_count/total_structures)*100 if total_structures else 0
    print(f"  Residential: {res_count} ({res_pct:.1f}%)")
    print(f"  Commercial: {com_count} ({com_pct:.1f}%)")
    print(f"  Mixed: {mix_count} ({mix_pct:.1f}%)")
    print(f"Estimated population: {int(estimated_pop)} (known: ~{KNOWN_POPULATION})")
    print(f"Daily waste generation: {total_waste_kg/1000.0:.1f} tons/day")
    print(f"Annual waste generation: {total_waste_tons_year:.1f} tons/year")
    res_w_pct = (res_waste_per_day/total_waste_kg)*100 if total_waste_kg else 0
    com_w_pct = (com_waste_per_day/total_waste_kg)*100 if total_waste_kg else 0
    print(f"  From residential: {res_w_pct:.1f}%")
    print(f"  From commercial: {com_w_pct:.1f}%")
    print(f"High waste zones: {high_risk_count} of 16")
    print("==================================")

if __name__ == "__main__":
    main()
