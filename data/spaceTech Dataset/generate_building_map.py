import geopandas as gpd
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import matplotlib.patheffects as pe
import json
import requests
from shapely.geometry import shape
import warnings
warnings.filterwarnings('ignore')

# =====================================================================
# SECTION A — FETCH OSM BUILDING DATA (Direct Overpass API — fast)
# =====================================================================

# Load ward boundary to get exact bounds
ward = gpd.read_file('output/hsr_ward_boundary.geojson')
bounds = ward.total_bounds
# bounds = [minlon, minlat, maxlon, maxlat]

north = bounds[3]
south = bounds[1]
east  = bounds[2]
west  = bounds[0]

print(f"Fetching OSM buildings for bounds:")
print(f"  N:{north:.4f} S:{south:.4f} E:{east:.4f} W:{west:.4f}")

# Direct Overpass API query — single request, much faster than osmnx
overpass_url = "https://overpass-api.de/api/interpreter"
overpass_query = f"""
[out:json][timeout:120];
(
  way["building"]({south},{west},{north},{east});
  relation["building"]({south},{west},{north},{east});
);
out body;
>;
out skel qt;
"""

print("Querying Overpass API directly...")
response = requests.get(overpass_url, params={'data': overpass_query}, timeout=180)
response.raise_for_status()
data = response.json()
print(f"Overpass returned {len(data['elements'])} elements")

# Parse Overpass JSON into GeoDataFrame
nodes = {}
ways = {}
relations_raw = []

for elem in data['elements']:
    if elem['type'] == 'node':
        nodes[elem['id']] = (elem['lon'], elem['lat'])
    elif elem['type'] == 'way':
        ways[elem['id']] = elem
    elif elem['type'] == 'relation':
        relations_raw.append(elem)

from shapely.geometry import Polygon, MultiPolygon

features = []
for wid, way in ways.items():
    coords = []
    for nid in way.get('nodes', []):
        if nid in nodes:
            coords.append(nodes[nid])
    if len(coords) >= 4 and coords[0] == coords[-1]:
        try:
            poly = Polygon(coords)
            if poly.is_valid and poly.area > 0:
                tags = way.get('tags', {})
                tags['geometry'] = poly
                features.append(tags)
        except:
            pass

if features:
    buildings = gpd.GeoDataFrame(features, geometry='geometry', crs='EPSG:4326')
    print(f"Total OSM buildings parsed: {len(buildings)}")
else:
    print("ERROR: No buildings parsed!")
    exit(1)

# Clip to ward boundary
buildings = gpd.clip(buildings, ward)
buildings = buildings.to_crs('EPSG:4326')

print(f"Buildings within HSR Layout: {len(buildings)}")

# =====================================================================
# SECTION B — BUILDING CLASSIFICATION
# =====================================================================

