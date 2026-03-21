import geopandas as gpd
import pandas as pd
import numpy as np
import networkx as nx
import json
import os
from shapely.geometry import box, Point, LineString
from shapely.ops import unary_union
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import warnings
warnings.filterwarnings('ignore')

os.makedirs('output/digital_twin', exist_ok=True)

# ════════════════════════════════════
# PHASE 1: DATA PREPARATION & GRID CREATION
# ════════════════════════════════════

# Load all layers
ward = gpd.read_file('output/hsr_ward_boundary.geojson')
roads = gpd.read_file('output/hsr_road_network.geojson')
ward = ward.to_crs('EPSG:4326')
roads = roads.to_crs('EPSG:4326')

# Load processed data
with open('output/zone_analysis.json') as f:
    zone_data = json.load(f)
with open('output/building_report.json') as f:
    building_data = json.load(f)
with open('output/dump_sites.json') as f:
    dump_sites = json.load(f)
with open('output/lulc_classification.json') as f:
    lulc_data = json.load(f)

print("=== PHASE 1: DATA PREPARATION ===")
print(f"Ward area: {ward.geometry.area.sum() * 111320**2 / 10000:.1f} ha")
print(f"Road segments: {len(roads)}")
print(f"Dump sites: {len(dump_sites)}")

# Create 400m analysis grid
bounds = ward.total_bounds
minx, miny, maxx, maxy = bounds

grid_size = 0.004  # ~400m in degrees

cols = np.arange(minx, maxx, grid_size)
rows = np.arange(miny, maxy, grid_size)

grid_cells = []
cell_ids = []
i = 0
for x in cols:
    for y in rows:
        cell = box(x, y, x + grid_size, y + grid_size)
        if cell.intersects(ward.geometry.iloc[0]):
            clipped = cell.intersection(ward.geometry.iloc[0])
            if not clipped.is_empty:
                grid_cells.append(clipped)
                cell_ids.append(f"G{i:03d}")
                i += 1

grid = gpd.GeoDataFrame({
    'cell_id': cell_ids,
    'geometry': grid_cells
}, crs='EPSG:4326')

print(f"Grid cells created: {len(grid)}")

# ════════════════════════════════════
# PHASE 2: FEATURE ENGINEERING PER GRID CELL
# ════════════════════════════════════

print("\n=== PHASE 2: FEATURE ENGINEERING ===")

# Road type weights
road_weights = {
    'trunk': 5, 'primary': 4, 'secondary': 3,
    'tertiary': 2, 'residential': 2,
    'footway': 0, 'path': 0, 'steps': 0,
    'service': 1, 'unclassified': 1, 'way': 2
}

def get_road_weight(osm_type):
    if pd.isna(osm_type):
        return 1
    t = str(osm_type).lower()
    return road_weights.get(t, 1)

roads['weight'] = roads['osm_type'].apply(get_road_weight)
roads_proj = roads.to_crs('EPSG:32643')

# For each grid cell compute features
features = []

