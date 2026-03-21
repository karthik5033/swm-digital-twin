import rasterio
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.patches as mpatches
import geopandas as gpd
import json
import os
from scipy import ndimage
from scipy.ndimage import uniform_filter, generic_filter, label, binary_dilation
import warnings
warnings.filterwarnings('ignore')

# Set the working directory to the script's directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Ensure output directory exists
os.makedirs('output', exist_ok=True)

# =====================================================================
# SECTION A — LOADING & NORMALIZATION
# =====================================================================

print("Loading HSR_Layout_SD.tif...")
with rasterio.open('HSR_Layout_SD.tif') as src:
    bounds = src.bounds
    transform = src.transform
    r_raw = src.read(1).astype(float)
    g_raw = src.read(2).astype(float)
    b_raw = src.read(3).astype(float)
    height, width = r_raw.shape
    crs = src.crs

print(f"Image dimensions: {width} × {height} pixels")
print(f"CRS: {crs}")

# Nodata mask
nodata_mask = (r_raw >= 60000) | (g_raw >= 60000) | (b_raw >= 60000)
print(f"Nodata pixels: {nodata_mask.sum():,}")

# Per-band 2nd-98th percentile stretch
def stretch(band, mask):
    valid = band[~mask]
    if len(valid) == 0:
        return np.zeros_like(band)
    p2, p98 = np.percentile(valid, 2), np.percentile(valid, 98)
    out = (band - p2) / (p98 - p2 + 1e-9)
    out = np.clip(out, 0, 1)
    out[mask] = np.nan
    return out

R = stretch(r_raw, nodata_mask)
G = stretch(g_raw, nodata_mask)
B = stretch(b_raw, nodata_mask)
brightness = np.nanmean(np.dstack([R, G, B]), axis=2)

# Texture feature: local standard deviation (5x5 window)
# High texture = buildings/urban, low texture = water/roads/vegetation
def local_std(band, size=5):
    band_clean = np.nan_to_num(band, nan=0)
    mean = uniform_filter(band_clean, size=size)
    mean_sq = uniform_filter(band_clean**2, size=size)
    variance = np.clip(mean_sq - mean**2, 0, None)
    return np.sqrt(variance)

texture = local_std(brightness, size=5)
print("Texture feature computed (5×5 local std)")

# NDVI-like greenness index
greenness = np.where(
    (G + R) > 0.01,
    (G - R) / (G + R + 1e-9),
    0
)

# Blueness index for water
blueness = np.where(
    (B + R) > 0.01,
    (B - R) / (B + R + 1e-9),
    0
)

print("Spectral indices computed (greenness, blueness)")

# =====================================================================
# SECTION B — CLASSIFICATION
# 6 classes, FULLY OPAQUE output
# =====================================================================

print("\nClassifying pixels...")

class_map = np.full((height, width), 5, dtype=np.uint8)
# 5 = Dense Urban Fabric (default)

# CLASS COLORS (fully opaque, QGIS palette style):
#   0 = Water         #2166AC  (strong blue)
#   1 = Vegetation    #1A9641  (strong green)
#   2 = Rooftop       #D7191C  (strong red)
#   3 = Road/Paved    #BDBDBD  (medium gray)
#   4 = Bare Soil     #DFC27D  (tan/khaki)
#   5 = Dense Urban   #F1B6DA  (light pink)

# Apply in this order (1=lowest priority, 6=highest):

# STEP 1 — Dense Urban Fabric (default, already set)
# All pixels = 5

# STEP 2 — Bare Soil
mask_soil = (
    ~nodata_mask &
    (R > G) & (R > B) &
    ((R - B) > 0.06) &
    (brightness > 0.18) & (brightness < 0.72) &
    (greenness < 0.04) &
    (texture < 0.12)
)
class_map[mask_soil] = 4
print(f"  Bare Soil:        {mask_soil.sum():>8,} px")

# STEP 3 — Road / Paved
mask_road = (
    ~nodata_mask &
    (brightness > 0.28) & (brightness < 0.65) &
    (np.abs(R - G) < 0.06) &
    (np.abs(G - B) < 0.06) &
    (np.abs(R - B) < 0.06) &
    (texture < 0.08) &
    (greenness < 0.02)
)
class_map[mask_road] = 3
print(f"  Road/Paved:       {mask_road.sum():>8,} px")

# STEP 4 — Rooftop
mask_roof = (
    ~nodata_mask &
    (brightness > 0.52) &
    (np.abs(R - G) < 0.16) &
    (np.abs(G - B) < 0.16) &
    (texture > 0.04)
)
class_map[mask_roof] = 2
print(f"  Rooftop/Built:    {mask_roof.sum():>8,} px")

# STEP 5 — Vegetation (high priority)
mask_veg = (
    ~nodata_mask &
    (greenness > 0.03) &
    (G > 0.18) &
    (brightness > 0.10) & (brightness < 0.85)
)
class_map[mask_veg] = 1
print(f"  Vegetation:       {mask_veg.sum():>8,} px")