def classify_building(row):
    b = str(row.get('building', '')).lower()
    amenity = str(row.get('amenity', '')).lower()
    shop = str(row.get('shop', '')).lower()
    leisure = str(row.get('leisure', '')).lower()
    landuse = str(row.get('landuse', '')).lower()
    name = str(row.get('name', '')).lower()

    if any(x in b for x in ['hospital', 'clinic', 'medical']):
        return 'Hospital/Medical'
    if any(x in amenity for x in ['hospital', 'clinic', 'doctors', 
                                    'pharmacy', 'health_centre']):
        return 'Hospital/Medical'

    if any(x in b for x in ['school', 'university', 'college', 
                              'kindergarten']):
        return 'Educational'
    if any(x in amenity for x in ['school', 'university', 'college',
                                    'kindergarten', 'library']):
        return 'Educational'

    if any(x in b for x in ['commercial', 'retail', 'shop', 
                              'supermarket', 'mall']):
        return 'Commercial/Retail'
    if shop and shop != 'nan' and shop != '':
        return 'Commercial/Retail'
    if any(x in amenity for x in ['marketplace', 'bank', 'atm']):
        return 'Commercial/Retail'

    if any(x in b for x in ['office', 'it', 'tech']):
        return 'Office/IT'
    if any(x in name for x in ['office', 'tech', 'software', 
                                  'solutions', 'technologies', 'pvt',
                                  'ltd', 'inc', 'corp']):
        return 'Office/IT'

    if any(x in b for x in ['industrial', 'warehouse', 'factory',
                              'manufacture']):
        return 'Industrial'

    if any(x in b for x in ['church', 'mosque', 'temple', 
                              'cathedral', 'chapel']):
        return 'Religious'
    if any(x in amenity for x in ['place_of_worship']):
        return 'Religious'

    if any(x in b for x in ['government', 'civic', 'public']):
        return 'Government/Civic'
    if any(x in amenity for x in ['townhall', 'post_office', 
                                    'police', 'fire_station',
                                    'community_centre']):
        return 'Government/Civic'

    if any(x in b for x in ['hotel', 'hostel', 'guest_house']):
        return 'Hotel/Hospitality'
    if any(x in amenity for x in ['hotel', 'hostel']):
        return 'Hotel/Hospitality'

    if any(x in b for x in ['parking', 'garage', 'carport']):
        return 'Parking/Garage'
    if any(x in amenity for x in ['parking', 'parking_space']):
        return 'Parking/Garage'

    if any(x in b for x in ['apartments', 'apartment', 'flat',
                              'residential', 'dormitory']):
        return 'Residential (Apartment)'

    if any(x in b for x in ['house', 'detached', 'semidetached',
                              'bungalow', 'villa', 'terrace']):
        return 'Residential (House)'

    if b in ['yes', 'true', '1', 'building']:
        try:
            area = row.geometry.area * 111320 * 111320
            if area > 2000:
                return 'Residential (Apartment)'
            else:
                return 'Residential (House)'
        except:
            return 'Residential (House)'

    return 'Other/Unclassified'

buildings['building_type'] = buildings.apply(classify_building, axis=1)

buildings_proj = buildings.to_crs('EPSG:32643')
buildings['area_sqm'] = buildings_proj.geometry.area.round(1)
buildings['area_category'] = pd.cut(
    buildings['area_sqm'],
    bins=[0, 100, 300, 1000, 5000, float('inf')],
    labels=['Tiny (<100)', 'Small (100-300)', 
            'Medium (300-1000)', 'Large (1000-5000)', 
            'Very Large (5000+)']
)

print("\nBuilding type distribution:")
type_counts = buildings['building_type'].value_counts()
for btype, count in type_counts.items():
    print(f"  {btype:<30} {count:>5}")

# =====================================================================
# SECTION C — COLOR SCHEME
# =====================================================================

building_colors = {
    'Residential (House)':      '#F4A460',
    'Residential (Apartment)':  '#E8824A',
    'Commercial/Retail':        '#6CB4E4',
    'Office/IT':                '#4169E1',
    'Hospital/Medical':         '#FF4444',
    'Educational':              '#FFD700',
    'Religious':                '#9370DB',
    'Government/Civic':         '#20B2AA',
    'Hotel/Hospitality':        '#FF69B4',
    'Industrial':               '#A0A0A0',
    'Parking/Garage':           '#808080',
    'Other/Unclassified':       '#D3D3D3',
}

buildings['color'] = buildings['building_type'].map(
    lambda x: building_colors.get(x, '#D3D3D3')
)

# =====================================================================
# SECTION D — OUTPUT 1: building_map.png
# =====================================================================

fig, ax = plt.subplots(1, 1, figsize=(16, 13), dpi=600, facecolor='#F5F5DC')
ax.set_facecolor('#E8E0D8')

try:
    roads = gpd.read_file('output/hsr_road_network.geojson')
    roads.plot(ax=ax, color='#FFFFFF', linewidth=0.4, alpha=0.6, zorder=1)
except:
    pass

