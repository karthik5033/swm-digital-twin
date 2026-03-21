import json

# HSR Layout approx bounds: 
min_lat = 12.895
max_lat = 12.937
min_lon = 77.620
max_lon = 77.675

ROWS = 14
COLS = 14

lat_step = (max_lat - min_lat) / ROWS
lon_step = (max_lon - min_lon) / COLS

with open('public/data/buildings.geojson', 'r') as f:
    bldgs = json.load(f)

# Scaling factors
# Current total waste in bldgs.geojson is around 12,250 kg. Target is 110,000 kg.
TARGET_WASTE = 110000
TARGET_POP = 220000

# First pass: find base waste
base_total_waste = 0
for f in bldgs.get('features', []):
    base_total_waste += f['properties'].get('waste_kg_day', 0)

scaler = TARGET_WASTE / base_total_waste
pop_scaler = TARGET_POP / base_total_waste  # population per base waste to sum to 220k

zones = []
features = bldgs.get('features', [])

zone_counts = 0

for r in range(ROWS):
    for c in range(COLS):
        z_min_lat = min_lat + r * lat_step
        z_max_lat = z_min_lat + lat_step
        z_min_lon = min_lon + c * lon_step
        z_max_lon = z_min_lon + lon_step
        
        # Accumulate metrics
        waste = 0
        res = 0
        com = 0
        
        for f in features:
            coords = f['geometry']['coordinates']
            lon = coords[0]
            lat = coords[1]
            if z_min_lat <= lat <= z_max_lat and z_min_lon <= lon <= z_max_lon:
                base_w = f['properties'].get('waste_kg_day', 0)
                waste += (base_w * scaler)
                type_b = f['properties'].get('type', '')
                if 'residential' in type_b.lower():
                    res += 1
                else:
                    com += 1
        
        total_bldgs = res + com
        
        # Only keep cells that actually have buildings in them
        if total_bldgs > 0:
            zone_counts += 1
            
            risk = 'low'
            if waste > 1000: risk = 'medium'
            if waste > 2500: risk = 'high'
            
            # Recalibrate pop
            pop = int(waste * (TARGET_POP / TARGET_WASTE))
            
            zones.append({
                "zone_id": f"{chr(65+(r%26))}{c+1}",
                "bounds": [z_min_lon, z_min_lat, z_max_lon, z_max_lat],
                "center": [(z_min_lon + z_max_lon)/2, (z_min_lat + z_max_lat)/2],
                "residential_count": res,
                "commercial_count": com,
                "population_estimate": pop,
                "waste_kg_day": round(waste, 1),
                "risk": risk
            })

print(f"Generated {len(zones)} active zones inside HSR Layout. Scaled to 110 tons.")

with open('public/data/zone_analysis.json', 'r') as f:
    old_data = json.load(f)

old_data['zones'] = zones

with open('public/data/zone_analysis.json', 'w') as f:
    json.dump(old_data, f, indent=2)