# STEP 6 — Water (highest priority)
mask_water = (
    ~nodata_mask &
    (blueness > 0.06) &
    (B > R) & (B > G) &
    (brightness < 0.62)
)
class_map[mask_water] = 0
print(f"  Water:            {mask_water.sum():>8,} px")

# Nodata
class_map[nodata_mask] = 255

# Morphological cleanup — remove speckle noise
# Remove tiny isolated patches (< 8 pixels) of each class
print("Morphological cleanup (removing <8px patches)...")
for class_id in range(6):
    binary = (class_map == class_id)
    labeled, num = label(binary)
    sizes = np.bincount(labeled.ravel())
    small = sizes < 8
    small[0] = False
    remove_mask = small[labeled]
    class_map[remove_mask] = 5  # reassign to urban fabric

print("Classification complete.")

# =====================================================================
# SECTION C — BUILD FULLY OPAQUE COLOR IMAGE (QGIS STYLE)
# =====================================================================

# Color lookup table — FULLY OPAQUE (alpha=1.0)
color_lut = {
    0: [33,  102, 172],   # Water         #2166AC
    1: [26,  150,  65],   # Vegetation    #1A9641
    2: [215,  25,  28],   # Rooftop       #D7191C
    3: [189, 189, 189],   # Road/Paved    #BDBDBD
    4: [223, 194, 125],   # Bare Soil     #DFC27D
    5: [241, 182, 218],   # Dense Urban   #F1B6DA
}

# Build RGB output image
output_rgb = np.zeros((height, width, 3), dtype=np.uint8)
for cid, rgb in color_lut.items():
    mask = (class_map == cid)
    output_rgb[mask] = rgb

# Nodata pixels → black
output_rgb[nodata_mask] = [0, 0, 0]

print("QGIS-style color image built (fully opaque)")

# =====================================================================
# SECTION D — STATISTICS
# =====================================================================

pixel_area_ha = (4.65 * 4.47) / 10000
valid_total = (~nodata_mask).sum()

class_names = {
    0: "Water Body",
    1: "Vegetation",
    2: "Rooftop / Built",
    3: "Road / Paved",
    4: "Bare Soil",
    5: "Dense Urban Fabric"
}

stats = {}
for cid in range(6):
    count = int((class_map == cid).sum())
    area_ha = round(count * pixel_area_ha, 2)
    pct = round(count / valid_total * 100, 1)
    stats[cid] = {
        "name": class_names[cid],
        "pixels": count,
        "area_ha": area_ha,
        "pct": pct,
        "color_hex": "#{:02X}{:02X}{:02X}".format(*color_lut[cid])
    }

total_ha = round(valid_total * pixel_area_ha, 1)

# Save output/lulc_stats_v2.json
lulc_report = {
    "ward": "HSR Layout",
    "total_area_ha": total_ha,
    "pixel_resolution_m": {"x": 4.65, "y": 4.47},
    "dimensions": {"width": int(width), "height": int(height)},
    "classes": {
        stats[i]["name"]: {
            "pixels": stats[i]["pixels"],
            "area_ha": stats[i]["area_ha"],
            "percentage": stats[i]["pct"],
            "color_hex": stats[i]["color_hex"]
        }
        for i in range(6)
    }
}

with open('output/lulc_stats_v2.json', 'w') as f:
    json.dump(lulc_report, f, indent=2)

print("lulc_stats_v2.json saved")

# =====================================================================
# SECTION E — OUTPUT 1: lulc_qgis.png
# PURE MAP — ABSOLUTELY NO TEXT/LABELS
# =====================================================================

print("\nRendering lulc_qgis.png (pure map, 600 DPI)...")

fig, ax = plt.subplots(1, 1,
                        figsize=(16, 13),
                        dpi=600,
                        facecolor='black')

extent = [bounds.left, bounds.right,
          bounds.bottom, bounds.top]

# Plot the fully opaque classified image
ax.imshow(output_rgb,
          extent=extent,
          aspect='equal',
          interpolation='nearest',
          origin='upper')

# Ward boundary — white outline, 2px, clean
ward_file = 'output/hsr_ward_boundary.geojson'
if os.path.exists(ward_file):
    ward = gpd.read_file(ward_file)
    ward.boundary.plot(ax=ax,
                       color='white',
                       linewidth=2.0,
                       alpha=1.0,
                       zorder=10)

# Absolute zero labels/ticks/borders
ax.set_axis_off()
fig.subplots_adjust(left=0, right=1, top=1, bottom=0)

plt.savefig('output/lulc_qgis.png',
            dpi=600,
            bbox_inches='tight',
            pad_inches=0,
            facecolor='black')
plt.close()
print("lulc_qgis.png saved")

