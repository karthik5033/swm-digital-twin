import os
import json
import numpy as np
import rasterio
from rasterio import features
import geopandas as gpd
from shapely.geometry import Point, box, Polygon
from scipy import ndimage
from skimage import color, morphology
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
    
    tif_path = "HSR_Layout_SD.tif"
    road_path = "output/hsr_road_network.geojson"
    ward_path = "output/hsr_ward_boundary.geojson"
    dump_path = "output/dump_sites.json"
    
    if not os.path.exists(road_path):
        print("Required files not found.")
        return
        
    gdf_road = gpd.read_file(road_path)
    gdf_ward = gpd.read_file(ward_path)
    
    try:
        with open(dump_path, 'r') as f:
            dump_sites = json.load(f)
    except FileNotFoundError:
        dump_sites = []
    
    with rasterio.open(tif_path) as src:
        transform = src.transform
        res = src.res
        crs = src.crs
        is_latlon = crs.is_geographic if crs else True
        pixel_area_sqm = get_pixel_area(res[0], res[1], is_latlon)
        
        red = src.read(1)
        green = src.read(2)
        blue = src.read(3)
        
        def norm_band(b):
            valid = b[b < 65535]
            if len(valid) == 0: return np.zeros_like(b, dtype=np.uint8)
            v_min, v_max = valid.min(), np.percentile(valid, 98)
            if v_max > v_min:
                n = (b.astype(float) - v_min) / (v_max - v_min) * 255.0
                return np.clip(n, 0, 255).astype(np.uint8)
            return np.zeros_like(b, dtype=np.uint8)
            
        r_arr = norm_band(red)
        g_arr = norm_band(green)
        b_arr = norm_band(blue)
        rgb = np.dstack([r_arr, g_arr, b_arr])
        shape = r_arr.shape
        gray = color.rgb2gray(rgb)
        
    brightness = np.mean([r_arr, g_arr, b_arr], axis=0)
    
    # ── STEP 1: LULC Classification ──
    mean_b = ndimage.uniform_filter(brightness.astype(float), size=3)
    mean_b2 = ndimage.uniform_filter(brightness.astype(float)**2, size=3)
    std_b = np.sqrt(np.clip(mean_b2 - mean_b**2, 0, None))
    
    road_mask = features.geometry_mask(gdf_road.geometry, transform=transform, invert=True, out_shape=shape)
    road_mask_dilated = morphology.binary_dilation(road_mask, morphology.disk(2))
    
    classes = np.full(shape, 7, dtype=np.uint8)
    
    r_f, g_f, b_f = r_arr.astype(float), g_arr.astype(float), b_arr.astype(float)
    
    classes[brightness < 40] = 6
    mask_water = (b_f > np.maximum(r_f, g_f) + 10) & (brightness < 70)
    classes[mask_water] = 5
    mask_bare = (r_f > g_f + 5) & (g_f > b_f) & (brightness >= 90) & (brightness <= 180)
    classes[mask_bare] = 4
    mask_veg = (g_f > np.maximum(r_f, b_f) + 10)
    classes[mask_veg] = 3
    mask_road = road_mask_dilated & (brightness >= 70) & (brightness <= 170) & (std_b < 25)
    classes[mask_road] = 2
    mask_rooftop = (brightness > 140) & (std_b < 40)
    classes[mask_rooftop] = 1
    
    nodata_mask = (red == 65535) & (green == 65535) & (blue == 65535)
    classes[nodata_mask] = 0
    
    lulc_names = {1: 'Rooftop', 2: 'Road / Paved', 3: 'Vegetation', 4: 'Bare Soil', 5: 'Water', 6: 'Shadow', 7: 'Mixed'}
    
    # ── STEP 2: Compute LULC Statistics ──
    total_valid_pixels = np.sum(~nodata_mask)
    total_area_ha = (total_valid_pixels * pixel_area_sqm) / 10000.0
    
    stats = {}
    for c in range(1, 8):
        count = np.sum(classes == c)
        area_ha = (count * pixel_area_sqm) / 10000.0
        pct = (count / total_valid_pixels) * 100 if total_valid_pixels else 0
        stats[c] = {"area_ha": area_ha, "pct": pct, "count": int(count)}
        
    # ── STEP 3: Building Rooftop Metrics ──
    rooftop_binary = (classes == 1)
    rooftop_binary = morphology.binary_opening(rooftop_binary, morphology.disk(1))
    rt_labels, rt_num = ndimage.label(rooftop_binary)
    
    rooftops = []
    rt_slices = ndimage.find_objects(rt_labels)
    for i, slc in enumerate(rt_slices):
        if slc is None: continue
        mask = (rt_labels[slc] == (i + 1))
        area_px = np.sum(mask)
        if 15 <= area_px <= 3000:
            y0, x0 = slc[0].start, slc[1].start
            com_y, com_x = ndimage.center_of_mass(mask)
            cy, cx = y0 + com_y, x0 + com_x
            lon, lat = rasterio.transform.xy(transform, cy, cx)
            area_m2 = area_px * pixel_area_sqm
            
            h, w = mask.shape
            aspect = float(w)/float(h) if h>0 else 1.0
            
            if area_m2 > 500: rclass = 'LARGE FLAT'
            elif area_m2 >= 200: rclass = 'MEDIUM'
            else: rclass = 'SMALL'
            
            rooftops.append({
                "area_sqm": area_m2,
                "lon": lon,
                "lat": lat,
                "aspect": aspect,
                "class": rclass,
                "waste_kg_day_estimate": 2.5 if rclass == 'LARGE FLAT' else 1.2 if rclass == 'MEDIUM' else 0.45,
                "geometry": Point(lon, lat)
            })
            
    r_large = [r for r in rooftops if r['class'] == 'LARGE FLAT']
    r_med = [r for r in rooftops if r['class'] == 'MEDIUM']
    r_small = [r for r in rooftops if r['class'] == 'SMALL']
    total_rt_m2 = sum(r['area_sqm'] for r in rooftops)
    
    # ── STEP 4: Open Space Analysis ──
    open_spaces_binary = np.isin(classes, [3, 4, 5])
    open_spaces_binary = morphology.binary_opening(open_spaces_binary, morphology.disk(2))
    os_labels, os_num = ndimage.label(open_spaces_binary)
    
    dump_points = [Point(d['lon'], d['lat']) for d in dump_sites]
    open_spaces = []
    os_slices = ndimage.find_objects(os_labels)
    for i, slc in enumerate(os_slices):
        if slc is None: continue
        mask = (os_labels[slc] == (i + 1))
        area_px = np.sum(mask)
        area_m2 = area_px * pixel_area_sqm
        if area_m2 > 100:
            patch_classes = classes[slc][mask]
            maj_class = np.bincount(patch_classes).argmax()
            if maj_class == 3: otype = 'green'
            elif maj_class == 5: otype = 'water'
            else: otype = 'bare'
            
            com_y, com_x = ndimage.center_of_mass(mask)
            y0, x0 = slc[0].start, slc[1].start
            lon, lat = rasterio.transform.xy(transform, y0 + com_y, x0 + com_x)
            pt = Point(lon, lat)
            
            nearest_dist = 999999
            if dump_points:
                 dists = [pt.distance(dp) * 111000 for dp in dump_points]
                 nearest_dist = min(dists)
                 
            risk = 'low'
            if otype == 'bare' and area_m2 > 200 and nearest_dist < 300:
                risk = 'high'
            elif nearest_dist < 500:
                 risk = 'medium'
                 
            open_spaces.append({
                "area_sqm": area_m2,
                "type": otype,
                "lon": lon,
                "lat": lat,
                "dump_risk": risk,
                "nearest_dump_m": nearest_dist,
                "geometry": pt
            })
            
    green_patches = [o for o in open_spaces if o['type'] == 'green']
    bare_patches = [o for o in open_spaces if o['type'] == 'bare']
    water_patches = [o for o in open_spaces if o['type'] == 'water']
    high_risk_os = [o for o in open_spaces if o['dump_risk'] == 'high']
    
    # ── STEP 5 & 6: Urban Density Metrics (16 zones) & Waste ──
    minx, miny, maxx, maxy = gdf_ward.total_bounds
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
            z_box = box(z_minx, z_miny, z_maxx, z_maxy)
            
            row_min, col_min = ~transform * (z_minx, z_maxy)
            row_max, col_max = ~transform * (z_maxx, z_miny)
            r0 = max(0, int(row_min))
            r1 = min(shape[0], int(row_max))
            c0 = max(0, int(col_min))
            c1 = min(shape[1], int(col_max))
            
            z_classes = classes[r0:r1, c0:c1]
            z_total = z_classes.size
            if z_total == 0: continue
            
            z_rt = np.sum(z_classes == 1)
            z_rd = np.sum(z_classes == 2)
            z_vg = np.sum(z_classes == 3)
            z_br = np.sum(z_classes == 4)
            
            b_cov = z_rt / z_total * 100
            g_cov = z_vg / z_total * 100
            i_cov = (z_rt + z_rd) / z_total * 100
            o_cov = z_br / z_total * 100
            
            if b_cov > 40: den = 'HIGH'
            elif b_cov >= 20: den = 'MEDIUM'
            else: den = 'LOW'
            
            z_rt_objs = [r for r in rooftops if z_box.contains(r['geometry'])]
            waste = sum([r['waste_kg_day_estimate'] for r in z_rt_objs])
            
            grid_zones.append({
                "zone_id": f"{letters[i]}{j+1}",
                "building_coverage_pct": round(b_cov, 2),
                "green_coverage_pct": round(g_cov, 2),
                "impervious_pct": round(i_cov, 2),
                "open_land_pct": round(o_cov, 2),
                "density_class": den,
                "waste_kg_day_estimate": round(waste, 2),
                "bounds": [z_minx, z_miny, z_maxx, z_maxy]
            })
            
    # ── STEP 7: Save Outputs ──
    out_json = {
      "ward": "HSR Layout",
      "total_area_hectares": round(total_area_ha, 2),
      "lulc_summary": {
        "rooftop": { "area_ha": round(stats[1]['area_ha'], 2), "pct": round(stats[1]['pct'], 2), "rooftop_count": len(rooftops) },
        "road_paved": { "area_ha": round(stats[2]['area_ha'], 2), "pct": round(stats[2]['pct'], 2) },
        "vegetation": { "area_ha": round(stats[3]['area_ha'], 2), "pct": round(stats[3]['pct'], 2), "patch_count": len(green_patches) },
        "bare_soil": { "area_ha": round(stats[4]['area_ha'], 2), "pct": round(stats[4]['pct'], 2), "patch_count": len(bare_patches) },
        "water": { "area_ha": round(stats[5]['area_ha'], 2), "pct": round(stats[5]['pct'], 2) },
        "shadow_dark": { "area_ha": round(stats[6]['area_ha'], 2), "pct": round(stats[6]['pct'], 2) },
        "mixed": { "area_ha": round(stats[7]['area_ha'], 2), "pct": round(stats[7]['pct'], 2) }
      },
      "rooftop_analysis": {
        "total": len(rooftops),
        "large_flat_commercial": len(r_large),
        "medium_apartment": len(r_med),
        "small_house": len(r_small),
        "total_rooftop_area_ha": round(total_rt_m2 / 10000.0, 2),
        "avg_rooftop_sqm": round(total_rt_m2 / len(rooftops) if rooftops else 0, 2)
      },
      "open_spaces": {
        "green_patches": len(green_patches),
        "bare_land_patches": len(bare_patches),
        "water_bodies": len(water_patches),
        "high_risk_future_dumps": len(high_risk_os)
      },
      "zones": grid_zones
    }
    with open("output/lulc_classification.json", "w") as f:
        json.dump(out_json, f, indent=2)
        
    gdf_rt = gpd.GeoDataFrame(rooftops)
    if 'geometry' in gdf_rt.columns and len(gdf_rt) > 0:
        gdf_rt.set_crs('EPSG:4326', inplace=True)
        gdf_rt[['area_sqm', 'class', 'waste_kg_day_estimate', 'geometry']].to_file("output/rooftops.geojson", driver="GeoJSON")
        
    gdf_os = gpd.GeoDataFrame(open_spaces)
    if 'geometry' in gdf_os.columns and len(gdf_os) > 0:
        gdf_os.set_crs('EPSG:4326', inplace=True)
        gdf_os[['area_sqm', 'type', 'dump_risk', 'nearest_dump_m', 'geometry']].to_file("output/open_spaces.geojson", driver="GeoJSON")
        
        gdf_hr = gdf_os[gdf_os['dump_risk'] == 'high']
        if len(gdf_hr) > 0:
            gdf_hr.to_file("output/high_risk_zones.geojson", driver="GeoJSON")
            
    # ── STEP 8: Visualizations ──
    cmap_vals = {
        1: [239, 68, 68],    # Red (rooftop)
        2: [107, 114, 128],  # Gray (road)
        3: [34, 197, 94],    # Green (veg)
        4: [245, 158, 11],   # Amber (bare)
        5: [59, 130, 246],   # Blue (water)
        6: [76, 29, 149],    # Purple (shadow)
        7: [200, 200, 200]   # Light gray (mixed)
    }
    
    lulc_rgb = np.zeros((*shape, 3), dtype=np.uint8)
    for c, color_val in cmap_vals.items():
        lulc_rgb[classes == c] = color_val
        
    blended = (rgb * 0.4 + lulc_rgb * 0.6).astype(np.uint8)
    blended[nodata_mask] = 255
    
    plt.figure(figsize=(10, 10))
    plt.imshow(blended)
    import matplotlib.patches as mpatches
    handles = [mpatches.Patch(color=np.array(cmap_vals[c])/255., label=f"{lulc_names[c]}") for c in range(1, 8)]
    plt.legend(handles=handles, loc='upper right')
    plt.title("HSR Layout LULC Classification — AstraCity")
    plt.axis('off')
    plt.savefig("output/lulc_map.png", dpi=300, bbox_inches='tight')
    plt.close()
    
    fig = plt.figure(figsize=(18, 12))
    gs = fig.add_gridspec(2, 3)
    
    ax0 = fig.add_subplot(gs[0, 0])
    ax0.imshow(blended)
    ax0.set_title("LULC Classification")
    ax0.axis('off')
    
    ax1 = fig.add_subplot(gs[0, 1])
    szs = [len(r_large), len(r_med), len(r_small)]
    lbls = ['Large (Com)', 'Med (Apt)', 'Small (House)']
    if sum(szs) > 0:
        ax1.pie(szs, labels=lbls, autopct='%1.1f%%', colors=['#ef4444', '#f97316', '#fca5a5'])
    ax1.set_title("Rooftop Types")
    
    ax2 = fig.add_subplot(gs[0, 2])
    areas = [stats[c]['area_ha'] for c in range(1, 8)]
    names = [lulc_names[c] for c in range(1, 8)]
    colors_bar = [np.array(cmap_vals[c])/255. for c in range(1, 8)]
    ax2.bar(names, areas, color=colors_bar)
    ax2.set_xticklabels(names, rotation=45, ha='right')
    ax2.set_ylabel("Area (Hectares)")
    ax2.set_title("LULC Area Breakdown")
    
    ax3 = fig.add_subplot(gs[1, 0])
    ax3.imshow(gray, cmap='gray')
    for z in grid_zones:
        bx = [~transform * (lon, lat) for lon, lat in [
            (z['bounds'][0], z['bounds'][1]),
            (z['bounds'][2], z['bounds'][1]),
            (z['bounds'][2], z['bounds'][3]),
            (z['bounds'][0], z['bounds'][3])
        ]]
        val = z['building_coverage_pct'] / 100.0
        pol = plt.Polygon(bx, alpha=min(val, 0.8), edgecolor='black', facecolor='red')
        ax3.add_patch(pol)
    ax3.set_title("Building Coverage Heatmap")
    ax3.axis('off')
    
    ax4 = fig.add_subplot(gs[1, 1])
    ax4.imshow(gray, cmap='gray')
    os_xs = [~transform * (o['lon'], o['lat']) for o in open_spaces]
    pxs = [c[0] for c in os_xs]
    pys = [c[1] for c in os_xs]
    ors = [o['dump_risk'] for o in open_spaces]
    cc = ['red' if r == 'high' else 'orange' if r == 'medium' else 'green' for r in ors]
    if len(pxs) > 0:
        ax4.scatter(pxs, pys, c=cc, s=4)
    ax4.set_title("Open Spaces Dump Risk")
    ax4.axis('off')
    
    ax5 = fig.add_subplot(gs[1, 2])
    x_val = [z['impervious_pct'] for z in grid_zones]
    y_val = [z['waste_kg_day_estimate'] for z in grid_zones]
    if len(x_val) > 0:
        ax5.scatter(x_val, y_val, c='purple')
    ax5.set_xlabel("Impervious Surface %")
    ax5.set_ylabel("Est. Waste (kg/day)")
    ax5.set_title("Waste vs Impervious")
    
    plt.tight_layout()
    plt.savefig("output/lulc_dashboard.png", dpi=300, bbox_inches='tight')
    plt.close()
    
    # ── STEP 9: Print Full Summary ──
    print("\n=== HSR LAYOUT LULC ANALYSIS ===")
    print(f"Total ward area: {total_area_ha:.1f} hectares")
    print("\nLAND COVER:")
    for c in range(1, 8):
        print(f"  {lulc_names[c]}: {stats[c]['area_ha']:.1f} ha ({stats[c]['pct']:.1f}%)")
        
    print("\nROOFTOPS:")
    print(f"Total rooftops: {len(rooftops)}")
    if len(rooftops) > 0:
        print(f"Large flat (commercial): {len(r_large)} — {len(r_large)/len(rooftops)*100:.1f}%")
        print(f"Medium (apartment): {len(r_med)} — {len(r_med)/len(rooftops)*100:.1f}%")
        print(f"Small (house): {len(r_small)} — {len(r_small)/len(rooftops)*100:.1f}%")
        print(f"Total rooftop area: {total_rt_m2/10000.0:.1f} hectares")
        print(f"Avg rooftop size: {total_rt_m2/len(rooftops):.1f} sqm")
        
    print("\nOPEN SPACES:")
    print(f"Total green spaces: {len(green_patches)} ({(sum(o['area_sqm'] for o in green_patches)/10000.0):.1f} hectares)")
    print(f"Total bare/open land: {len(bare_patches)} ({(sum(o['area_sqm'] for o in bare_patches)/10000.0):.1f} hectares)")
    print(f"Water bodies: {len(water_patches)} ({(sum(o['area_sqm'] for o in water_patches)/10000.0):.1f} hectares)")
    print(f"High-risk open spaces (future dumps): {len(high_risk_os)}")
    
if __name__ == "__main__":
    main()
