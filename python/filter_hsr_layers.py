import geopandas as gpd
import json
import os

print("🗺️ Filtering BBMP layers to HSR Layout")
print("=" * 50)

# Load HSR ward boundary
print("\n📦 Loading HSR boundary...")
ward = gpd.read_file(
    '../data/spaceTech Dataset/'
    'HSR Layout Ward Boundary/HSR_Layout.shp'
)
ward = ward.to_crs('EPSG:4326')
print(f"✅ Ward boundary loaded")

# Files to filter
layers = [
    {
        "input": '../data/shapefiles/Dry waste/Dry Waste Collection,Waste Processing & Landfill Locations/BBMP_Dry_Waste_Collection_Centres.shp',
        "output": '../public/data/hsr_dry_waste_centres.geojson',
        "name": "Dry Waste Centres"
    },
    {
        "input": '../data/shapefiles/Dry waste/Dry Waste Collection,Waste Processing & Landfill Locations/BBMP_BIO-Methanisation.shp',
        "output": '../public/data/hsr_methane_plants.geojson',
        "name": "Bio-methanisation Plants"
    },
    {
        "input": '../data/shapefiles/Dry waste/Dry Waste Collection,Waste Processing & Landfill Locations/BBMP_Waste_Processing_Units.shp',
        "output": '../public/data/hsr_processing_units.geojson',
        "name": "Waste Processing Units"
    },
    {
        "input": '../data/shapefiles/Dry waste/Dry Waste Collection,Waste Processing & Landfill Locations/BBMP_Dumpyards.shp',
        "output": '../public/data/hsr_dumpyards.geojson',
        "name": "Dumpyards"
    }
]

for layer in layers:
    try:
        print(f"\n📦 Processing: {layer['name']}")
        
        # Load layer
        gdf = gpd.read_file(layer['input'])
        if gdf.crs is None:
            gdf = gdf.set_crs('EPSG:4326', allow_override=True)
        else:
            gdf = gdf.to_crs('EPSG:4326')
        print(f"   Total features: {len(gdf)}")
        
        # Filter to HSR Layout only
        hsr_only = gpd.clip(gdf, ward)
        
        print(f"   HSR Layout only: {len(hsr_only)} features")
        
        # Save as GeoJSON
        hsr_only.to_file(
            layer['output'],
            driver='GeoJSON'
        )
        print(f"   ✅ Saved: {layer['output']}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print(f"   Check file path!")

print("\n" + "=" * 50)
print("✅ All layers filtered to HSR Layout!")
print("Copy files to public/data/ folder")
print("=" * 50)
