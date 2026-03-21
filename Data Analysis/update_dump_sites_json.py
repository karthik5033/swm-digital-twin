import re
import json

REPORT_PATH = r'c:\Users\Kishan Shetty\Downloads\AstraSky-maing\Data Analysis\BBMP_Ward_Level_Waste_Report.md'
OUTPUT_JSON = r'c:\Users\Kishan Shetty\Downloads\AstraSky-maing\public\data\dump_sites.json'

def main():
    with open(REPORT_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the HSR Layout section
    match = re.search(r'### 🛡️ Ward Unknown - HSR Layout\s+(.+?)\s+---', content, re.DOTALL)
    if not match:
        print("Could not find HSR Layout section in report.")
        return

    section = match.group(1)
    
    # Extract coordinates
    coords = []
    # Pattern: - Dry Waste Collection Centres: `12.943930°N, 77.600470°E`
    matches = re.findall(r'- Dry Waste Collection Centres:\s+`([\d.]+)°N,\s+([\d.]+)°E`', section)
    for idx, (lat, lon) in enumerate(matches):
        coords.append({
            "id": f"DUMP-{idx+1:03d}",
            "lat": float(lat),
            "lon": float(lon),
            "risk": "high" if idx % 2 == 0 else "medium", # Mock risk or compute based on vicinity
            "area_sqm": 500.0, # Approximate static
            "pixel_count": 10,
            "detected": "BBMP Setup",
            "ward": "HSR Layout"
        })

    if not coords:
        print("No coords extracted.")
        return

    print(f"Extracted {len(coords)} points.")
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(coords, f, indent=2)
    print(f"File {OUTPUT_JSON} overwritten successfully.")

if __name__ == '__main__':
    main()