ward.plot(ax=ax, color='#F0EBE3', edgecolor='#333333', linewidth=2.0, alpha=0.3, zorder=2)

buildings_sorted = buildings.sort_values('area_sqm', ascending=False)

for btype, color in building_colors.items():
    subset = buildings_sorted[buildings_sorted['building_type'] == btype]
    if len(subset) > 0:
        subset.plot(
            ax=ax,
            color=color,
            edgecolor='#33333333',
            linewidth=0.15,
            alpha=0.92,
            zorder=3
        )

ward.boundary.plot(ax=ax, color='#1a1a1a', linewidth=2.5, zorder=10)

ax.set_axis_off()
fig.subplots_adjust(left=0, right=1, top=1, bottom=0)

plt.savefig('output/building_map.png', dpi=600, bbox_inches='tight', pad_inches=0, facecolor='#E8E0D8')
plt.close()
print("building_map.png saved")

# =====================================================================
# SECTION E — OUTPUT 2: building_map_legend.png
# =====================================================================

fig = plt.figure(figsize=(22, 14), dpi=600, facecolor='#F5F5DC')
gs = gridspec.GridSpec(1, 2, width_ratios=[78, 22], wspace=0.01)

# MAP
ax_map = fig.add_subplot(gs[0])
ax_map.set_facecolor('#E8E0D8')

try:
    roads.plot(ax=ax_map, color='#FFFFFF', linewidth=0.4, alpha=0.5, zorder=1)
except:
    pass

ward.plot(ax=ax_map, color='#F0EBE3', edgecolor='none', alpha=0.4, zorder=2)

for btype, color in building_colors.items():
    subset = buildings_sorted[buildings_sorted['building_type'] == btype]
    if len(subset) > 0:
        subset.plot(ax=ax_map, color=color, edgecolor='#33333333', linewidth=0.15, alpha=0.92, zorder=3)

ward.boundary.plot(ax=ax_map, color='#1a1a1a', linewidth=2.0, zorder=10)
ax_map.set_axis_off()

# LEGEND
ax_leg = fig.add_subplot(gs[1])
ax_leg.set_facecolor('#FAFAF5')
ax_leg.set_xlim(0, 1)
ax_leg.set_ylim(0, 1)
ax_leg.set_axis_off()

ax_leg.text(0.08, 0.975, 'HSR Layout', fontsize=13, fontweight='bold', color='#1a1a1a', transform=ax_leg.transAxes, va='top', fontfamily='DejaVu Sans')
ax_leg.text(0.08, 0.945, 'Building Type Map', fontsize=10, color='#555555', transform=ax_leg.transAxes, va='top')
ax_leg.text(0.08, 0.918, f"Total: {len(buildings):,} buildings mapped", fontsize=9, color='#777777', transform=ax_leg.transAxes, va='top')
ax_leg.plot([0.05, 0.95], [0.900, 0.900], color='#CCCCCC', linewidth=0.8, transform=ax_leg.transAxes)

present_types = [t for t in building_colors.keys() if t in buildings['building_type'].values]

y = 0.875
for btype in present_types:
    count = type_counts.get(btype, 0)
    if count == 0: continue
    color = building_colors[btype]
    pct = round(count / len(buildings) * 100, 1)
    
    sq = FancyBboxPatch((0.05, y - 0.018), 0.14, 0.032, boxstyle="square,pad=0", facecolor=color, edgecolor='#888888', linewidth=0.5, transform=ax_leg.transAxes)
    ax_leg.add_patch(sq)
    
    display_name = btype.replace('Residential ', 'Res. ')
    ax_leg.text(0.23, y, display_name, fontsize=7.5, color='#1a1a1a', fontweight='500', transform=ax_leg.transAxes, va='center')
    ax_leg.text(0.23, y - 0.020, f"{count:,}  ·  {pct}%", fontsize=6.5, color='#666666', transform=ax_leg.transAxes, va='center')
    
    y -= 0.068