for idx, cell in grid.iterrows():
    cell_geom = cell.geometry
    cell_proj = gpd.GeoDataFrame(
        [{'geometry': cell_geom}], crs='EPSG:4326'
    ).to_crs('EPSG:32643').geometry.iloc[0]
    cell_area_ha = cell_proj.area / 10000

    # Roads intersecting this cell
    cell_roads = roads[roads.geometry.intersects(cell_geom)].copy()

    # Accessibility score (weighted road types)
    if len(cell_roads) > 0:
        accessibility_score = cell_roads['weight'].mean()
        road_count = len(cell_roads)
        road_density = road_count / max(cell_area_ha, 0.1)
        has_major_road = int(cell_roads['weight'].max() >= 4)
        has_trunk = int(
            cell_roads['osm_type'].str.lower().str.contains(
                'trunk|primary', na=False
            ).any()
        )
    else:
        accessibility_score = 0
        road_count = 0
        road_density = 0
        has_major_road = 0
        has_trunk = 0

    # Commercial score
    # High density + major roads = commercial
    commercial_score = (
        (road_density * 0.4) +
        (has_major_road * 3.0) +
        (accessibility_score * 0.6)
    )
    commercial_score = min(commercial_score, 10)

    # Zone type classification
    if commercial_score > 5:
        zone_type = 'commercial'
    elif commercial_score > 2.5:
        zone_type = 'mixed'
    else:
        zone_type = 'residential'

    # Population estimate
    # From building_report: 9483 buildings / 704 ha = ~13.5/ha
    buildings_in_cell = max(
        int(cell_area_ha * 13.5), 1
    )
    if zone_type == 'residential':
        population = buildings_in_cell * 4.2
    elif zone_type == 'mixed':
        population = buildings_in_cell * 2.8
    else:
        population = buildings_in_cell * 1.5

    # Traffic score
    traffic_score = accessibility_score * road_density * 0.1
    traffic_score = min(traffic_score, 10)

    # Dump risk score
    # Based on: low accessibility + distance from major roads
    centroid = cell_geom.centroid
    
    # Distance to nearest dump site
    min_dump_dist = 999
    for d in dump_sites:
        dist = centroid.distance(Point(d['lon'], d['lat'])) * 111320
        min_dump_dist = min(min_dump_dist, dist)
    
    # Low accessibility + existing nearby dump = higher risk
    dump_risk = (
        (1 - accessibility_score/5) * 3 +
        (1 if min_dump_dist < 500 else 0) * 2 +
        (1 - has_major_road) * 2 +
        (road_density < 2) * 1
    )
    dump_risk = min(dump_risk / 8 * 10, 10)

    # Waste generation (base, no scenario)
    waste_base = (
        (0.5 * population) +
        (2.0 * commercial_score)
    )

    features.append({
        'cell_id': cell['cell_id'],
        'geometry': cell_geom,
        'centroid_lon': centroid.x,
        'centroid_lat': centroid.y,
        'area_ha': round(cell_area_ha, 3),
        'road_count': road_count,
        'road_density': round(road_density, 2),
        'accessibility_score': round(accessibility_score, 2),
        'has_major_road': has_major_road,
        'has_trunk': has_trunk,
        'commercial_score': round(commercial_score, 2),
        'zone_type': zone_type,
        'population': round(population),
        'traffic_score': round(traffic_score, 2),
        'dump_risk_score': round(dump_risk, 2),
        'waste_base_kg': round(waste_base, 1),
        'buildings_est': buildings_in_cell,
    })

grid_features = gpd.GeoDataFrame(features, crs='EPSG:4326')

print(f"Features computed for {len(grid_features)} grid cells")
print(f"Zone types:")
print(grid_features['zone_type'].value_counts().to_string())
print(f"Total population: {grid_features['population'].sum():,}")
print(f"Base waste: {grid_features['waste_base_kg'].sum():.1f} kg/day")

# Save features CSV
grid_features.drop('geometry', axis=1).to_csv(
    'output/digital_twin/grid_features.csv', index=False
)

# ════════════════════════════════════
# PHASE 3: WASTE PREDICTION MODEL
# Multi-scenario simulation
# ════════════════════════════════════

print("\n=== PHASE 3: WASTE PREDICTION ===")

def predict_waste(row, rainfall=5, temperature=28,
                  festival=False, festival_type='none'):
    P = row['population']
    C = row['commercial_score']
    A = row['accessibility_score']
    D = row['dump_risk_score']

    # Base formula
    waste = (0.45 * P) + (2.0 * C)

    # Rainfall factor
    if rainfall > 10:
        waste *= 1.15
    elif rainfall > 25:
        waste *= 1.30
    elif rainfall < 2:
        waste *= 0.95

    # Temperature factor
    if temperature > 35:
        waste *= 1.08

    # Festival factors
    festival_multipliers = {
        'none': 1.0,
        'diwali': 1.35,
        'ganesh': 1.28,
        'eid': 1.20,
        'christmas': 1.15
    }
    waste *= festival_multipliers.get(festival_type, 1.0)

    # Accessibility penalty
    # Low accessibility = more waste accumulation risk
    if A < 1.5:
        waste *= 1.10

    return round(waste, 1)

