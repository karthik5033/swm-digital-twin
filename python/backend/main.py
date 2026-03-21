from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import geopandas as gpd
import pandas as pd
import numpy as np
import networkx as nx
import json
import os
import shutil
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

app = FastAPI(
    title="AstraCity API",
    description="Smart Waste Management Digital Twin HSR Layout",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = "../../public/data"

@app.get("/")
def health_check():
    return {
        "status": "AstraCity API Running",
        "version": "1.0.0",
        "ward": "HSR Layout",
        "buildings": 9471,
        "dumps": 29
    }

@app.get("/ward-stats")
def ward_stats():
    return {
        "ward": "HSR Layout",
        "city": "Bengaluru",
        "area_ha": 704,
        "population": 220000,
        "buildings": 9471,
        "dump_sites": 29,
        "daily_waste_tons": 19.78,
        "route_saving_percent": 75.5,
        "road_coverage_percent": 89,
        "truck_hubs": 4,
        "auto_rickshaws": 12,
        "lake_risk": True,
        "lake_name": "Agara Lake",
        "dumps_near_lake": 3
    }

@app.post("/predict-waste")
def predict_waste(data: dict):
    population = data.get("population", 220000)
    rainfall = data.get("rainfall", 5)
    temperature = data.get("temperature", 28)
    festival = data.get("festival", False)
    festival_type = data.get("festival_type", "none")
    
    festival_multipliers = {
        "diwali": 1.25,
        "ganesh": 1.20,
        "none": 1.0
    }
    festival_factor = festival_multipliers.get(
        festival_type, 1.0
    )
    
    waste_breakdown = {
        "residential": round(8998 * 4 * 0.00045, 2),
        "apartment": round(250 * 20 * 0.00040, 2),
        "commercial": round(137 * 0.0025, 2),
        "it_office": round(39 * 15 * 0.00120, 2),
        "hospital": round(2 * 30 * 0.00400, 2),
        "school": round(15 * 200 * 0.00010, 2)
    }
    
    total_waste = sum(waste_breakdown.values())
    
    if rainfall > 10:
        total_waste *= 1.15
    if festival:
        total_waste *= festival_factor
    
    zones = [
        {"zone": "B2", "buildings": 2189,
         "waste": round(total_waste * 0.258, 2)},
        {"zone": "C3", "buildings": 2082,
         "waste": round(total_waste * 0.243, 2)},
        {"zone": "B3", "buildings": 1734,
         "waste": round(total_waste * 0.202, 2)},
        {"zone": "B1", "buildings": 1383,
         "waste": round(total_waste * 0.161, 2)},
        {"zone": "C2", "buildings": 554,
         "waste": round(total_waste * 0.065, 2)},
        {"zone": "Others", "buildings": 1529,
         "waste": round(total_waste * 0.071, 2)}
    ]
    
    return {
        "total_waste_tons": round(total_waste, 2),
        "rainfall_impact": rainfall > 10,
        "festival_impact": festival,
        "festival_multiplier": festival_factor,
        "breakdown": waste_breakdown,
        "zones": zones,
        "scenario": {
            "normal": round(
                sum(waste_breakdown.values()), 2),
            "monsoon": round(
                sum(waste_breakdown.values()) * 1.15, 2),
            "festival": round(
                sum(waste_breakdown.values()) * 1.25, 2)
        }
    }

@app.post("/simulate-dumpyard")
def simulate_dumpyard(data: dict):
    days = data.get("days", 30)
    incoming = data.get("incoming_waste", 19.78)
    processing_rate = data.get("processing_rate", 0.7)
    
    dumpyards = [
        {"id": "D1", "name": "HSR Main",
         "capacity": 100, "fill": 65},
        {"id": "D2", "name": "Agara",
         "capacity": 80, "fill": 78},
        {"id": "D3", "name": "BDA Complex",
         "capacity": 120, "fill": 45}
    ]
    
    simulation = []
    fills = {d["id"]: d["fill"] for d in dumpyards}
    overflow_days = {}
    
    for day in range(1, days + 1):
        day_data = {"day": day}
        alerts = []
        
        for dump in dumpyards:
            did = dump["id"]
            daily_in = incoming / len(dumpyards)
            processed = daily_in * processing_rate
            fills[did] = min(
                fills[did] + daily_in - processed, 100
            )
            day_data[did] = round(fills[did], 1)
            
            if fills[did] > 80:
                alerts.append({
                    "dumpyard": dump["name"],
                    "fill": round(fills[did], 1),
                    "status": "OVERLOADED"
                })
                if did not in overflow_days:
                    overflow_days[did] = day
        
        day_data["alerts"] = alerts
        simulation.append(day_data)
    
    return {
        "simulation": simulation,
        "overflow_days": overflow_days,
        "summary": {
            "D1_overflow_day": overflow_days.get(
                "D1", "Safe"),
            "D2_overflow_day": overflow_days.get(
                "D2", "Safe"),
            "D3_overflow_day": overflow_days.get(
                "D3", "Safe")
        }
    }

@app.get("/optimize-routes")
def optimize_routes():
    G = nx.Graph()
    
    nodes = {
        "depot": (12.9116, 77.6410),
        "hub_t1": (12.9116, 77.6410),
        "hub_t2": (12.9180, 77.6380),
        "hub_t3": (12.9050, 77.6450),
        "hub_t4": (12.9130, 77.6460),
        "processing": (12.9080, 77.6350),
        "sector1": (12.9150, 77.6430),
        "sector2": (12.9100, 77.6400),
        "sector3": (12.9200, 77.6420),
        "sector4": (12.9090, 77.6380),
        "sector5": (12.9160, 77.6460),
        "sector6": (12.9130, 77.6390),
        "sector7": (12.9070, 77.6420)
    }
    
    for node, coords in nodes.items():
        G.add_node(node, lat=coords[0], lon=coords[1])
    
    edges = [
        ("depot", "hub_t1", 0.1),
        ("hub_t1", "sector1", 1.8),
        ("hub_t1", "sector2", 1.5),
        ("hub_t1", "hub_t2", 2.1),
        ("hub_t2", "sector3", 1.6),
        ("hub_t2", "sector4", 1.9),
        ("hub_t2", "hub_t3", 2.4),
        ("hub_t3", "sector5", 1.7),
        ("hub_t3", "hub_t4", 2.2),
        ("hub_t4", "sector6", 1.4),
        ("hub_t4", "sector7", 1.6),
        ("hub_t4", "processing", 2.8),
        ("sector1", "sector2", 1.2),
        ("sector3", "sector4", 1.3),
        ("sector5", "sector6", 1.1),
        ("sector6", "sector7", 0.9),
        ("sector2", "hub_t3", 2.0),
        ("sector4", "processing", 3.1)
    ]
    
    for u, v, w in edges:
        G.add_edge(u, v, weight=w)
    
    old_route = [
        "depot", "sector1", "sector3",
        "sector5", "sector2", "sector4",
        "sector6", "sector7", "processing"
    ]
    
    old_distance = sum(
        G[old_route[i]][old_route[i+1]]["weight"]
        for i in range(len(old_route)-1)
        if G.has_edge(old_route[i], old_route[i+1])
    )
    
    optimized = nx.shortest_path(
        G, "depot", "processing", weight="weight"
    )
    opt_distance = nx.shortest_path_length(
        G, "depot", "processing", weight="weight"
    )
    
    savings = round(
        (old_distance - opt_distance) /
        old_distance * 100, 1
    )
    
    return {
        "old_route": old_route,
        "old_distance_km": round(old_distance, 2),
        "optimized_route": optimized,
        "optimized_distance_km": round(opt_distance, 2),
        "savings_percent": savings,
        "annual_fuel_savings_inr": round(
            (old_distance - opt_distance) * 20 * 10 * 365
        ),
        "trucks": 4,
        "autos": 12,
        "road_coverage_before": 45,
        "road_coverage_after": 89
    }

@app.post("/process-satellite")
async def process_satellite(
    file: UploadFile = File(...)
):
    try:
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        try:
            import rasterio
            from sklearn.cluster import DBSCAN
            
            with rasterio.open(temp_path) as src:
                red = src.read(1).astype(float)
                nir = src.read(
                    min(4, src.count)
                ).astype(float)
                transform = src.transform
                
                ndvi = (nir - red) / (
                    nir + red + 1e-10
                )
                threshold = np.percentile(ndvi, 15)
                anomaly = ndvi < threshold
                rows, cols = np.where(anomaly)
                
                if len(rows) > 0:
                    lons, lats = rasterio.transform.xy(
                        transform, rows, cols
                    )
                    coords = np.column_stack(
                        [lats, lons]
                    )
                    clustering = DBSCAN(
                        eps=0.001, min_samples=5
                    ).fit(coords)
                    
                    sites = []
                    for label in set(
                        clustering.labels_
                    ) - {-1}:
                        mask = clustering.labels_ == label
                        ndvi_vals = ndvi[anomaly][mask]
                        risk_score = float(
                            1 - ndvi_vals.mean()
                        )
                        sites.append({
                            "id": int(label),
                            "lat": float(
                                coords[mask,0].mean()
                            ),
                            "lon": float(
                                coords[mask,1].mean()
                            ),
                            "risk": "high" 
                                if risk_score > 0.7 
                                else "medium",
                            "ndvi": round(float(
                                ndvi_vals.mean()
                            ), 3),
                            "area_sqm": int(
                                mask.sum() * 100
                            )
                        })
                    
                    output_path = os.path.join(
                        DATA_PATH, "dump_sites.json"
                    )
                    with open(output_path, "w") as f:
                        json.dump(sites, f)
                    
                    os.remove(temp_path)
                    return {
                        "status": "success",
                        "method": "NDVI+DBSCAN",
                        "dumps_detected": len(sites),
                        "high_risk": sum(
                            1 for s in sites
                            if s["risk"] == "high"
                        ),
                        "medium_risk": sum(
                            1 for s in sites
                            if s["risk"] == "medium"
                        ),
                        "ndvi_threshold": round(
                            float(threshold), 3
                        )
                    }
        
        except Exception as e:
            print(f"Real processing failed: {e}")
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        dumps = int(np.random.uniform(25, 45))
        return {
            "status": "simulated",
            "method": "NDVI+DBSCAN (simulated)",
            "dumps_detected": dumps,
            "high_risk": int(dumps * 0.35),
            "medium_risk": int(dumps * 0.45),
            "low_risk": int(dumps * 0.20),
            "ndvi_threshold": 0.23
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/building-analysis")
def building_analysis():
    try:
        report_path = os.path.join(
            DATA_PATH, "building_report.json"
        )
        with open(report_path) as f:
            report = json.load(f)
        
        waste = {
            "Residential": round(
                report["residential"]["houses"]
                * 4 * 0.00045, 2),
            "Apartment": round(
                report["residential"]["apartments"]
                * 20 * 0.00040, 2),
            "Commercial": round(
                report["key_facilities"]
                ["commercial_retail"] * 0.0025, 2),
            "IT Office": round(
                report["key_facilities"]
                ["offices_it"] * 15 * 0.00120, 2),
            "Hospital": round(
                report["key_facilities"]
                ["hospitals_clinics"] * 30 * 0.004, 2),
            "School": round(
                report["key_facilities"]
                ["schools_colleges"] * 200 * 0.0001, 2)
        }
        
        return {
            "total_buildings": 
                report["total_buildings"],
            "type_summary": 
                report["type_summary"],
            "area_stats": 
                report["area_stats"],
            "waste_by_type": waste,
            "total_daily_waste_tons": round(
                sum(waste.values()), 2),
            "key_facilities": 
                report["key_facilities"],
            "zones": report["zones"]
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/run-digital-twin")
def run_digital_twin(data: dict):
    rainfall = data.get("rainfall", 5)
    festival = data.get("festival", False)
    festival_type = data.get("festival_type", "none")
    days = data.get("days", 7)
    
    waste_data = predict_waste({
        "rainfall": rainfall,
        "festival": festival,
        "festival_type": festival_type
    })
    
    dump_data = simulate_dumpyard({
        "days": days,
        "incoming_waste": 
            waste_data["total_waste_tons"]
    })
    
    route_data = optimize_routes()
    
    return {
        "scenario": {
            "rainfall": rainfall,
            "festival": festival,
            "festival_type": festival_type,
            "days": days
        },
        "waste_prediction": waste_data,
        "dumpyard_simulation": dump_data,
        "route_optimization": route_data,
        "summary": {
            "total_waste": 
                waste_data["total_waste_tons"],
            "critical_dumpyards": len([
                k for k, v in
                dump_data["overflow_days"].items()
                if isinstance(v, int) and v <= 7
            ]),
            "route_savings": 
                route_data["savings_percent"],
            "annual_savings_inr": 
                route_data["annual_fuel_savings_inr"]
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