ax_leg.plot([0.05, 0.95], [y + 0.01, y + 0.01], color='#CCCCCC', linewidth=0.8, transform=ax_leg.transAxes)
y -= 0.01
stats_items = [
    ("Total buildings", f"{len(buildings):,}"),
    ("Avg area", f"{buildings['area_sqm'].mean():.0f} sqm"),
    ("Largest", f"{buildings['area_sqm'].max():.0f} sqm"),
    ("Medical facilities", str(len(buildings[buildings['building_type']=='Hospital/Medical']))),
    ("Schools/Colleges", str(len(buildings[buildings['building_type']=='Educational']))),
    ("Commercial units", str(len(buildings[buildings['building_type']=='Commercial/Retail']))),
]

for label, value in stats_items:
    ax_leg.text(0.06, y, label + ":", fontsize=7, color='#666666', transform=ax_leg.transAxes, va='top')
    ax_leg.text(0.65, y, value, fontsize=7, color='#1a1a1a', fontweight='bold', transform=ax_leg.transAxes, va='top')
    y -= 0.030

ax_leg.plot([0.05, 0.95], [0.06, 0.06], color='#CCCCCC', linewidth=0.8, transform=ax_leg.transAxes)
ax_leg.text(0.08, 0.045, "Source: OpenStreetMap contributors", fontsize=6, color='#999999', transform=ax_leg.transAxes, va='top')
ax_leg.text(0.08, 0.025, "Tool: AstraCity · HSR Layout Analysis", fontsize=6, color='#999999', transform=ax_leg.transAxes, va='top')

plt.savefig('output/building_map_legend.png', dpi=600, bbox_inches='tight', pad_inches=0.02, facecolor='#F5F5DC')
plt.close()
print("building_map_legend.png saved")

# =====================================================================
# SECTION F — OUTPUT 3: building_report.json
# =====================================================================

lon_bins = np.linspace(west, east, 5)
lat_bins = np.linspace(south, north, 5)

zone_stats = []
zone_labels = ['A','B','C','D']
for i in range(4):
    for j in range(4):
        zone_id = f"{zone_labels[i]}{j+1}"
        z_west, z_east = lon_bins[j], lon_bins[j+1]
        z_south, z_north = lat_bins[i], lat_bins[i+1]
        
        zone_mask = (
            (buildings.geometry.centroid.x >= z_west) &
            (buildings.geometry.centroid.x < z_east) &
            (buildings.geometry.centroid.y >= z_south) &
            (buildings.geometry.centroid.y < z_north)
        )
        zone_buildings = buildings[zone_mask]
        
        type_breakdown = zone_buildings['building_type'].value_counts().to_dict()
        
        zone_stats.append({
            "zone_id": zone_id,
            "bounds": [z_west, z_south, z_east, z_north],
            "total_buildings": len(zone_buildings),
            "type_breakdown": type_breakdown,
            "dominant_type": zone_buildings['building_type'].mode()[0] if len(zone_buildings) > 0 else "none",
            "avg_building_area_sqm": round(zone_buildings['area_sqm'].mean(), 1) if len(zone_buildings) > 0 else 0,
            "medical_count": int(type_breakdown.get('Hospital/Medical', 0)),
            "school_count": int(type_breakdown.get('Educational', 0)),
            "commercial_count": int(type_breakdown.get('Commercial/Retail', 0)),
        })