# Run 4 scenarios
scenarios = [
    {
        'name': 'baseline',
        'label': 'Normal Day',
        'rainfall': 5,
        'temperature': 28,
        'festival': False,
        'festival_type': 'none'
    },
    {
        'name': 'heavy_rain',
        'label': 'Heavy Rainfall',
        'rainfall': 30,
        'temperature': 24,
        'festival': False,
        'festival_type': 'none'
    },
    {
        'name': 'festival_ganesh',
        'label': 'Ganesh Chaturthi',
        'rainfall': 5,
        'temperature': 28,
        'festival': True,
        'festival_type': 'ganesh'
    },
    {
        'name': 'worst_case',
        'label': 'Rain + Festival',
        'rainfall': 28,
        'temperature': 26,
        'festival': True,
        'festival_type': 'diwali'
    }
]

scenario_results = {}
for sc in scenarios:
    col = f"waste_{sc['name']}_kg"
    grid_features[col] = grid_features.apply(
        lambda row: predict_waste(
            row,
            rainfall=sc['rainfall'],
            temperature=sc['temperature'],
            festival=sc['festival'],
            festival_type=sc['festival_type']
        ), axis=1
    )
    total = grid_features[col].sum()
    scenario_results[sc['name']] = {
        'label': sc['label'],
        'total_kg': round(total, 1),
        'total_tons': round(total/1000, 2),
        'max_zone_kg': round(grid_features[col].max(), 1),
        'high_waste_zones': int((grid_features[col] > 
                                  grid_features[col].quantile(0.75)).sum())
    }
    print(f"  {sc['label']:<25} "
          f"{total/1000:.2f} tons/day  "
          f"(max zone: {grid_features[col].max():.0f} kg)")

# ════════════════════════════════════
# PHASE 4: DUMPYARD SIMULATION
# Fill levels and overflow detection
# ════════════════════════════════════

print("\n=== PHASE 4: DUMPYARD SIMULATION ===")

processing_centers = [
    {
        'id': 'DWC_01',
        'name': 'HSR Dry Waste Centre 1',
        'type': 'dry_waste_centre',
        'lat': 12.9120, 'lon': 77.6380,
        'capacity_kg_day': 2000,
        'current_fill_pct': 45
    },
    {
        'id': 'DWC_02', 
        'name': 'HSR Dry Waste Centre 2',
        'type': 'dry_waste_centre',
        'lat': 12.9220, 'lon': 77.6520,
        'capacity_kg_day': 1800,
        'current_fill_pct': 62
    },
    {
        'id': 'BMU_01',
        'name': 'Bio-Methanisation Unit',
        'type': 'bio_methanisation',
        'lat': 12.9080, 'lon': 77.6450,
        'capacity_kg_day': 3000,
        'current_fill_pct': 38
    },
    {
        'id': 'DY_01',
        'name': 'HSR Dumpyard',
        'type': 'dumpyard',
        'lat': 12.9300, 'lon': 77.6600,
        'capacity_kg_day': 5000,
        'current_fill_pct': 71
    },
    {
        'id': 'TC_01',
        'name': 'Transfer Station North',
        'type': 'transfer_station',
        'lat': 12.9280, 'lon': 77.6350,
        'capacity_kg_day': 4000,
        'current_fill_pct': 55
    }
]

