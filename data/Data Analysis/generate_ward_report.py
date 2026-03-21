import json
import struct
import os

BASE_DIR = r'c:\Users\Kishan Shetty\Downloads\Spacetech'
DATA_DIR = os.path.join(BASE_DIR, r'Waste methane dumpyards centers\Dry Waste Collection,Waste Processing & Landfill Locations')
GEOJSON_PATH = r'c:\Users\Kishan Shetty\Downloads\AstraSky-main\AstraSky-main\astracity\data\bengaluru_wards.geojson'
OUTPUT_MD = os.path.join(BASE_DIR, 'BBMP_Ward_Level_Waste_Report.md')

def read_shp_pointz(path):
    points = []
    try:
        with open(path, 'rb') as f:
            f.seek(100)
            while True:
                rec_header = f.read(8)
                if len(rec_header) < 8:
                    break
                content_length = struct.unpack('>I', rec_header[4:8])[0] * 2
                content = f.read(content_length)
                if len(content) < 4:
                    break
                stype = struct.unpack('<I', content[:4])[0]
                if stype == 11 and len(content) >= 36:
                    x = struct.unpack('<d', content[4:12])[0]
                    y = struct.unpack('<d', content[12:20])[0]
                    points.append((x, y))
                elif stype == 1 and len(content) >= 20:
                    x = struct.unpack('<d', content[4:12])[0]
                    y = struct.unpack('<d', content[12:20])[0]
                    points.append((x, y))
    except Exception as e:
        print(f"Error reading {path}: {e}")
    return points

def point_in_polygon(x, y, polygon):
    """Ray casting algorithm for point in polygon"""
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xints:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def get_ward_for_point(lon, lat, features):
    for feature in features:
        props = feature.get('properties', {})
        ward_name = props.get('WARD_NAME', props.get('KGISWardNa', props.get('name', 'Unknown')))
        ward_no = props.get('WARD_NO', props.get('KGISWardNo', props.get('ward_no', 'Unknown')))
        geometry = feature.get('geometry', {})
        if not geometry: continue
        
        gtype = geometry.get('type')
        coords = geometry.get('coordinates', [])
        
        polygons = []
        if gtype == 'Polygon':
            polygons = coords
        elif gtype == 'MultiPolygon':
            for poly in coords:
                polygons.extend(poly)
                
        for poly in polygons:
            # bbox check for fast exclude
            xs = [p[0] for p in poly]
            ys = [p[1] for p in poly]
            if not (min(xs) <= lon <= max(xs) and min(ys) <= lat <= max(ys)):
                continue
            if point_in_polygon(lon, lat, poly):
                return f"Ward {ward_no} - {ward_name}"
    return "Outside BBMP / Unknown"

def main():
    print("Loading Ward Boundaries...")
    try:
        with open(GEOJSON_PATH, 'r', encoding='utf-8') as f:
            geojson = json.load(f)
            features = geojson.get('features', [])
    except Exception as e:
        print(f"Failed to load GeoJSON: {e}")
        features = []

    datasets = {
        'BBMP_BIO-Methanisation': 'Bio-Methanisation Units',
        'BBMP_Dry_Waste_Collection_Centres': 'Dry Waste Collection Centres',
        'BBMP_Dumpyards': 'Dumpyards/Landfills',
        'BBMP_Waste_Processing_Units': 'Waste Processing Units'
    }

    print("Processing Datasets...")
    ward_stats = {}

    for ds_file, ds_name in datasets.items():
        shp_path = os.path.join(DATA_DIR, ds_file + '.shp')
        points = read_shp_pointz(shp_path)
        print(f"Loaded {len(points)} points from {ds_name}")
        
        for p_idx, (lon, lat) in enumerate(points):
            ward = get_ward_for_point(lon, lat, features)
            if ward not in ward_stats:
                ward_stats[ward] = {
                    'Bio-Methanisation Units': 0,
                    'Dry Waste Collection Centres': 0,
                    'Dumpyards/Landfills': 0,
                    'Waste Processing Units': 0,
                    'Points': []
                }
            ward_stats[ward][ds_name] += 1
            ward_stats[ward]['Points'].append((ds_name, lat, lon))

    print("Generating Report...")
    with open(OUTPUT_MD, 'w', encoding='utf-8') as md:
        md.write("# 🏛️ Bengaluru Solid Waste Infrastructure — Ward-Level Detail Report\n\n")
        md.write("> **Analysis of BBMP Waste Management Datasets linked to actual Ward Boundaries.**\n")
        md.write("> This report aggregates the exact geospatial points of all 4 BBMP dumpyard, processing, and collection center datasets into precise jurisdictional wards to highlight infrastructure gaps and methane hotspots.\n\n")
        
        # City-wide summary
        md.write("## 🏙️ City-Level Summary\n\n")
        md.write("| Infrastructure Category | Total Facilities |\n")
        md.write("|---|---|\n")
        for ds_name in datasets.values():
            total = sum(d[ds_name] for d in ward_stats.values())
            md.write(f"| {ds_name} | **{total}** |\n")
        
        md.write("\n---\n\n")
        md.write("## 📍 Detailed Ward-by-Ward Breakdown\n\n")
        md.write("*Wards lacking sufficient Dry Waste Collection Centres are at a high risk for illegal dumping. Wards containing Dumpyards or Processing Units are key methane emission hotspots.*\n\n")
        
        # Sort wards alphabetically
        sorted_wards = sorted(ward_stats.keys(), key=lambda x: ("0" if str(x) == "Outside BBMP / Unknown" else str(x)))
        
        for ward in sorted_wards:
            stats = ward_stats[ward]
            
            # Skip empty "Outside" if it has 0 interesting things, but we want to show all that have data.
            md.write(f"### 🛡️ {ward}\n\n")
            
            # Ward totals table
            md.write("| Facility Type | Count | Status / Risk |\n")
            md.write("|---|---|---|\n")
            
            # Bio-Meth
            bio_c = stats['Bio-Methanisation Units']
            md.write(f"| Bio-Methanisation Units | **{bio_c}** | {'🟢 Controlled Methane' if bio_c > 0 else '⚪ None'} |\n")
            
            # DWCC
            dwcc_c = stats['Dry Waste Collection Centres']
            if dwcc_c == 0:
                dwcc_status = "🔴 HIGH DUMPING RISK (Zero coverage)"
            elif dwcc_c == 1:
                dwcc_status = "🟡 Minimum coverage"
            else:
                dwcc_status = "🟢 Good coverage"
            md.write(f"| Dry Waste Collection Centres | **{dwcc_c}** | {dwcc_status} |\n")
            
            # WPU
            wpu_c = stats['Waste Processing Units']
            md.write(f"| Waste Processing Units | **{wpu_c}** | {'🟠 Processing Hotspot' if wpu_c > 0 else '⚪ None'} |\n")
            
            # Landfills
            land_c = stats['Dumpyards/Landfills']
            md.write(f"| Dumpyards/Landfills | **{land_c}** | {'🔴 CRITICAL METHANE EMITTER' if land_c > 0 else '⚪ None'} |\n\n")
            
            # Coordinates list if they have any WPUs, Dumpyards or Bio
            critical_points = [p for p in stats['Points'] if p[0] != 'Dry Waste Collection Centres']
            if critical_points:
                md.write("**Critical Methane Infrastructure Locations:**\n")
                for kind, lat, lon in critical_points:
                    md.write(f"- {kind}: `{lat:.6f}°N, {lon:.6f}°E`\n")
                md.write("\n")
            
            md.write("---\n")
            
        print(f"Report fully generated at {OUTPUT_MD}")

if __name__ == '__main__':
    main()
