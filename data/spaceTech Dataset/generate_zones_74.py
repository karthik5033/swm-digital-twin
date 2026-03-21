import geopandas as gpd
import pandas as pd
import numpy as np
import json
import shutil
import os
from shapely.geometry import box, Point
import warnings
warnings.filterwarnings('ignore')

BASE = r"./data/spaceTech Dataset"
OUTPUT = f"{BASE}/output"

# ── Load inputs ──
ward = gpd.read_file(f"{OUTPUT}/hsr_ward_boundary.geojson")
ward = ward.to_crs('EPSG:4326')
ward_proj = ward.to_crs('EPSG:32643')

roads = gpd.read_file(f"{OUTPUT}/hsr_road_network.geojson")
roads = roads.to_crs('EPSG:4326')

buildings = gpd.read_file(f"{OUTPUT}/buildings.geojson")
buildings = buildings.to_crs('EPSG:4326')

with open(f"{OUTPUT}/building_report.json") as f:
    report = json.load(f)

print(f"Ward loaded: {ward_proj.geometry.area.sum()/1e6:.2f} km²")
print(f"Buildings loaded: {len(buildings)}")

# ════════════════════════════════
# VERIFIED REAL DATA — HSR LAYOUT
# ════════════════════════════════

# Area (from OSM boundary)
AREA_SQ_KM = 7.04
AREA_HECTARES = 704

# Buildings (from buildings_osm.geojson)
TOTAL_BUILDINGS_OSM = 9471
BUILDING_DENSITY_PER_SQKM = 1345

# Roads (from hsr_road_network.geojson)
TOTAL_ROAD_SEGMENTS = 2027
ROAD_DENSITY_PER_SQKM = 288

# Population
# Source: Census 2011 Ward 174 = 63,033
# Growth: 4.5%/year (Bengaluru avg)
# Projection: 2011 → 2025 = 14 years
POPULATION_CENSUS_2011 = 63033
GROWTH_RATE = 0.045
YEARS = 14
POPULATION_2025 = int(
    POPULATION_CENSUS_2011 * 
    ((1 + GROWTH_RATE) ** YEARS)
)
# = ~1,15,000
POPULATION_FOR_WASTE = 115000

# Sectors
SECTORS = 7

# Waste (CPCB standard)
WASTE_PER_CAPITA_KG = 0.5
DAILY_WASTE_KG = POPULATION_FOR_WASTE * WASTE_PER_CAPITA_KG
# = 57,500 kg
DAILY_WASTE_TONS = DAILY_WASTE_KG / 1000
# = 57.5 tons

WET_PCT   = 0.60  # BBMP standard
DRY_PCT   = 0.35
OTHER_PCT = 0.05

WASTE_WET_KG   = DAILY_WASTE_KG * WET_PCT
WASTE_DRY_KG   = DAILY_WASTE_KG * DRY_PCT
WASTE_OTHER_KG = DAILY_WASTE_KG * OTHER_PCT

print("=== VERIFIED DATA CONSTANTS ===")
print(f"Area:             {AREA_SQ_KM} sq km")
print(f"Buildings:        {TOTAL_BUILDINGS_OSM:,}")
print(f"Building density: {BUILDING_DENSITY_PER_SQKM}/sq km")
print(f"Road segments:    {TOTAL_ROAD_SEGMENTS:,}")
print(f"Road density:     {ROAD_DENSITY_PER_SQKM}/sq km")
print(f"Population 2011:  {POPULATION_CENSUS_2011:,}")
print(f"Population 2025:  {POPULATION_2025:,}")
print(f"Daily waste:      {DAILY_WASTE_TONS:.1f} tons")
print(f"  Wet (60%):      {WASTE_WET_KG/1000:.1f} tons")
print(f"  Dry (35%):      {WASTE_DRY_KG/1000:.1f} tons")
print(f"  Other (5%):     {WASTE_OTHER_KG/1000:.1f} tons")
print("================================")

# ── STEP 1: Create 500m grid ──
bounds = ward_proj.total_bounds
GRID = 500  # meters

cols = np.arange(bounds[0], bounds[2], GRID)
rows = np.arange(bounds[1], bounds[3], GRID)

cells, ids = [], []
i = 1
for x in cols:
    for y in rows:
        cell = box(x, y, x+GRID, y+GRID)
        if cell.intersects(ward_proj.geometry.iloc[0]):
            clipped = cell.intersection(
                ward_proj.geometry.iloc[0]
            )
            if not clipped.is_empty and clipped.area > 10000:
                cells.append(clipped)
                ids.append(f"Z{i:02d}")
                i += 1

grid_proj = gpd.GeoDataFrame(
    {'zone_id': ids, 'geometry': cells},
    crs='EPSG:32643'
)
grid = grid_proj.to_crs('EPSG:4326')
print(f"Zones created: {len(grid)}")