def simulate_dumpyard(centers, incoming_waste_kg, days=7):
    results = []
    center_states = {c['id']: c['current_fill_pct'] for c in centers}
    daily_waste = incoming_waste_kg / len(centers)

    for day in range(1, days + 1):
        day_result = {'day': day, 'centers': {}}
        redirected_waste = 0

        for c in centers:
            cid = c['id']
            fill = center_states[cid]
            capacity = c['capacity_kg_day']

            incoming = daily_waste + redirected_waste
            redirected_waste = 0

            processed = capacity * 0.85
            fill_change = ((incoming - processed) / capacity * 100)
            new_fill = fill + fill_change
            new_fill = max(0, min(100, new_fill))

            status = 'normal'
            if new_fill > 90:
                status = 'critical'
                redirected_waste = incoming * 0.30
            elif new_fill > 80:
                status = 'overloaded'
                redirected_waste = incoming * 0.15
            elif new_fill > 60:
                status = 'high'

            center_states[cid] = new_fill
            day_result['centers'][cid] = {
                'fill_pct': round(new_fill, 1),
                'status': status,
                'incoming_kg': round(incoming, 1),
                'processed_kg': round(processed, 1)
            }

        day_result['total_fill_avg'] = round(np.mean(list(center_states.values())), 1)
        day_result['overloaded_count'] = sum(
            1 for s in day_result['centers'].values()
            if s['status'] in ['overloaded', 'critical']
        )
        results.append(day_result)
        print(f"  Day {day}: avg fill "
              f"{day_result['total_fill_avg']:.1f}%  "
              f"overloaded: {day_result['overloaded_count']}")

    return results

# Run simulation for baseline scenario
baseline_waste = scenario_results['baseline']['total_kg']
simulation_results = simulate_dumpyard(processing_centers, baseline_waste, days=7)

# Also run worst case
worst_waste = scenario_results['worst_case']['total_kg']
worst_simulation = simulate_dumpyard(processing_centers, worst_waste, days=7)

# Save simulation results
sim_output = {
    'processing_centers': processing_centers,
    'baseline_simulation': simulation_results,
    'worst_case_simulation': worst_simulation,
    'baseline_waste_kg': baseline_waste,
    'worst_case_waste_kg': worst_waste
}

with open('output/digital_twin/simulation_results.json', 'w') as f:
    json.dump(sim_output, f, indent=2)
print("Simulation saved.")

# ════════════════════════════════════
# PHASE 5: ROUTE OPTIMIZATION
# NetworkX graph + VRP solver
# ════════════════════════════════════

print("\n=== PHASE 5: ROUTE OPTIMIZATION ===")

G = nx.Graph()

usable_road_types = [
    'residential', 'tertiary', 'secondary',
    'primary', 'trunk', 'unclassified', 'way', 'service'
]

usable_roads = roads[
    roads['osm_type'].str.lower().isin(usable_road_types + ['way']) | roads['osm_type'].isna()
].copy()

print(f"Usable road segments: {len(usable_roads)}")

for idx, road in usable_roads.iterrows():
    geom = road.geometry
    if geom.geom_type == 'LineString':
        coords = list(geom.coords)
        for i in range(len(coords) - 1):
            n1 = (round(coords[i][0], 5), round(coords[i][1], 5))
            n2 = (round(coords[i+1][0], 5), round(coords[i+1][1], 5))
            
            dx = (n2[0]-n1[0]) * 111320 * np.cos(np.radians(n1[1]))
            dy = (n2[1]-n1[1]) * 111320
            length = np.sqrt(dx**2 + dy**2)
            
            rtype = str(road.get('osm_type', 'way')).lower()
            speed_factor = {
                'trunk': 0.5, 'primary': 0.6,
                'secondary': 0.7, 'tertiary': 0.8,
                'residential': 1.0, 'service': 1.2,
                'unclassified': 1.0, 'way': 1.0
            }.get(rtype, 1.0)
            
            G.add_edge(n1, n2, weight=length * speed_factor, length=length, road_type=rtype)

print(f"Graph nodes: {G.number_of_nodes()}")
print(f"Graph edges: {G.number_of_edges()}")

def nearest_node(G, lat, lon):
    nodes = list(G.nodes())
    if not nodes: return None
    dists = [abs(n[0]-lon) + abs(n[1]-lat) for n in nodes]
    return nodes[np.argmin(dists)]

high_waste_threshold = grid_features['waste_baseline_kg'].quantile(0.6)

collection_points = grid_features[
    grid_features['waste_baseline_kg'] >= high_waste_threshold
][['centroid_lat', 'centroid_lon', 'waste_baseline_kg', 'cell_id']].copy()

print(f"Collection points (high waste zones): {len(collection_points)}")