# =====================================================================
# SECTION F — OUTPUT 2: lulc_qgis_leg.png
# MAP + PROFESSIONAL LEGEND PANEL
# NO TEXT ON THE MAP ITSELF
# =====================================================================

print("Rendering lulc_qgis_leg.png (map + legend, 600 DPI)...")

fig = plt.figure(figsize=(20, 13),
                 dpi=600,
                 facecolor='#1a1a2e')

gs = gridspec.GridSpec(
    1, 2,
    width_ratios=[83, 17],
    wspace=0.015,
    left=0.0, right=1.0,
    top=1.0, bottom=0.0
)

# ── MAP (left panel) ──
ax_map = fig.add_subplot(gs[0])
ax_map.imshow(output_rgb,
              extent=extent,
              aspect='equal',
              interpolation='nearest',
              origin='upper')
if os.path.exists(ward_file):
    ward.boundary.plot(ax=ax_map,
                       color='white',
                       linewidth=1.8,
                       alpha=1.0,
                       zorder=10)
ax_map.set_axis_off()

# ── LEGEND (right panel) ──
ax_leg = fig.add_subplot(gs[1])
ax_leg.set_facecolor('#1a1a2e')
ax_leg.set_xlim(0, 1)
ax_leg.set_ylim(0, 1)
ax_leg.set_axis_off()

# Title block
ax_leg.text(0.10, 0.97,
            'HSR Layout',
            fontsize=11, fontweight='bold',
            color='white',
            transform=ax_leg.transAxes, va='top')
ax_leg.text(0.10, 0.925,
            'LULC Classification',
            fontsize=9, color='#94a3b8',
            transform=ax_leg.transAxes, va='top')
ax_leg.text(0.10, 0.885,
            f'Total: {total_ha} ha',
            fontsize=8, color='#64748b',
            transform=ax_leg.transAxes, va='top')

# Horizontal rule
ax_leg.plot([0.08, 0.92], [0.862, 0.862],
            color='#334155', linewidth=0.8,
            transform=ax_leg.transAxes)

# Legend entries
y_start = 0.820
y_step = 0.118

for i, (cid, s) in enumerate(stats.items()):
    y = y_start - (i * y_step)
    hex_color = s["color_hex"]

    # Color swatch — solid square
    sq = mpatches.FancyBboxPatch(
        (0.08, y - 0.028),
        width=0.20,
        height=0.058,
        boxstyle="square,pad=0",
        facecolor=hex_color,
        edgecolor='#ffffff',
        linewidth=0.5,
        transform=ax_leg.transAxes,
        zorder=5
    )
    ax_leg.add_patch(sq)

    # Class name
    ax_leg.text(0.34, y + 0.010,
                s["name"],
                fontsize=8.0,
                fontweight='bold',
                color='white',
                transform=ax_leg.transAxes,
                va='center')

    # Area and percentage
    ax_leg.text(0.34, y - 0.020,
                f"{s['area_ha']} ha  ({s['pct']}%)",
                fontsize=7.0,
                color='#94a3b8',
                transform=ax_leg.transAxes,
                va='center')

# Bottom rule
ax_leg.plot([0.08, 0.92], [0.092, 0.092],
            color='#334155', linewidth=0.8,
            transform=ax_leg.transAxes)

# Footer
footer = [
    "Source: HSR_Layout_SD.tif",
    "Method: Spectral + Texture",
    "Tool: AstraCity Pipeline",
    "Projection: EPSG:4326",
]
for j, line in enumerate(footer):
    ax_leg.text(0.10, 0.078 - j * 0.022,
                line,
                fontsize=6.5,
                color='#475569',
                transform=ax_leg.transAxes,
                va='top')

plt.savefig('output/lulc_qgis_leg.png',
            dpi=600,
            bbox_inches='tight',
            pad_inches=0.02,
            facecolor='#1a1a2e')
plt.close()
print("lulc_qgis_leg.png saved")

# =====================================================================
# SECTION G — PRINT SUMMARY
# =====================================================================

print("\n=== LULC QGIS-STYLE MAP GENERATED ===")
print(f"Image: {width} × {height} pixels at 600 DPI")
print(f"Total mapped area: {total_ha} ha")
print("")
print("Classification Results:")
for cid, s in stats.items():
    bar = "█" * int(s['pct'] / 2)
    print(f"  {s['name']:<22} {s['area_ha']:>7.1f} ha  "
          f"{s['pct']:>5.1f}%  {bar}")
print("")
dominant = max(stats.values(), key=lambda x: x['area_ha'])
print(f"Dominant class: {dominant['name']} ({dominant['pct']}%)")
print("=====================================")
print("Files saved:")
print("  output/lulc_qgis.png      (pure map, 600 DPI)")
print("  output/lulc_qgis_leg.png  (map + legend, 600 DPI)")
print("  output/lulc_stats_v2.json (statistics)")