# ── STEP 2: Buildings per zone ──
total_osm = report['total_buildings']  # 9483
res_h_ratio = report['type_summary'].get(
    'Residential (House)', 0) / total_osm
res_a_ratio = report['type_summary'].get(
    'Residential (Apartment)', 0) / total_osm
com_ratio = report['type_summary'].get(
    'Commercial/Retail', 0) / total_osm

joined = gpd.sjoin(
    buildings, grid,
    how='inner', predicate='within'
)
counts = joined.groupby('zone_id').size().reset_index(
    name='detected'
)
grid = grid.merge(counts, on='zone_id', how='left')
grid['detected'] = grid['detected'].fillna(0).astype(int)

# Scale satellite detections to OSM total
scale = total_osm / max(len(buildings), 1)
grid['total_buildings'] = (
    grid['detected'] * scale
).round().astype(int).clip(lower=1)

grid['res_buildings'] = (
    grid['total_buildings'] * (res_h_ratio + res_a_ratio)
).round().astype(int)
grid['com_buildings'] = (
    grid['total_buildings'] * com_ratio
).round().astype(int)

# ── STEP 3: Population — CPCB method ──
PEOPLE_HOUSE = 4.0
PEOPLE_APT = 35.0

def pop_estimate(total_b):
    houses = total_b * res_h_ratio
    apts = total_b * res_a_ratio
    return max(round(
        houses * PEOPLE_HOUSE + apts * PEOPLE_APT
    ), 10)

grid['population'] = grid['total_buildings'].apply(
    pop_estimate
)

# Calibrate to verified population
CALIBRATION_TARGET = POPULATION_FOR_WASTE

current_total = grid['population'].sum()
print(f"Pre-calibration population: {current_total:,}")
calibration_factor = CALIBRATION_TARGET / current_total
grid['population'] = (
    grid['population'] * calibration_factor
).round().astype(int)
print(f"Calibrated population: "
      f"{grid['population'].sum():,}")

# ── STEP 4: Waste — CPCB 0.5 kg/person/day ──
# Using constants defined above

grid['waste_residential_kg'] = (
    grid['population'] * WASTE_PER_CAPITA_KG
).round(1)
grid['waste_commercial_kg'] = (
    grid['com_buildings'] * 2.5
).round(1)
grid['waste_total_kg'] = (
    grid['waste_residential_kg'] +
    grid['waste_commercial_kg']
).round(1)
grid['waste_wet_kg'] = (
    grid['waste_total_kg'] * WET_PCT
).round(1)
grid['waste_dry_kg'] = (
    grid['waste_total_kg'] * DRY_PCT
).round(1)
grid['waste_other_kg'] = (
    grid['waste_total_kg'] * OTHER_PCT
).round(1)

# ── STEP 5: Risk classification ──
p75 = grid['waste_total_kg'].quantile(0.75)
p40 = grid['waste_total_kg'].quantile(0.40)

grid['risk'] = grid['waste_total_kg'].apply(
    lambda w: 'high' if w >= p75
    else ('medium' if w >= p40 else 'low')
)
grid['collection_frequency'] = grid['risk'].map({
    'high': 'daily',
    'medium': 'alternate',
    'low': 'weekly'
})

# ── STEP 6: Assign DWCC centers ──
dwcc = [
    {'id':'DWCC_01','lat':12.9280,'lon':77.6320},
    {'id':'DWCC_02','lat':12.9220,'lon':77.6380},
    {'id':'DWCC_03','lat':12.9180,'lon':77.6440},
    {'id':'DWCC_04','lat':12.9150,'lon':77.6510},
    {'id':'DWCC_05','lat':12.9120,'lon':77.6380},
    {'id':'DWCC_06','lat':12.9090,'lon':77.6450},
    {'id':'DWCC_07','lat':12.9060,'lon':77.6520},
    {'id':'DWCC_08','lat':12.9140,'lon':77.6580},
    {'id':'DWCC_09','lat':12.9260,'lon':77.6420},
    {'id':'DWCC_10','lat':12.9200,'lon':77.6500},
    {'id':'DWCC_11','lat':12.9170,'lon':77.6350},
    {'id':'DWCC_12','lat':12.9080,'lon':77.6380},
    {'id':'DWCC_13','lat':12.9130,'lon':77.6600},
    {'id':'DWCC_14','lat':12.9200,'lon':77.6560},
    {'id':'DWCC_15','lat':12.9100,'lon':77.6640},
    {'id':'DWCC_16','lat':12.9240,'lon':77.6460},
]
bmu = [
    {'id':'BMU_01','lat':12.9160,'lon':77.6410},
    {'id':'BMU_02','lat':12.9200,'lon':77.6480},
]

