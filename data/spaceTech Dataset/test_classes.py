import numpy as np
import rasterio

def test():
    with rasterio.open('HSR_Layout_SD.tif') as src:
        red = src.read(1)
        green = src.read(2)
        blue = src.read(3)
        nodata_mask = (red == 65535)
        
        def norm(b):
            v_min, v_max = b[~nodata_mask].min(), b[~nodata_mask].max()
            n = np.zeros_like(b, dtype=float)
            n[~nodata_mask] = np.clip((b[~nodata_mask].astype(float)-v_min)/(v_max-v_min)*255., 0, 255)
            return n

        r = norm(red)
        g = norm(green)
        b = norm(blue)
    
    br = np.mean([r,g,b], axis=0)
    
    valid = ~nodata_mask
    total = np.sum(valid)
    print("Total valid pixels:", total)
    
    mask_water = (b > np.maximum(r, g) + 5) & (br < 80) & valid
    print("Water %:", np.sum(mask_water)/total*100)
    
    mask_veg = (g > np.maximum(r, b) + 5) & valid
    print("Veg %:", np.sum(mask_veg)/total*100)
    
    mask_bare = (r > g) & (g > b) & (br > 90) & valid
    print("Bare %:", np.sum(mask_bare)/total*100)
    
    mask_rooftop = (br > 130) & valid
    print("Rooftop %:", np.sum(mask_rooftop)/total*100)
    
if __name__ == "__main__":
    test()