depot_lat = processing_centers[0]['lat']
depot_lon = processing_centers[0]['lon']

collection_points = collection_points.sort_values('waste_baseline_kg', ascending=False)

NUM_TRUCKS = 3
truck_routes = {i: [] for i in range(NUM_TRUCKS)}
truck_waste = {i: 0 for i in range(NUM_TRUCKS)}
TRUCK_CAPACITY = 5000  # kg per truck

for _, point in collection_points.iterrows():
    truck_id = min(truck_waste, key=truck_waste.get)
    if truck_waste[truck_id] + point['waste_baseline_kg'] <= TRUCK_CAPACITY:
        truck_routes[truck_id].append({
            'cell_id': point['cell_id'],
            'lat': point['centroid_lat'],
            'lon': point['centroid_lon'],
            'waste_kg': point['waste_baseline_kg']
        })
        truck_waste[truck_id] += point['waste_baseline_kg']

route_stats = []
for truck_id, stops in truck_routes.items():
    if not stops: continue
    
    total_dist = 0
    route_coords = [(depot_lon, depot_lat)]
    
    all_points = (
        [(depot_lat, depot_lon)] +
        [(s['lat'], s['lon']) for s in stops] +
        [(depot_lat, depot_lon)]
    )
    
    for i in range(len(all_points) - 1):
        p1_lat, p1_lon = all_points[i]
        p2_lat, p2_lon = all_points[i+1]
        
        dx = (p2_lon-p1_lon)*111320*np.cos(np.radians(p1_lat))
        dy = (p2_lat-p1_lat)*111320
        dist = np.sqrt(dx**2 + dy**2)
        total_dist += dist
        route_coords.append((p2_lon, p2_lat))
    
    route_stats.append({
        'truck_id': f'Truck_{truck_id+1}',
        'stops': len(stops),
        'total_waste_kg': round(truck_waste[truck_id], 1),
        'route_distance_km': round(total_dist/1000, 2),
        'route_coords': route_coords
    })
    
    print(f"  Truck {truck_id+1}: {len(stops)} stops, {truck_waste[truck_id]:.0f} kg, {total_dist/1000:.1f} km")

with open('output/digital_twin/optimized_routes.json', 'w') as f:
    json.dump(route_stats, f, indent=2)

# ════════════════════════════════════
# PHASE 6: DIGITAL TWIN SIMULATION LOOP
# ════════════════════════════════════

print("\n=== PHASE 6: DIGITAL TWIN LOOP ===")

def run_digital_twin(scenario_name, days=7, rainfall=5, temperature=28, festival_type='none'):
    twin_log = []
    center_fills = {c['id']: c['current_fill_pct'] for c in processing_centers}
    
    for day in range(1, days + 1):
        day_rainfall = max(0, rainfall + np.random.normal(0, 3))
        day_temp = temperature + np.random.normal(0, 1.5)
        
        day_waste = grid_features.apply(
            lambda r: predict_waste(
                r, rainfall=day_rainfall, temperature=day_temp,
                festival=(festival_type != 'none'), festival_type=festival_type
            ), axis=1
        )
        total_waste = day_waste.sum()
        
        overloaded = []
        for c in processing_centers:
            cid = c['id']
            fill = center_fills[cid]
            incoming = total_waste / len(processing_centers)
            processed = c['capacity_kg_day'] * 0.85
            fill_change = ((incoming - processed) / c['capacity_kg_day'] * 100)
            new_fill = max(0, min(100, fill + fill_change))
            center_fills[cid] = new_fill
            if new_fill > 80:
                overloaded.append(cid)
        
        urgent_zones = int((day_waste > day_waste.quantile(0.85)).sum())
        
        twin_log.append({
            'day': day,
            'scenario': scenario_name,
            'rainfall_mm': round(day_rainfall, 1),
            'temperature_c': round(day_temp, 1),
            'total_waste_kg': round(total_waste, 1),
            'total_waste_tons': round(total_waste/1000, 2),
            'overloaded_centers': overloaded,
            'overloaded_count': len(overloaded),
            'urgent_zones': urgent_zones,
            'avg_fill_pct': round(np.mean(list(center_fills.values())), 1)
        })
        
        print(f"  Day {day} [{scenario_name}]: {total_waste/1000:.2f}T waste, {len(overloaded)} overloaded, {urgent_zones} urgent zones")
    
    return twin_log

