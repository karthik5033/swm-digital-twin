import json

# HSR Layout bounds
MIN_LON = 77.622725
MAX_LON = 77.669342
MIN_LAT = 12.897941
MAX_LAT = 12.931016

files = [
    ('dry_waste_centres', 
     '../public/data/dry_waste_centres.geojson',
     '../public/data/hsr_dry_waste_centres.geojson'),
    ('methane_plants',
     '../public/data/methane_plants.geojson', 
     '../public/data/hsr_methane_plants.geojson'),
    ('dumpyards',
     '../public/data/dump_sites.json',
     '../public/data/hsr_dumpyards.geojson'),
]

for name, inp, out in files:
    with open(inp) as f:
        data = json.load(f)
    
    filtered = []
    
    if isinstance(data, dict) and 'features' in data:
        # GeoJSON FeatureCollection
        filtered = [
            feat for feat in data['features']
            if (
                feat.get('geometry') and 
                feat['geometry'].get('type') == 'Point'
                and MIN_LON <= feat['geometry']['coordinates'][0] <= MAX_LON
                and MIN_LAT <= feat['geometry']['coordinates'][1] <= MAX_LAT
            )
        ]
    elif isinstance(data, list):
        # Flat JSON Array with lat/lon
        for item in data:
            if 'lat' in item and 'lon' in item:
                if MIN_LON <= item['lon'] <= MAX_LON and MIN_LAT <= item['lat'] <= MAX_LAT:
                    filtered.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [item['lon'], item['lat']]
                        },
                        "properties": item
                    })
    
    result = {
        'type': 'FeatureCollection',
        'features': filtered
    }
    
    with open(out, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"{name}: {len(filtered)} points")