report = {
    "ward": "HSR Layout",
    "city": "Bengaluru",
    "data_source": "OpenStreetMap",
    "total_buildings": len(buildings),
    "type_summary": type_counts.to_dict(),
    "area_stats": {
        "mean_sqm": round(buildings['area_sqm'].mean(), 1),
        "median_sqm": round(buildings['area_sqm'].median(), 1),
        "max_sqm": round(buildings['area_sqm'].max(), 1),
        "total_footprint_ha": round(buildings['area_sqm'].sum() / 10000, 2)
    },
    "key_facilities": {
        "hospitals_clinics": int(type_counts.get('Hospital/Medical', 0)),
        "schools_colleges": int(type_counts.get('Educational', 0)),
        "commercial_retail": int(type_counts.get('Commercial/Retail', 0)),
        "offices_it": int(type_counts.get('Office/IT', 0)),
        "religious": int(type_counts.get('Religious', 0)),
        "government": int(type_counts.get('Government/Civic', 0)),
        "hotels": int(type_counts.get('Hotel/Hospitality', 0)),
    },
    "residential": {
        "apartments": int(type_counts.get('Residential (Apartment)', 0)),
        "houses": int(type_counts.get('Residential (House)', 0)),
        "total": int(type_counts.get('Residential (Apartment)', 0) + type_counts.get('Residential (House)', 0))
    },
    "zones": zone_stats
}

with open('output/building_report.json', 'w') as f:
    json.dump(report, f, indent=2)

print("building_report.json saved")

# =====================================================================
# SECTION G — OUTPUT 4: building_report.pdf
# =====================================================================

from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.patches as mpatches