baseline_twin = run_digital_twin('baseline', days=7, rainfall=5, temperature=28)
festival_twin = run_digital_twin('festival_ganesh', days=7, rainfall=8, temperature=29, festival_type='ganesh')

twin_output = {'baseline': baseline_twin, 'festival': festival_twin}
with open('output/digital_twin/twin_simulation.json', 'w') as f:
    json.dump(twin_output, f, indent=2)

# ════════════════════════════════════
# PHASE 7: VISUALIZATION OUTPUTS
# ════════════════════════════════════

print("\n=== PHASE 7: VISUALIZATIONS ===")

# VIZ 1: Waste Heatmap
fig, axes = plt.subplots(2, 2, figsize=(20, 16), facecolor='#0a0f1e')
fig.patch.set_facecolor('#0a0f1e')
fig.suptitle('HSR Layout — Waste Generation by Scenario', fontsize=16, color='white', y=0.98)

scenario_cols = [
    ('waste_baseline_kg', 'Normal Day', '#ef4444'),
    ('waste_heavy_rain_kg', 'Heavy Rainfall', '#3b82f6'),
    ('waste_festival_ganesh_kg', 'Ganesh Chaturthi', '#f59e0b'),
    ('waste_worst_case_kg', 'Worst Case (Rain+Festival)', '#dc2626'),
]

for ax, (col, title, color) in zip(axes.flat, scenario_cols):
    ax.set_facecolor('#111827')
    ward.plot(ax=ax, color='#1f2937', edgecolor='#374151', linewidth=1.5)
    
    if col in grid_features.columns:
        vmax = grid_features[col].quantile(0.95)
        grid_gdf = gpd.GeoDataFrame(grid_features[['geometry', col]], crs='EPSG:4326')
        grid_gdf.plot(column=col, ax=ax, cmap='YlOrRd', vmin=0, vmax=vmax, alpha=0.85, edgecolor='none', legend=False)
    
    for c in processing_centers:
        marker = {'dry_waste_centre': '^', 'bio_methanisation': 's', 'dumpyard': 'D', 'transfer_station': 'o'}.get(c['type'], 'o')
        ax.plot(c['lon'], c['lat'], marker, color='#00d4aa', ms=8, zorder=10)
    
    for d in dump_sites:
        color_d = {'high': '#ef4444', 'medium': '#f59e0b', 'low': '#6b7280'}.get(d['risk'], '#6b7280')
        ax.plot(d['lon'], d['lat'], 'x', color=color_d, ms=5, zorder=9)
    
    ward.boundary.plot(ax=ax, color='#00d4aa', linewidth=1.5, zorder=11)
    total = grid_features[col].sum() if col in grid_features.columns else 0
    ax.set_title(f"{title}\n{total/1000:.2f} tons/day", color='white', fontsize=11, pad=6)
    ax.set_axis_off()

plt.tight_layout()
plt.savefig('output/digital_twin/waste_heatmap_scenarios.png', dpi=300, bbox_inches='tight', facecolor='#0a0f1e')
plt.close()
print("waste_heatmap_scenarios.png saved")

# VIZ 2: Optimized Truck Routes
fig, axes = plt.subplots(1, 2, figsize=(20, 10), facecolor='#0a0f1e')
fig.patch.set_facecolor('#0a0f1e')
truck_colors = ['#00d4aa', '#f59e0b', '#ef4444']

