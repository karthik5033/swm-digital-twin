import os
import json
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Polygon, MultiPolygon, Point
import networkx as nx
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

# =====================================================================
# SMART WASTE MANAGEMENT DIGITAL TWIN — CORE PIPELINE
# =====================================================================

class WasteDigitalTwin:
    def __init__(self, ward_shp, roads_shp, infra_json):
        self.ward_path = ward_shp
        self.roads_path = roads_shp
        self.infra_path = infra_json
        
        # Data containers
        self.ward = None
        self.roads = None
        self.infra = None
        self.grid = None
        self.graph = None
        
        # Configuration
        self.grid_size = 0.003  # approx 300m in EPSG:4326
        self.crs = "EPSG:4326"
        
    # ---------------------------------------------------------
    # PHASE 1: QGIS DATA PREPARATION (Scripted)
    # ---------------------------------------------------------
    def load_and_prepare(self):
        print("PHASE 1: Loading GIS layers...")
        self.ward = gpd.read_file(self.ward_path).to_crs(self.crs)
        self.roads = gpd.read_file(self.roads_path).to_crs(self.crs)
        
        with open(self.infra_path, 'r') as f:
            infra_data = json.load(f)
        
        # Convert infra to GeoDataFrame
        self.infra = gpd.GeoDataFrame(
            infra_data, 
            geometry=gpd.points_from_xy(
                [d['lon'] for d in infra_data], 
                [d['lat'] for d in infra_data]
            ),
            crs=self.crs
        )
        # Do not clip infra to ward boundary, as dumpyards are usually outside the city/ward.
        print(f"Loaded {len(self.roads)} road segments and {len(self.infra)} infra points.")

    def create_analysis_grid(self):
        print(f"PHASE 1: Creating {int(self.grid_size*111000)}m analysis grid...")
        xmin, ymin, xmax, ymax = self.ward.total_bounds
        
        cols = list(np.arange(xmin, xmax + self.grid_size, self.grid_size))
        rows = list(np.arange(ymin, ymax + self.grid_size, self.grid_size))
        
        polygons = []
        for x in cols:
            for y in rows:
                polygons.append(Polygon([(x, y), (x + self.grid_size, y), (x + self.grid_size, y + self.grid_size), (x, y + self.grid_size)]))
        
        grid = gpd.GeoDataFrame({'geometry': polygons}, crs=self.crs)
        self.grid = gpd.clip(grid, self.ward)
        self.grid['zone_id'] = range(len(self.grid))
        print(f"Created {len(self.grid)} analysis zones.")

    # ---------------------------------------------------------
    # PHASE 2: FEATURE ENGINEERING
    # ---------------------------------------------------------
    def engineer_features(self):
        print("PHASE 2: Computing zone features...")
        
        # Map highway types to weights
        # trunk=5, primary=4, secondary=3, tertiary=2.5, residential=2, footway=0
        weights = {
            'trunk': 5, 'primary': 4, 'secondary': 3, 
            'tertiary': 2.5, 'residential': 2, 
            'service': 1, 'path': 0, 'footway': 0, 'steps': 0
        }
        
        self.roads['weight'] = self.roads['highway'].map(weights).fillna(1)
        
        # Spatial join roads to grid
        joined = gpd.sjoin(self.roads, self.grid, how='inner', predicate='intersects')
        
        # Aggregate stats per zone
        zone_stats = joined.groupby('zone_id').agg({
            'weight': ['sum', 'mean', 'count'],
        })
        zone_stats.columns = ['road_weight_sum', 'road_weight_avg', 'road_count']
        
        self.grid = self.grid.merge(zone_stats, on='zone_id', how='left').fillna(0)
        
        # Calculate scores
        # 1. Population Estimation
        # Population = road_count * factor (simulated proxy)
        self.grid['population'] = (self.grid['road_count'] * 150).astype(int)
        
        # 2. Commercial Score
        # High weight roads + road density
        self.grid['commercial_score'] = (self.grid['road_weight_sum'] * 0.4).round(2)
        
        # 3. Accessibility Score
        self.grid['accessibility_score'] = (self.grid['road_weight_avg'] * 2).clip(0, 10).round(2)
        
        # 4. Dump Risk Score
        # Risk = High population + Low Accessibility
        self.grid['dump_risk_score'] = (
            (self.grid['population'] / self.grid['population'].max()) * 5 + 
            (10 - self.grid['accessibility_score']) * 0.5
        ).round(2)

        print("Feature engineering complete.")

    # ---------------------------------------------------------
    # PHASE 3: WASTE PREDICTION MODEL
    # ---------------------------------------------------------
    def predict_waste(self, rainfall=5, is_festival=False):
        print(f"PHASE 3: Predicting waste (Rainfall={rainfall}mm, Festival={is_festival})...")
        
        # Base Prediction Formula
        # Waste = (0.5 * pop) + (2 * comm)
        self.grid['waste_generated'] = (
            (0.5 * self.grid['population']) + 
            (2.0 * self.grid['commercial_score'])
        )
        
        # Environmental / Social Multipliers
        if rainfall > 10:
            self.grid['waste_generated'] *= 1.15
            
        if is_festival:
            self.grid['waste_generated'] *= 1.25
            
        self.grid['waste_generated'] = self.grid['waste_generated'].round(2)
        total = self.grid['waste_generated'].sum()
        print(f"Total predicted waste: {total:.2f} kg/day")

    # ---------------------------------------------------------
    # PHASE 4: INFRASTRUCTURE SIMULATION
    # ---------------------------------------------------------
    def simulate_capacity(self, days=7):
        print(f"PHASE 4: Simulating processing capacity for {days} days...")
        
        # Setup infrastructure states
        self.infra['current_fill'] = np.random.uniform(10, 50, len(self.infra))
        self.infra['capacity'] = 5000  # 5 tons max per center
        self.infra['processed_per_day'] = 800  # 800kg
        
        simulation_history = []
        
        for day in range(days):
            daily_waste = self.grid['waste_generated'].sum()
            
            # Simple capacity update
            avg_fill = self.infra['current_fill'].mean()
            self.infra['current_fill'] = (self.infra['current_fill'] + (daily_waste / len(self.infra)) - self.infra['processed_per_day']).clip(0, 5000)
            
            status = "NORMAL"
            if self.infra['current_fill'].max() > 4000:
                status = "OVERLOADED"
                
            simulation_history.append({
                'day': day + 1,
                'avg_fill': self.infra['current_fill'].mean(),
                'status': status
            })
            
        print("Simulation complete.")
        return simulation_history

    # ---------------------------------------------------------
    # PHASE 5: ROUTE OPTIMIZATION
    # ---------------------------------------------------------
    def optimize_routes(self):
        print("PHASE 5: Building road graph...")
        G = nx.Graph()
        
        # Filter roads for trucks
        mask = ~self.roads['highway'].isin(['footway', 'path', 'steps', 'pedestrian'])
        route_roads = self.roads[mask]
        
        for idx, road in route_roads.iterrows():
            geom = road.geometry
            if geom.geom_type == 'LineString':
                u, v = geom.coords[0], geom.coords[-1]
                dist = geom.length * 111000 
                G.add_edge(u, v, weight=dist, name=road.get('name', 'unnamed'))
        
        self.graph = G
        print(f"Road network graph generated ({len(G.nodes)} nodes).")
        return G

    # ---------------------------------------------------------
    # PHASE 7: VISUALIZATION
    # ---------------------------------------------------------
    def visualize(self, output_path='digital_twin_hsr.png'):
        print(f"PHASE 7: Generating visualization to {output_path}...")
        if self.grid is None or self.grid.empty:
            print("ERROR: Grid is empty, cannot visualize.")
            return

        fig, axes = plt.subplots(1, 2, figsize=(20, 10))
        
        # 1. Waste Heatmap
        self.grid.plot(column='waste_generated', ax=axes[0], legend=True, cmap='YlOrRd', 
                       legend_kwds={'label': "Waste Generated (kg/day)"})
        
        if not self.infra.empty:
            self.infra.plot(ax=axes[0], color='blue', markersize=50, label='Waste Centers', marker='^')
        
        axes[0].set_title("HSR Layout: Waste Generation Heatmap", fontsize=15)
        axes[0].axis('off')
        
        # 2. Accessibility/Network
        if not self.roads.empty:
            self.roads.plot(ax=axes[1], color='#cccccc', linewidth=0.5, alpha=0.5)
            
        self.grid.plot(column='accessibility_score', ax=axes[1], legend=True, cmap='viridis_r',
                       alpha=0.6, legend_kwds={'label': "Accessibility Score"})
        axes[1].set_title("HSR Layout: Infrastructure Accessibility", fontsize=15)
        axes[1].axis('off')
        
        plt.tight_layout()
        plt.savefig(output_path, dpi=300)
        print("Final visualization saved.")

