import shapefile
import json
import struct

SHP_PATH = r'c:\Users\Kishan Shetty\Downloads\AstraSky-maing\DS\Waste methane dumpyards centers\Dry Waste Collection,Waste Processing & Landfill Locations\BBMP_Dry_Waste_Collection_Centres.shp'
WARD_PATH = r'c:\Users\Kishan Shetty\Downloads\AstraSky-maing\public\data\hsr_ward_boundary.geojson'

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
    # Load HSR ward polygon
    with open(WARD_PATH, 'r') as f:
        ward = json.load(f)
    feature = ward['features'][0]
    polygon = feature['geometry']['coordinates'][0]  # outer ring
    
    print(f"Ward polygon has {len(polygon)} vertices")
    xs = [p[0] for p in polygon]
    ys = [p[1] for p in polygon]
    print(f"Bounds: lon [{min(xs):.5f}, {max(xs):.5f}] lat [{min(ys):.5f}, {max(ys):.5f}]")
    
    # Read shapefile
    sf = shapefile.Reader(SHP_PATH)
    records = sf.shapeRecords()
    print(f"\nTotal BBMP DWCC points: {len(records)}")
    
    inside_points = []
    for idx, sr in enumerate(records):
        pt = sr.shape.points[0]
        lon, lat = pt[0], pt[1]
        if point_in_polygon(lon, lat, polygon):
            inside_points.append({"idx": idx, "lat": round(lat, 6), "lon": round(lon, 6)})
    
    print(f"\n=== DWCC points INSIDE HSR Layout ward boundary: {len(inside_points)} ===")
    for i, p in enumerate(inside_points):
        print(f"  {i+1}. lat={p['lat']}, lon={p['lon']}")
    
    # Save
    with open('exact_hsr_dwcc.json', 'w') as f:
        json.dump(inside_points, f, indent=2)

if __name__ == '__main__':
    main()
