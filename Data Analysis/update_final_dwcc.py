import json

OUTPUT_JSON = r'c:\Users\Kishan Shetty\Downloads\AstraSky-maing\public\data\dump_sites.json'

points = [
    {"lat": 12.94994, "lon": 77.62090},
    {"lat": 12.91263, "lon": 77.64903},
    {"lat": 12.91763, "lon": 77.62258},
    {"lat": 12.92218, "lon": 77.64688},
    {"lat": 12.91811, "lon": 77.64545},
    {"lat": 12.91218, "lon": 77.64755},
    {"lat": 12.90536, "lon": 77.63312},
    {"lat": 12.94419, "lon": 77.62704}
]

def main():
    coords = []
    for idx, pt in enumerate(points):
        coords.append({
            "id": f"DUMP-{idx+1:03d}",
            "lat": pt["lat"],
            "lon": pt["lon"],
            "risk": "high" if idx % 2 == 0 else "medium",
            "area_sqm": 500.0,
            "pixel_count": 10,
            "detected": "BBMP Final Setup",
            "ward": "HSR Layout"
        })

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(coords, f, indent=2)
    print(f"Overwrote {OUTPUT_JSON} with {len(coords)} points.")

if __name__ == '__main__':
    main()