# =====================================================================
# EXECUTION PIPELINE
# =====================================================================

if __name__ == "__main__":
    # Define paths
    BASE_DIR = r"D:\coding_files\Projects\AstraSky"
    WARD_SHP = os.path.join(BASE_DIR, "data", "spaceTech Dataset", "HSR Layout Ward Boundary", "HSR_Layout.shp")
    ROADS_SHP = os.path.join(BASE_DIR, "data", "spaceTech Dataset", "HSR Layout Road Network", "HSR Layout.shp")
    INFRA_JSON = os.path.join(BASE_DIR, "data", "dump_sites.json")

    # Initialize Twin
    twin = WasteDigitalTwin(WARD_SHP, ROADS_SHP, INFRA_JSON)
    
    # Run Pipeline
    twin.load_and_prepare()
    twin.create_analysis_grid()
    twin.engineer_features()
    twin.predict_waste(rainfall=12, is_festival=True)
    history = twin.simulate_capacity(days=5)
    
    print("\n--- Simulation Status ---")
    for step in history:
        print(f"Day {step['day']}: Avg Fill {step['avg_fill']:.1f}kg | Status: {step['status']}")
        
    twin.optimize_routes()
    twin.visualize(os.path.join(BASE_DIR, 'data', 'digital_twin_hsr.png'))
    
    # Save processed data
    twin.grid.drop(columns='geometry').to_csv(os.path.join(BASE_DIR, 'data', 'digital_twin_zones.csv'))
    print("\nSUCCESS: All phases of the Smart Waste Digital Twin are complete.")