def nearest(centroid, centers):
    return min(centers, key=lambda c: (
        (centroid.y-c['lat'])**2 +
        (centroid.x-c['lon'])**2
    ))['id']

centroids = grid.geometry.centroid
grid['assigned_dwcc'] = [
    nearest(c, dwcc) for c in centroids
]
grid['assigned_bmu'] = [
    nearest(c, bmu) for c in centroids
]

# ── STEP 7: Save output ──
zones_list = []
for _, row in grid.iterrows():
    b = row.geometry.bounds
    c = row.geometry.centroid
    zones_list.append({
        "zone_id": row['zone_id'],
        "bounds": [
            round(b[0],6), round(b[1],6),
            round(b[2],6), round(b[3],6)
        ],
        "center": [round(c.x,6), round(c.y,6)],
        "area_ha": round(
            row.geometry.area * 111320**2 / 10000, 2
        ),
        "population": int(row['population']),
        "buildings_total": int(row['total_buildings']),
        "buildings_residential": int(row['res_buildings']),
        "buildings_commercial": int(row['com_buildings']),
        "waste_total_kg": float(row['waste_total_kg']),
        "waste_wet_kg": float(row['waste_wet_kg']),
        "waste_dry_kg": float(row['waste_dry_kg']),
        "waste_other_kg": float(row['waste_other_kg']),
        "waste_per_capita_kg": round(
            row['waste_total_kg'] /
            max(row['population'], 1), 3
        ),
        "assigned_dwcc": row['assigned_dwcc'],
        "assigned_methanisation": row['assigned_bmu'],
        "risk": row['risk'],
        "collection_frequency": row['collection_frequency']
    })

output = {
    "ward": "HSR Layout",
    "city": "Bengaluru",
    "total_zones": len(zones_list),
    "grid_size_m": 500,
    "method": "CPCB 0.5kg/person/day",
    "census_data": {
        "population_census_2011": POPULATION_CENSUS_2011,
        "ward_number": "174",
        "growth_rate_pct": GROWTH_RATE * 100,
        "projection_year": 2025,
        "population_2025": POPULATION_FOR_WASTE,
        "area_sq_km": AREA_SQ_KM,
        "area_hectares": AREA_HECTARES,
        "building_density_per_sqkm": BUILDING_DENSITY_PER_SQKM,
        "road_density_per_sqkm": ROAD_DENSITY_PER_SQKM,
        "sectors": SECTORS,
        "source": "Census 2011 Ward 174 + Beegru.com 2025"
    },
    "waste_methodology": {
        "standard": "CPCB",
        "rate_kg_per_person_per_day": WASTE_PER_CAPITA_KG,
        "wet_pct": int(WET_PCT * 100),
        "dry_pct": int(DRY_PCT * 100),
        "other_pct": int(OTHER_PCT * 100),
        "total_daily_kg": DAILY_WASTE_KG,
        "total_daily_tons": DAILY_WASTE_TONS,
        "reference": "CPCB Municipal Solid Waste Guidelines"
    },
    "population_total": int(grid['population'].sum()),
    "waste_total_kg_day": round(
        grid['waste_total_kg'].sum(), 1
    ),
    "waste_wet_kg_day": round(
        grid['waste_wet_kg'].sum(), 1
    ),
    "waste_dry_kg_day": round(
        grid['waste_dry_kg'].sum(), 1
    ),
    "infrastructure": {
        "dwcc_centers": 16,
        "bio_methanisation_units": 2,
        "dumpyards": 0
    },
    "risk_summary": {
        "high": int((grid['risk']=='high').sum()),
        "medium": int((grid['risk']=='medium').sum()),
        "low": int((grid['risk']=='low').sum())
    },
    "zones": zones_list
}

# Save to output folder
out_path = f"{OUTPUT}/zones_74.json"
with open(out_path, 'w') as f:
    json.dump(output, f, indent=2)
print(f"Saved: {out_path}")

# Copy to Next.js public/data/
dest = "./public/data/zones_74.json"
os.makedirs(os.path.dirname(dest), exist_ok=True)
shutil.copy(out_path, dest)
print(f"Copied to: {dest}")

# Print summary
print("\n=== ZONES GENERATED ===")
print(f"Total zones: {len(zones_list)}")
print(f"Population: {grid['population'].sum():,}")
print(f"Daily waste: "
      f"{grid['waste_total_kg'].sum():.1f} kg")
print(f"  Wet 60%: "
      f"{grid['waste_wet_kg'].sum():.1f} kg")
print(f"  Dry 35%: "
      f"{grid['waste_dry_kg'].sum():.1f} kg")
print(f"Risk — High: "
      f"{(grid['risk']=='high').sum()} | "
      f"Medium: {(grid['risk']=='medium').sum()} | "
      f"Low: {(grid['risk']=='low').sum()}")
print("======================")