for ax_idx, (ax, title) in enumerate(zip(axes, ['Optimized Routes', 'Zone Risk Map'])):
    ax.set_facecolor('#111827')
    ward.plot(ax=ax, color='#1f2937', edgecolor='#374151', linewidth=1.5)
    
    if ax_idx == 0:
        roads_sample = usable_roads.sample(min(500, len(usable_roads)))
        roads_sample.plot(ax=ax, color='#374151', linewidth=0.4, alpha=0.5)
        for i, route in enumerate(route_stats):
            coords = route['route_coords']
            if len(coords) > 1:
                lons = [c[0] for c in coords]
                lats = [c[1] for c in coords]
                ax.plot(lons, lats, color=truck_colors[i % 3], linewidth=2.5, alpha=0.9, label=f"{route['truck_id']} ({route['route_distance_km']}km)", zorder=8)
        
        for c in processing_centers:
            ax.plot(c['lon'], c['lat'], 's', color='white', ms=10, zorder=12, markeredgecolor='#00d4aa', markeredgewidth=2)
            ax.annotate(c['name'].replace('HSR ', ''), (c['lon'], c['lat']), xytext=(5, 5), textcoords='offset points', fontsize=6, color='#94a3b8', zorder=13)
        ax.legend(loc='lower left', facecolor='#1f2937', labelcolor='white', fontsize=8)
        
    else:
        grid_gdf = gpd.GeoDataFrame(grid_features[['geometry', 'dump_risk_score']], crs='EPSG:4326')
        grid_gdf.plot(column='dump_risk_score', ax=ax, cmap='Reds', vmin=0, vmax=10, alpha=0.80, edgecolor='none')
        for d in dump_sites:
            color_d = {'high': '#ef4444', 'medium': '#f59e0b', 'low': '#94a3b8'}.get(d['risk'], '#94a3b8')
            size = {'high': 80, 'medium': 50, 'low': 30}.get(d['risk'], 30)
            ax.scatter(d['lon'], d['lat'], c=color_d, s=size, zorder=10, edgecolors='white', linewidths=0.5)
    
    ward.boundary.plot(ax=ax, color='#00d4aa', linewidth=1.5, zorder=15)
    ax.set_title(title, color='white', fontsize=13, pad=8)
    ax.set_axis_off()

plt.tight_layout()
plt.savefig('output/digital_twin/routes_and_risk.png', dpi=300, bbox_inches='tight', facecolor='#0a0f1e')
plt.close()
print("routes_and_risk.png saved")

# VIZ 3: Digital Twin Timeline
fig, axes = plt.subplots(2, 2, figsize=(18, 12), facecolor='#0a0f1e')
fig.patch.set_facecolor('#0a0f1e')
fig.suptitle('Digital Twin — 7-Day Simulation', fontsize=15, color='white', y=0.98)

days = [d['day'] for d in baseline_twin]
baseline_waste = [d['total_waste_tons'] for d in baseline_twin]
festival_waste = [d['total_waste_tons'] for d in festival_twin]
baseline_overload = [d['overloaded_count'] for d in baseline_twin]
festival_overload = [d['overloaded_count'] for d in festival_twin]
baseline_fill = [d['avg_fill_pct'] for d in baseline_twin]
festival_fill = [d['avg_fill_pct'] for d in festival_twin]

plot_configs = [
    (axes[0,0], 'Daily Waste Generation (tons)', baseline_waste, festival_waste, 'tons/day'),
    (axes[0,1], 'Overloaded Centers Count', baseline_overload, festival_overload, 'centers'),
    (axes[1,0], 'Average Facility Fill %', baseline_fill, festival_fill, '%'),
    (axes[1,1], 'Urgent Collection Zones', [d['urgent_zones'] for d in baseline_twin], [d['urgent_zones'] for d in festival_twin], 'zones'),
]

for ax, title, baseline_vals, festival_vals, unit in plot_configs:
    ax.set_facecolor('#111827')
    ax.plot(days, baseline_vals, color='#00d4aa', linewidth=2.5, marker='o', ms=6, label='Normal Day')
    ax.plot(days, festival_vals, color='#f59e0b', linewidth=2.5, marker='s', ms=6, linestyle='--', label='Ganesh Chaturthi')
    ax.fill_between(days, baseline_vals, festival_vals, alpha=0.15, color='#f59e0b')
    ax.set_title(title, color='white', fontsize=11)
    ax.set_xlabel('Day', color='#94a3b8')
    ax.set_ylabel(unit, color='#94a3b8')
    ax.tick_params(colors='#94a3b8')
    ax.legend(facecolor='#1f2937', labelcolor='white', fontsize=9)
    for spine in ax.spines.values():
        spine.set_color('#334155')