with PdfPages('output/building_report.pdf') as pdf:
    # PAGE 1
    fig = plt.figure(figsize=(11.69, 8.27), facecolor='#0a0f1e')
    fig.text(0.08, 0.88, 'AstraCity', fontsize=28, fontweight='bold', color='#00d4aa')
    fig.text(0.08, 0.80, 'HSR Layout Building Intelligence Report', fontsize=18, color='white')
    fig.text(0.08, 0.74, 'OpenStreetMap + Satellite Analysis · Bengaluru', fontsize=11, color='#94a3b8')
    fig.add_artist(plt.Line2D([0.08, 0.92], [0.70, 0.70], color='#00d4aa', linewidth=1.5))
    
    metrics = [
        (str(len(buildings)), "Total Buildings"),
        (str(int(type_counts.get('Hospital/Medical', 0))), "Medical Facilities"),
        (str(int(type_counts.get('Educational', 0))), "Schools/Colleges"),
        (str(int(type_counts.get('Commercial/Retail', 0))), "Commercial Units"),
        (f"{buildings['area_sqm'].mean():.0f} m²", "Avg Building Size"),
        (f"{buildings['area_sqm'].sum()/10000:.1f} ha", "Total Footprint"),
    ]
    
    for idx, (value, label) in enumerate(metrics):
        x = 0.08 + (idx % 3) * 0.30
        y = 0.52 if idx < 3 else 0.35
        
        box_ax = fig.add_axes([x, y-0.04, 0.25, 0.14])
        box_ax.set_facecolor('#111827')
        box_ax.set_xticks([])
        box_ax.set_yticks([])
        for spine in box_ax.spines.values(): spine.set_color('#1f2937')
        
        box_ax.text(0.5, 0.65, value, fontsize=22, fontweight='bold', color='#00d4aa', ha='center', transform=box_ax.transAxes)
        box_ax.text(0.5, 0.22, label, fontsize=8, color='#94a3b8', ha='center', transform=box_ax.transAxes)
    
    fig.text(0.08, 0.14, f"Dominant building type: {type_counts.index[0]} ({type_counts.iloc[0]:,} buildings, {type_counts.iloc[0]/len(buildings)*100:.1f}%)", fontsize=10, color='white')
    fig.text(0.08, 0.08, "Data: OpenStreetMap contributors · Analysis: AstraCity Pipeline · Ward: HSR Layout, Bengaluru South", fontsize=8, color='#475569')
    
    pdf.savefig(fig, bbox_inches='tight')
    plt.close()

    # PAGE 2
    fig, axes = plt.subplots(1, 2, figsize=(11.69, 8.27), facecolor='#0a0f1e')
    fig.patch.set_facecolor('#0a0f1e')
    
    ax1 = axes[0]
    ax1.set_facecolor('#111827')
    
    sorted_types = type_counts.head(10)
    colors_bar = [building_colors.get(t, '#D3D3D3') for t in sorted_types.index]
    
    bars = ax1.barh(range(len(sorted_types)), sorted_types.values, color=colors_bar, edgecolor='none', height=0.7)
    
    ax1.set_yticks(range(len(sorted_types)))
    short_names = [t.replace('Residential ', 'Res. ').replace('/Retail', '').replace('/Medical', '') for t in sorted_types.index]
    ax1.set_yticklabels(short_names, fontsize=9, color='white')
    ax1.set_xlabel('Number of Buildings', color='#94a3b8', fontsize=9)
    ax1.set_title('Building Type Distribution', color='white', fontsize=12, pad=10)
    ax1.tick_params(colors='#94a3b8')
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    for spine in ['bottom', 'left']: ax1.spines[spine].set_color('#334155')
    
    for bar, val in zip(bars, sorted_types.values):
        ax1.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height()/2, str(val), va='center', fontsize=8, color='white')
    
    ax2 = axes[1]
    ax2.set_facecolor('#111827')
    
    top6 = type_counts.head(6)
    other = type_counts.iloc[6:].sum()
    if other > 0: top6['Other'] = other
    
    pie_colors = [building_colors.get(t, '#D3D3D3') for t in top6.index]
    
    wedges, texts, autotexts = ax2.pie(top6.values, labels=None, colors=pie_colors, autopct='%1.1f%%', pctdistance=0.75, startangle=90, wedgeprops={'edgecolor': '#0a0f1e', 'linewidth': 1.5})
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontsize(8)
    
    ax2.set_title('Building Mix (%)', color='white', fontsize=12, pad=10)
    legend_labels = [t.replace('Residential ', 'Res. ') for t in top6.index]
    ax2.legend(wedges, legend_labels, loc='lower center', bbox_to_anchor=(0.5, -0.15), ncol=2, fontsize=7, facecolor='#111827', labelcolor='white', edgecolor='#334155')
    
    plt.suptitle('HSR Layout — Building Analysis', fontsize=14, color='white', y=1.01)
    plt.tight_layout()
    pdf.savefig(fig, bbox_inches='tight', facecolor='#0a0f1e')
    plt.close()

    # PAGE 3
    fig, axes = plt.subplots(1, 2, figsize=(11.69, 8.27), facecolor='#0a0f1e', gridspec_kw={'width_ratios': [75, 25]})
    fig.patch.set_facecolor('#0a0f1e')
    
    ax_m = axes[0]
    ax_m.set_facecolor('#E8E0D8')
    
    try: roads.plot(ax=ax_m, color='#FFFFFF', linewidth=0.3, alpha=0.5, zorder=1)
    except: pass
    ward.plot(ax=ax_m, color='#F0EBE3', edgecolor='none', alpha=0.3, zorder=2)
    
    for btype, color in building_colors.items():
        subset = buildings_sorted[buildings_sorted['building_type'] == btype]
        if len(subset) > 0:
            subset.plot(ax=ax_m, color=color, edgecolor='none', linewidth=0, alpha=0.9, zorder=3)
    
    ward.boundary.plot(ax=ax_m, color='#1a1a1a', linewidth=2.0, zorder=10)
    ax_m.set_axis_off()
    ax_m.set_title('Building Type Map — HSR Layout', color='white', fontsize=11, pad=8)
    
    ax_l = axes[1]
    ax_l.set_facecolor('#111827')
    ax_l.set_axis_off()
    
    y_l = 0.96
    ax_l.text(0.1, y_l, 'Legend', fontsize=11, fontweight='bold', color='white', transform=ax_l.transAxes, va='top')
    y_l -= 0.06
    
    for btype in present_types:
        count = type_counts.get(btype, 0)
        if count == 0: continue
        color = building_colors[btype]
        sq = FancyBboxPatch((0.05, y_l - 0.025), 0.12, 0.040, boxstyle="square,pad=0", facecolor=color, edgecolor='none', transform=ax_l.transAxes)
        ax_l.add_patch(sq)
        short = btype.replace('Residential ', 'Res. ')
        ax_l.text(0.22, y_l, f"{short} ({count})", fontsize=6.5, color='white', transform=ax_l.transAxes, va='center')
        y_l -= 0.062
    
    pdf.savefig(fig, bbox_inches='tight', facecolor='#0a0f1e')
    plt.close()

    # PAGE 4
    fig, ax = plt.subplots(figsize=(11.69, 8.27), facecolor='#0a0f1e')
    ax.set_facecolor('#111827')
    
    zone_df = pd.DataFrame(zone_stats)
    pivot_data = zone_df.set_index('zone_id')['total_buildings'].values.reshape(4,4)
    
    im = ax.imshow(pivot_data, cmap='YlOrRd', aspect='auto', interpolation='nearest')
    
    for i in range(4):
        for j in range(4):
            idx = i * 4 + j
            z = zone_stats[idx]
            val = z['total_buildings']
            ax.text(j, i, f"{z['zone_id']}\n{val}", ha='center', va='center', fontsize=8, color='black' if val < 50 else 'white', fontweight='bold')
    
    ax.set_xticks(range(4))
    ax.set_xticklabels(['West', 'Centre-W', 'Centre-E', 'East'], color='white')
    ax.set_yticks(range(4))
    ax.set_yticklabels(['North', 'Centre-N', 'Centre-S', 'South'], color='white')
    
    plt.colorbar(im, ax=ax, label='Building Count', shrink=0.8).ax.yaxis.label.set_color('white')
    ax.set_title('Zone-wise Building Density — HSR Layout', color='white', fontsize=13, pad=10)
    
    pdf.savefig(fig, bbox_inches='tight', facecolor='#0a0f1e')
    plt.close()

