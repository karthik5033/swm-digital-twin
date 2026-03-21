import geopandas as gpd
import json
import os

BASE = "data/spaceTech Dataset"
OUTPUT = f"{BASE}/output"

# ── VERIFIED CONSTANTS ──
AREA_SQ_KM = 18.5
TOTAL_BUILDINGS = 9471
TOTAL_ROAD_SEGMENTS = 2027

# Corrected densities
BUILDING_DENSITY = round(
    TOTAL_BUILDINGS / AREA_SQ_KM, 1
)  # = 512/km²
ROAD_DENSITY = round(
    TOTAL_ROAD_SEGMENTS / AREA_SQ_KM, 1
)  # = 110/km²

# Road type breakdown (real data)
road_types = {
    'trunk':       {'count': 38,  'pct': 1.9,
                    'vehicle': 'Large Truck'},
    'primary':     {'count': 10,  'pct': 0.5,
                    'vehicle': 'Large Truck'},
    'secondary':   {'count': 113, 'pct': 5.6,
                    'vehicle': 'Truck'},
    'tertiary':    {'count': 191, 'pct': 9.4,
                    'vehicle': 'Truck'},
    'residential': {'count': 840, 'pct': 41.4,
                    'vehicle': 'Auto Rickshaw'},
    'service':     {'count': 179, 'pct': 8.8,
                    'vehicle': 'Auto Rickshaw'},
    'footway':     {'count': 509, 'pct': 25.1,
                    'vehicle': 'Walk/Handcart'},
    'path':        {'count': 51,  'pct': 2.5,
                    'vehicle': 'Walk/Handcart'},
}

truck_segments = 38 + 10 + 113 + 191  # = 352
auto_segments  = 840 + 179 + 509 + 51 # = 1579
total_covered  = truck_segments + auto_segments

# Building type breakdown (real OSM)
building_types = {
    'Residential (House)':    {'count': 8998, 'pct': 95.0},
    'Residential (Apartment)':{'count': 250,  'pct': 2.6},
    'Commercial/Retail':      {'count': 137,  'pct': 1.4},
    'Office/IT':              {'count': 39,   'pct': 0.4},
    'Educational':            {'count': 15,   'pct': 0.2},
    'Religious':              {'count': 10,   'pct': 0.1},
    'Hospital/Medical':       {'count': 2,    'pct': 0.0},
    'Government/Civic':       {'count': 3,    'pct': 0.0},
    'Other':                  {'count': 17,   'pct': 0.2},
}

# Building area stats (real)
building_area_stats = {
    'average_sqm':        163,
    'median_sqm':         114.8,
    'largest_sqm':        5836,
    'total_footprint_ha': 154.4
}

# Population & waste
POPULATION_2011 = 63033
GROWTH_RATE     = 0.045
YEARS           = 14
POPULATION_2025 = 115000
WASTE_PER_CAPITA = 0.5
DAILY_WASTE_KG   = POPULATION_2025 * WASTE_PER_CAPITA
DAILY_WASTE_TONS = DAILY_WASTE_KG / 1000

corrected_data = {
    "ward": "HSR Layout",
    "city": "Bengaluru",
    "ward_number": "174",
    "last_updated": "2025",
    
    "area": {
        "sq_km": AREA_SQ_KM,
        "hectares": AREA_SQ_KM * 100,
        "note": "From HSR_Layout_SD.tif coverage"
    },
    
    "population": {
        "census_2011": POPULATION_2011,
        "male_2011": 93782,
        "female_2011": 82413,
        "growth_rate_pct": GROWTH_RATE * 100,
        "projection_year": 2025,
        "population_2025": POPULATION_2025,
        "density_per_sqkm": round(
            POPULATION_2025 / AREA_SQ_KM
        ),
        "source": "Census 2011 Ward 174 + 4.5% growth"
    },
    
    "waste": {
        "per_capita_kg_day": WASTE_PER_CAPITA,
        "total_kg_day": DAILY_WASTE_KG,
        "total_tons_day": DAILY_WASTE_TONS,
        "wet_kg_day": DAILY_WASTE_KG * 0.60,
        "dry_kg_day": DAILY_WASTE_KG * 0.35,
        "other_kg_day": DAILY_WASTE_KG * 0.05,
        "standard": "CPCB Municipal Solid Waste"
    },
    
    "buildings": {
        "total": TOTAL_BUILDINGS,
        "density_per_sqkm": BUILDING_DENSITY,
        "type_breakdown": building_types,
        "area_stats": building_area_stats,
        "source": "OpenStreetMap buildings_osm.geojson"
    },
    
    "roads": {
        "total_segments": TOTAL_ROAD_SEGMENTS,
        "density_per_sqkm": ROAD_DENSITY,
        "type_breakdown": road_types,
        "two_tier_system": {
            "truck_accessible": {
                "segments": truck_segments,
                "percentage": 17.4,
                "types": ["trunk","primary",
                          "secondary","tertiary"]
            },
            "auto_accessible": {
                "segments": auto_segments,
                "percentage": 77.9,
                "types": ["residential","service",
                          "footway","path"]
            },
            "total_coverage_pct": round(
                total_covered / 
                TOTAL_ROAD_SEGMENTS * 100, 1
            )
        },
        "source": "OpenStreetMap hsr_road_network.geojson"
    },
    
    "infrastructure": {
        "dwcc_centers": 16,
        "bio_methanisation_units": 2,
        "dumpyards": 0,
        "sectors": 7
    },
    
    "satellite": {
        "image": "HSR_Layout_SD.tif",
        "size_pixels": "1002x740",
        "bands": 3,
        "size_mb": 4.25
    }
}

# Save corrected data
out_path = f"{OUTPUT}/hsr_corrected_data.json"
os.makedirs(OUTPUT, exist_ok=True)
with open(out_path, 'w') as f:
    json.dump(corrected_data, f, indent=2)
print(f"Saved: {out_path}")

# Copy to public/data
import shutil
dest = "public/data/hsr_corrected_data.json"
os.makedirs("public/data", exist_ok=True)
shutil.copy(out_path, dest)
print(f"Copied to: {dest}")

print("\n=== CORRECTED DATA SUMMARY ===")
print(f"Area:              {AREA_SQ_KM} sq km")
print(f"Buildings:         {TOTAL_BUILDINGS:,}")
print(f"Building density:  {BUILDING_DENSITY}/sq km")
print(f"Road segments:     {TOTAL_ROAD_SEGMENTS:,}")
print(f"Road density:      {ROAD_DENSITY}/sq km")
print(f"Truck roads:       {truck_segments} (17.4%)")
print(f"Auto roads:        {auto_segments} (77.9%)")
print(f"Coverage:          {total_covered/TOTAL_ROAD_SEGMENTS*100:.1f}%")
print(f"Population 2025:   {POPULATION_2025:,}")
print(f"Daily waste:       {DAILY_WASTE_TONS:.1f} tons")
print("==============================")