plt.tight_layout()
plt.savefig('output/digital_twin/twin_timeline.png', dpi=300, bbox_inches='tight', facecolor='#0a0f1e')
plt.close()
print("twin_timeline.png saved")

# VIZ 4: Zone Classification Map
def try_plot_zone_classification():
    fig, ax = plt.subplots(1, 1, figsize=(14, 11), facecolor='#0a0f1e')
    ax.set_facecolor('#111827')

    zone_colors = {
        'commercial': '#f59e0b',
        'mixed': '#a855f7',
        'residential': '#22c55e'
    }

    try:
        # Avoid issues where axes can be empty and legend fails
        plotted_zones = False
        for zone_type, color in zone_colors.items():
            subset = grid_features[grid_features['zone_type'] == zone_type]
            if len(subset) > 0:
                gpd.GeoDataFrame(subset[['geometry']], crs='EPSG:4326').plot(
                    ax=ax, color=color, alpha=0.75, edgecolor='#0a0f1e', linewidth=0.5, label=f"{zone_type.title()} ({len(subset)} zones)"
                )
                plotted_zones = True

        ward.boundary.plot(ax=ax, color='white', linewidth=2.0, zorder=10)
        usable_roads.sample(min(300, len(usable_roads))).plot(ax=ax, color='#374151', linewidth=0.5, alpha=0.6, zorder=5)

        if plotted_zones:
            ax.legend(facecolor='#1f2937', labelcolor='white', fontsize=11, loc='lower left')

        ax.set_title('HSR Layout — Zone Classification\n(Commercial / Mixed / Residential)', color='white', fontsize=14, pad=10)
        ax.set_axis_off()

        plt.tight_layout()
        plt.savefig('output/digital_twin/zone_classification.png', dpi=300, bbox_inches='tight', facecolor='#0a0f1e')
        plt.close()
        print("zone_classification.png saved")
    except Exception as e:
        print(f"Error saving zone_classification.png: {e}")

try_plot_zone_classification()

# ════════════════════════════════════
# FINAL: SAVE ALL RESULTS
# ════════════════════════════════════

grid_features_save = grid_features.copy()
grid_features_save['geometry'] = grid_features_save['geometry'].apply(lambda g: g.wkt)
grid_features_save.to_csv('output/digital_twin/complete_grid_analysis.csv', index=False)

master_results = {
    'ward': 'HSR Layout',
    'city': 'Bengaluru',
    'grid_cells': len(grid_features),
    'total_population': int(grid_features['population'].sum()),
    'scenario_comparison': scenario_results,
    'processing_centers': len(processing_centers),
    'truck_routes': len(route_stats),
    'zone_breakdown': grid_features['zone_type'].value_counts().to_dict(),
    'simulation_days': 7,
}

with open('output/digital_twin/master_results.json', 'w') as f:
    json.dump(master_results, f, indent=2)

print("\n=== DIGITAL TWIN COMPLETE ===")
print(f"Grid cells analyzed: {len(grid_features)}")
print(f"Population modeled: {grid_features['population'].sum():,.0f}")
print("\nScenario Comparison:")
for name, res in scenario_results.items():
    print(f"  {res['label']:<25} {res['total_tons']:>6.2f} tons/day")
print(f"\nRoute optimization:")
for r in route_stats:
    print(f"  {r['truck_id']}: {r['stops']} stops, {r['route_distance_km']} km, {r['total_waste_kg']:.0f} kg")
print("\nOutput files saved to output/digital_twin/:")
print("  waste_heatmap_scenarios.png")
print("  routes_and_risk.png")
print("  twin_timeline.png")
print("  zone_classification.png")
print("  simulation_results.json")
print("  optimized_routes.json")
print("  twin_simulation.json")
print("  master_results.json")
print("  complete_grid_analysis.csv")
print("  grid_features.csv")
print("============================")