print("building_report.pdf saved (4 pages)")

# =====================================================================
# SECTION H — SAVE GeoJSON
# =====================================================================

buildings_out = buildings[
    ['geometry', 'building_type', 'area_sqm',
     'area_category', 'color', 'name']
].copy()

buildings_out['name'] = buildings_out.get('name', pd.Series([''] * len(buildings_out))).fillna('')
buildings_out.to_file('output/buildings_osm.geojson', driver='GeoJSON')
print("buildings_osm.geojson saved")

# =====================================================================
# SECTION I — PRINT FULL SUMMARY
# =====================================================================

print("\n=== HSR LAYOUT BUILDING INTELLIGENCE ===")
print(f"Total buildings mapped: {len(buildings):,}")
print(f"Data source: OpenStreetMap")
print(f"\nBuilding Types:")
for btype, count in type_counts.items():
    pct = count/len(buildings)*100
    bar = '█' * int(pct/2)
    print(f"  {btype:<28} {count:>5}  ({pct:>5.1f}%)  {bar}")
print(f"\nKey Facilities:")
print(f"  Hospitals/Clinics:  {report['key_facilities']['hospitals_clinics']}")
print(f"  Schools/Colleges:   {report['key_facilities']['schools_colleges']}")
print(f"  Commercial units:   {report['key_facilities']['commercial_retail']}")
print(f"  Offices/IT:         {report['key_facilities']['offices_it']}")
print(f"  Religious sites:    {report['key_facilities']['religious']}")
print(f"  Government:         {report['key_facilities']['government']}")
print(f"\nArea Statistics:")
print(f"  Average size:       {buildings['area_sqm'].mean():.0f} sqm")
print(f"  Total footprint:    {buildings['area_sqm'].sum()/10000:.1f} ha")
print(f"\nFiles saved:")
print(f"  output/building_map.png")
print(f"  output/building_map_legend.png")
print(f"  output/building_report.json")
print(f"  output/building_report.pdf  (4 pages)")
print(f"  output/buildings_osm.geojson")
print("=========================================")
