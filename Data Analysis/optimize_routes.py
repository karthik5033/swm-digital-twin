import json
import math

# ── Data ──────────────────────────────────────────────────────────────────────

ZONE_PATH = r'c:\Users\Kishan Shetty\Downloads\AstraSky-maing\public\data\zone_analysis.json'
OUTPUT_PATH = r'c:\Users\Kishan Shetty\Downloads\AstraSky-maing\public\data\optimized_routes.json'

# 4 verified DWCC locations inside HSR Layout
DWCC = [
    {"id": "DWCC-001", "lat": 12.91263,  "lon": 77.649028, "name": "DWCC Sector 2 East"},
    {"id": "DWCC-002", "lat": 12.922184, "lon": 77.646882, "name": "DWCC Sector 3 Central"},
    {"id": "DWCC-003", "lat": 12.91811,  "lon": 77.64545,  "name": "DWCC Sector 2 West"},
    {"id": "DWCC-004", "lat": 12.912182, "lon": 77.647549, "name": "DWCC Sector 1 East"},
]

# HSR Layout approximate sector bounding boxes [min_lon, min_lat, max_lon, max_lat]
SECTORS = {
    "Sector 1": [77.622, 12.897, 77.635, 12.912],
    "Sector 2": [77.635, 12.897, 77.650, 12.912],
    "Sector 3": [77.635, 12.912, 77.655, 12.925],
    "Sector 4": [77.622, 12.912, 77.635, 12.925],
    "Sector 5": [77.655, 12.897, 77.670, 12.912],
    "Sector 6": [77.655, 12.912, 77.670, 12.930],
    "Sector 7": [77.622, 12.925, 77.655, 12.945],
}

def haversine(lat1, lon1, lat2, lon2):
    """Distance in km between two lat/lon points."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def nearest_dwcc(center_lon, center_lat):
    """Return nearest DWCC and distance for a zone center."""
    best = None
    best_dist = float('inf')
    for d in DWCC:
        dist = haversine(center_lat, center_lon, d["lat"], d["lon"])
        if dist < best_dist:
            best_dist = dist
            best = d
    return best, round(best_dist, 3)

def get_sector(lon, lat):
    """Return the sector name for a given coordinate."""
    for name, (min_lon, min_lat, max_lon, max_lat) in SECTORS.items():
        if min_lon <= lon <= max_lon and min_lat <= lat <= max_lat:
            return name
    return "Unknown"

def straight_line_route(from_lon, from_lat, to_lon, to_lat):
    """Generate a simple straight-line route with intermediate waypoints."""
    steps = 4
    coords = []
    for i in range(steps + 1):
        t = i / steps
        coords.append([
            round(from_lon + t * (to_lon - from_lon), 6),
            round(from_lat + t * (to_lat - from_lat), 6)
        ])
    return coords

def main():
    with open(ZONE_PATH, 'r') as f:
        zone_data = json.load(f)

    zones = zone_data.get('zones', [])
    print(f"Total zones: {len(zones)}")

    # Assign zones to sectors and DWCCs
    sector_groups = {s: [] for s in SECTORS}
    sector_groups["Unknown"] = []

    zone_assignments = []
    for z in zones:
        center_lon, center_lat = z['center'][0], z['center'][1]
        sector = get_sector(center_lon, center_lat)
        nearest, dist_km = nearest_dwcc(center_lon, center_lat)
        
        assignment = {
            "zone_id": z['zone_id'],
            "sector": sector,
            "center": z['center'],
            "waste_kg_day": round(z.get('waste_kg_day', 0), 1),
            "nearest_dwcc": nearest['id'],
            "dwcc_name": nearest['name'],
            "distance_km": dist_km,
            "vehicles_needed": max(1, math.ceil(z.get('waste_kg_day', 0) / 500)),
            "route": straight_line_route(center_lon, center_lat, nearest['lon'], nearest['lat'])
        }
        zone_assignments.append(assignment)
        if sector in sector_groups:
            sector_groups[sector].append(assignment)

    # Per-sector summary
    sector_summary = []
    for sector_name, zones_in_sector in sector_groups.items():
        if not zones_in_sector:
            continue
        
        total_waste = sum(z['waste_kg_day'] for z in zones_in_sector)
        total_vehicles = sum(z['vehicles_needed'] for z in zones_in_sector)
        
        # Find dominant DWCC for this sector
        dwcc_counts = {}
        for z in zones_in_sector:
            dwcc_counts[z['nearest_dwcc']] = dwcc_counts.get(z['nearest_dwcc'], 0) + 1
        primary_dwcc_id = max(dwcc_counts, key=dwcc_counts.get)
        primary_dwcc = next(d for d in DWCC if d['id'] == primary_dwcc_id)
        
        avg_dist = round(sum(z['distance_km'] for z in zones_in_sector) / len(zones_in_sector), 2)
        
        # Collect all zone centers for this sector as a combined route
        # Sort zones west→east (by lon) for logical traversal
        sorted_zones = sorted(zones_in_sector, key=lambda z: z['center'][0])
        combined_route_coords = [z['center'] for z in sorted_zones]
        combined_route_coords.append([primary_dwcc['lon'], primary_dwcc['lat']])

        sector_summary.append({
            "sector": sector_name,
            "zone_count": len(zones_in_sector),
            "total_waste_kg_day": round(total_waste, 1),
            "total_waste_tons_day": round(total_waste / 1000, 2),
            "primary_dwcc": primary_dwcc_id,
            "primary_dwcc_name": primary_dwcc['name'],
            "primary_dwcc_lat": primary_dwcc['lat'],
            "primary_dwcc_lon": primary_dwcc['lon'],
            "vehicles_needed": total_vehicles,
            "avg_distance_to_dwcc_km": avg_dist,
            "route_coords": combined_route_coords
        })

    # Final output
    output = {
        "dwcc_locations": DWCC,
        "sector_routes": sector_summary,
        "zone_assignments": zone_assignments,
        "summary": {
            "total_zones": len(zones),
            "total_waste_kg_day": round(sum(z.get('waste_kg_day', 0) for z in zones), 1),
            "total_vehicles_needed": sum(z['vehicles_needed'] for z in zone_assignments),
            "dwcc_count": len(DWCC)
        }
    }

    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\n=== Route Optimization Complete ===")
    print(f"Zones optimized: {len(zone_assignments)}")
    print(f"Output: {OUTPUT_PATH}\n")
    print(f"{'Sector':<12} {'Zones':>6} {'Waste(kg/day)':>14} {'Vehicles':>9} {'Closest DWCC':<15} {'Avg Dist(km)':>13}")
    print("-" * 75)
    for s in sorted(sector_summary, key=lambda x: x['sector']):
        print(f"{s['sector']:<12} {s['zone_count']:>6} {s['total_waste_kg_day']:>14.1f} {s['vehicles_needed']:>9} {s['primary_dwcc']:<15} {s['avg_distance_to_dwcc_km']:>13.2f}")

if __name__ == '__main__':
    main()
