import rasterio
import numpy as np
import matplotlib.pyplot as plt

with rasterio.open('HSR_Layout_SD.tif') as src:
    r_raw = src.read(1).astype(float)
    g_raw = src.read(2).astype(float)
    b_raw = src.read(3).astype(float)
    bounds = src.bounds
    nodata = src.nodata

# Mask nodata
nodata_mask = (r_raw >= 60000) | (g_raw >= 60000) | (b_raw >= 60000)

# Print raw band statistics to diagnose
for name, band in [('Red', r_raw), ('Green', g_raw), ('Blue', b_raw)]:
    valid = band[~nodata_mask]
    print(f"{name}: min={valid.min():.0f} max={valid.max():.0f} "
          f"mean={valid.mean():.0f} median={np.median(valid):.0f} "
          f"p2={np.percentile(valid,2):.0f} "
          f"p98={np.percentile(valid,98):.0f}")

# METHOD 1: Aggressive per-band histogram stretch
# Each band independently stretched to its own p2-p98 range
def stretch_aggressive(band, mask, p_low=2, p_high=98):
    valid = band[~mask]
    lo = np.percentile(valid, p_low)
    hi = np.percentile(valid, p_high)
    out = (band - lo) / (hi - lo + 1e-9)
    out = np.clip(out, 0, 1)
    out[mask] = 0
    return out

R1 = stretch_aggressive(r_raw, nodata_mask)
G1 = stretch_aggressive(g_raw, nodata_mask)
B1 = stretch_aggressive(b_raw, nodata_mask)

rgb1 = np.dstack([R1, G1, B1])

# METHOD 2: Gamma correction after stretch
# Apply gamma=1.4 to brighten midtones
gamma = 1.4
R2 = np.power(R1, 1/gamma)
G2 = np.power(G1, 1/gamma)
B2 = np.power(B1, 1/gamma)
rgb2 = np.dstack([R2, G2, B2])

# METHOD 3: Manual white balance
# Reduce blue channel by 15%, boost red by 10%
R3 = np.clip(R1 * 1.10, 0, 1)
G3 = np.clip(G1 * 1.00, 0, 1)
B3 = np.clip(B1 * 0.82, 0, 1)
rgb3 = np.dstack([R3, G3, B3])

# METHOD 4: CLAHE-style local contrast enhancement
from skimage import exposure
R4 = exposure.equalize_adapthist(R1, clip_limit=0.03)
G4 = exposure.equalize_adapthist(G1, clip_limit=0.03)
B4 = exposure.equalize_adapthist(B1, clip_limit=0.03)
# Then reduce blue
B4 = np.clip(B4 * 0.80, 0, 1)
rgb4 = np.dstack([R4, G4, B4])

# Save all 4 methods as a comparison grid
fig, axes = plt.subplots(2, 2, figsize=(20, 16), dpi=300,
                          facecolor='black')
fig.patch.set_facecolor('black')

titles = [
    'Method 1: Per-band p2-p98 stretch',
    'Method 2: Stretch + Gamma 1.4',
    'Method 3: White balance (B×0.82, R×1.10)',
    'Method 4: CLAHE + blue reduction'
]
images = [rgb1, rgb2, rgb3, rgb4]

for ax, img, title in zip(axes.flat, images, titles):
    ax.imshow(img, interpolation='nearest', origin='upper')
    ax.set_title(title, color='white', fontsize=11, pad=6)
    ax.set_axis_off()

plt.tight_layout(pad=0.5)
import os
os.makedirs('output', exist_ok=True)
plt.savefig('output/satellite_comparison.png',
            dpi=300, bbox_inches='tight',
            facecolor='black')
plt.close()
print("satellite_comparison.png saved")

# Also save Method 3 as the main corrected preview
# (white balance usually works best for urban Sentinel data)
fig, ax = plt.subplots(1, 1, figsize=(16, 13), dpi=600,
                        facecolor='black')
ax.imshow(rgb3, interpolation='nearest', origin='upper')
ax.set_axis_off()
fig.subplots_adjust(left=0, right=1, top=1, bottom=0)
plt.savefig('output/hsr_satellite_corrected.png',
            dpi=600, bbox_inches='tight',
            pad_inches=0, facecolor='black')
plt.close()
print("hsr_satellite_corrected.png saved")

# Print which method looks most natural
print("\nBand ratio analysis:")
r_mean = r_raw[~nodata_mask].mean()
g_mean = g_raw[~nodata_mask].mean()
b_mean = b_raw[~nodata_mask].mean()
print(f"  R:G:B ratio = {r_mean/g_mean:.2f} : 1.00 : {b_mean/g_mean:.2f}")
if b_mean > r_mean * 1.3:
    print("  → Blue band is dominant — "
          "likely NIR/SWIR false color composite")
    print("  → White balance correction recommended")
else:
    print("  → Bands roughly balanced — "
          "stretching should give natural color")
