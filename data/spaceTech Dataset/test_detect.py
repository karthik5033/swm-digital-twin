import numpy as np
import rasterio
from scipy import ndimage
from skimage import filters, color, morphology

def test():
    with rasterio.open('HSR_Layout_SD.tif') as src:
        red = src.read(1)
        green = src.read(2)
        blue = src.read(3)
        v_min, v_max = red[red<65535].min(), red[red<65535].max()
        r = np.clip((red.astype(float)-v_min)/(v_max-v_min)*255., 0, 255).astype(np.uint8)
        v_min, v_max = green[green<65535].min(), green[green<65535].max()
        g = np.clip((green.astype(float)-v_min)/(v_max-v_min)*255., 0, 255).astype(np.uint8)
        v_min, v_max = blue[blue<65535].min(), blue[blue<65535].max()
        b = np.clip((blue.astype(float)-v_min)/(v_max-v_min)*255., 0, 255).astype(np.uint8)
        rgb = np.dstack([r, g, b])

    gray = color.rgb2gray(rgb)
    edges = filters.sobel(gray)
    mask_data = (gray > 0)
    mask_eroded = morphology.binary_erosion(mask_data, morphology.disk(5))
    edges[~mask_eroded] = 0

    thresh = filters.threshold_local(edges, block_size=35, offset=-0.01)
    binary = (edges > thresh) & mask_eroded 
    
    cleaned = morphology.remove_small_objects(binary, min_size=5)
    
    labels, nf = ndimage.label(cleaned)
    s = []
    slices = ndimage.find_objects(labels)
    for i, slc in enumerate(slices):
        if slc is None: continue
        area_px = np.sum(labels[slc] == (i+1))
        if 8 <= area_px <= 2000:
            s.append(area_px)
            
    print("Structures detected:", len(s))

if __name__ == "__main__":
    test()
