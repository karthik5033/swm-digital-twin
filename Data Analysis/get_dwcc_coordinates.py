import json
import struct
import os

BASE_DIR = r'c:\Users\Kishan Shetty\Downloads\AstraSky-maing'
DATA_DIR = os.path.join(BASE_DIR, r'DS\Waste methane dumpyards centers\Dry Waste Collection,Waste Processing & Landfill Locations')
GEOJSON_PATH = r'c:\Users\Kishan Shetty\Downloads\AstraSky-maing\public\data\hsr_ward_boundary.geojson'

def read_shp_pointz(path):
    points = []
    try:
        with open(path, 'rb') as f:
            f.seek(100)
            while True:
                rec_header = f.read(8)
                if len(rec_header) < 8: break
                content_length = struct.unpack('>I', rec_header[4:8])[0] * 2
                content = f.read(content_length)
                if len(content) < 4: break
                stype = struct.unpack('<I', content[:4])[0]
                if stype in [1, 11] and len(content) >= 20:
                    x = struct.unpack('<d', content[4:12])[0]
                    y = struct.unpack('<d', content[12:20])[0]
                    points.append((x, y))
    except Exception as e:
        print(f"Error: {e}")
    return points

def point_in_polygon(x, y, polygon):
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0][:2]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n][:2]
        if y > min(p1y, p2y) and y <= max(p1y, p2y) and x <= max(p1x, p2x):
            if p1y != p2y:
                xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                if p1x == p2x or x <= xints:
                    inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def main():
    print("Loading Ward Boundary...")
    try:
        with open(GEOJSON_PATH, 'r') as f:
            geojson = json.load(f)
            features = geojson.get('features', [])
    except Exception as e:
        print(f"Failed load: {e}"); return

    shp_path = os.path.join(DATA_DIR, 'BBMP_Dry_Waste_Collection_Centres.shp')
    points = read_shp_pointz(shp_path)
    print(f"Loaded {len(points)} total points.")

    hsr_points = []
    for x, y in points:
        # Check if point falls inside HSR Layout bounding box
        if 12.89 <= y <= 12.94 and 77.62 <= x <= 77.68:
            hsr_points.append({'lat': y, 'lon': x})

    print(json.dumps(hsr_points, indent=2))
    with open('hsr_dry_waste_coords.json', 'w') as f:
        json.dump(hsr_points, f, indent=2)

if __name__ == '__main__':
    main()
