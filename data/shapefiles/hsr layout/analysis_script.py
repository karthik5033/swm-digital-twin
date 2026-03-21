import os
import geopandas as gpd
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

data_dir = r"d:\RVCE\4th sem\hsr layout\Dry Waste Collection,Waste Processing & Landfill Locations"
shapefiles = [
    "BBMP_BIO-Methanisation.shp",
    "BBMP_Dry_Waste_Collection_Centres.shp",
    "BBMP_Dumpyards.shp",
    "BBMP_Waste_Processing_Units.shp"
]

report_lines = []
report_lines.append("# Dataset Analysis Report")
report_lines.append("This report contains an analysis of the spatial datasets in the BBMP shapefiles.")

for shp_file in shapefiles:
    file_path = os.path.join(data_dir, shp_file)
    report_lines.append(f"\n## Dataset: {shp_file}")
    
    try:
        gdf = gpd.read_file(file_path)
        report_lines.append(f"**Number of Features**: {len(gdf)}")
        report_lines.append(f"**Coordinate Reference System (CRS)**: {gdf.crs}")
        report_lines.append(f"**Bounding Box**: {gdf.total_bounds}")
        
        report_lines.append(f"\n### Columns")
        for col in gdf.columns:
            dtype = gdf[col].dtype
            report_lines.append(f"- `{col}` ({dtype})")
        
        report_lines.append(f"\n### Sample Data (First 3 rows)")
        sample_df = gdf.drop(columns=['geometry'], errors='ignore').head(3)
        report_lines.append(sample_df.to_markdown())
        
        report_lines.append("\n### Summary Statistics")
        desc = gdf.drop(columns=['geometry'], errors='ignore').describe()
        if not desc.empty:
            report_lines.append(desc.to_markdown())
        else:
            report_lines.append("No numeric columns available for summary statistics.")
            
    except Exception as e:
        report_lines.append(f"**Error reading shapefile**: {e}")

output_report = r"d:\RVCE\4th sem\hsr layout\dataset_analysis_report.md"
with open(output_report, 'w') as f:
    f.write("\n".join(report_lines))

print(f"Analysis completed. Report written to {output_report}")
