import geopandas as gpd
import os

os.makedirs('../public/data', exist_ok=True)

dwcc_shp = r'../data/shapefiles/hsr layout/Dry Waste Collection,Waste Processing & Landfill Locations/BBMP_Dry_Waste_Collection_Centres.shp'
if os.path.exists(dwcc_shp):
    gdf = gpd.read_file(dwcc_shp)
    if gdf.crs:
        gdf = gdf.to_crs(epsg=4326)
    gdf.to_file('../public/data/dry_waste_centres.geojson', driver='GeoJSON')
    print('✅ Saved dry_waste_centres.geojson')
else:
    print('❌ DWCC shp not found at', dwcc_shp)

methane_shp = r'../data/shapefiles/hsr layout/Dry Waste Collection,Waste Processing & Landfill Locations/BBMP_BIO-Methanisation.shp'
if os.path.exists(methane_shp):
    gdf = gpd.read_file(methane_shp)
    if gdf.crs:
        gdf = gdf.to_crs(epsg=4326)
    gdf.to_file('../public/data/methane_plants.geojson', driver='GeoJSON')
    print('✅ Saved methane_plants.geojson')
else:
    print('❌ Methane shp not found at', methane_shp)
