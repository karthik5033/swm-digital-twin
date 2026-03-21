import json, os

MASTER = {
  "ward": "HSR Layout",
  "ward_number": "174",
  "city": "Bengaluru",
  "zone": "Bengaluru South",
  
  "area": {
    "sq_km": 18.5,
    "hectares": 1850,
    "source": "Road network analysis"
  },
  
  "population": {
    "building_based": 46219,
    "breakdown": {
      "houses": {"count":8998,"per_unit":4.0,
                 "total":35992},
      "apartments": {"count":250,"per_unit":30,
                     "total":7500},
      "offices": {"count":39,"per_unit":15,
                  "total":585},
      "hospitals": {"count":2,"per_unit":50,
                    "total":100},
      "schools": {"count":15,"per_unit":150,
                  "total":2250},
      "others": {"count":30,"per_unit":3,
                 "total":90}
    },
    "method": "Buildings x Census 2011 Karnataka",
    "source": "OpenStreetMap + Census 2011"
  },
  
  "waste": {
    "per_capita_kg": 0.5,
    "per_capita_source": "CPCB large city official",
    "daily_kg": 23110,
    "daily_tons": 23.11,
    "display": "23.1 tons/day",
    "composition": {
      "wet_pct": 61,
      "wet_tons": 14.10,
      "wet_dest": "2 Bio-methanisation units",
      "dry_pct": 30,
      "dry_tons": 6.93,
      "dry_dest": "16 DWCC centres",
      "haz_pct": 5,
      "haz_tons": 1.16,
      "haz_dest": "Special contractor",
      "other_pct": 4,
      "other_tons": 0.92,
      "other_dest": "Street sweeping"
    },
    "composition_source": "BBMP 2013 Chemical Analysis",
    "landfill_diversion_pct": 80
  },
  
  "buildings": {
    "total": 9471,
    "density_per_sqkm": 512,
    "avg_sqm": 163,
    "footprint_ha": 154.4,
    "residential_pct": 94.8,
    "source": "OpenStreetMap"
  },
  
  "roads": {
    "total_segments": 2027,
    "density_per_sqkm": 110,
    "truck_segments": 352,
    "truck_pct": 17.4,
    "auto_segments": 1579,
    "auto_pct": 77.9,
    "coverage_pct": 95.3,
    "breakdown": [
      {"type":"Trunk","count":38,"pct":1.9,
       "vehicle":"Large Truck"},
      {"type":"Primary","count":10,"pct":0.5,
       "vehicle":"Large Truck"},
      {"type":"Secondary","count":113,"pct":5.6,
       "vehicle":"Truck"},
      {"type":"Tertiary","count":191,"pct":9.4,
       "vehicle":"Truck"},
      {"type":"Residential","count":840,"pct":41.4,
       "vehicle":"Auto Rickshaw"},
      {"type":"Service","count":179,"pct":8.8,
       "vehicle":"Auto Rickshaw"},
      {"type":"Footway","count":509,"pct":25.1,
       "vehicle":"Walk/Handcart"},
      {"type":"Path","count":51,"pct":2.5,
       "vehicle":"Walk/Handcart"}
    ],
    "source": "OpenStreetMap hsr_road_network.geojson"
  },
  
  "infrastructure": {
    "dwcc_count": 16,
    "dwcc_capacity_tpd_each": 2.5,
    "dwcc_total_capacity_tpd": 40,
    "dwcc_utilisation_pct": 17.5,
    "bio_meth_units": 2,
    "bio_meth_capacity_tpd": 10,
    "dumpyards": 0,
    "sectors": 7,
    "swachagraha_kalika_kendra": True,
    "kudlu_biogas_plant": "Under construction"
  },
  
  "satellite": {
    "dump_sites": 29,
    "high_risk": 10,
    "medium_risk": 3,
    "low_risk": 16,
    "lulc_buildup_pct": 61.9,
    "lulc_vegetation_pct": 1.2,
    "image": "HSR_Layout_SD.tif",
    "pixels": "1002x740",
    "bands": 3
  },
  
  "methane": {
    "wet_waste_tons": 14.19,
    "ch4_m3_day": 3548,
    "ch4_tons_day": 2.54,
    "co2e_tons_day": 71.1,
    "co2e_tons_year": 25959,
    "energy_kwh_day": 21285,
    "homes_powered": 7095,
    "carbon_credits_cr": 5.19,
    "risk": "LOW",
    "open_dumpyards": 0,
    "source": "IPCC 2006 + BBMP"
  },
  
  "zones": {
    "total": 36,
    "active": 36,
    "high_risk": 8,
    "medium_risk": 11,
    "low_risk": 17,
    "grid_size_m": 500,
    "top_zones": ["Z30","Z29","Z24",
                  "Z22","Z08"]
  },
  
  "routes": {
    "baseline_km": 132.44,
    "optimized_km": 32.41,
    "improvement_pct": 75.5,
    "truck_routes": 3,
    "source": "NetworkX VRP on OSM roads"
  },
  
  "economics": {
    "route_savings_cr": 3.28,
    "cleanup_savings_cr": 0.45,
    "labor_savings_cr": 0.38,
    "other_savings_cr": 0.12,
    "operational_total_cr": 4.23,
    "carbon_credits_cr": 5.19,
    "total_value_cr": 9.42,
    "scale_198_wards_cr": 1865,
    "source": "BBMP cost data + IPCC"
  },
  
  "data_sources": [
    "OpenStreetMap — buildings + roads",
    "Census 2011 Ward 174 Karnataka",
    "CPCB official — 0.5kg/capita/day",
    "BBMP 2013 Chemical Analysis",
    "BBMP official — bbmp.gov.in",
    "IPCC 2006 Guidelines",
    "IPCC AR5 — CH4 GWP=28",
    "India Carbon Market 2024",
    "hsrcitizenforum.in",
    "ceeindia.org/hsr-swm",
    "data.opencity.in",
    "Wikipedia — HSR Layout",
    "Deccan Herald — Kudlu plant",
    "Beegru.com — HSR 2025 study",
    "geoiq.io — population data",
    "HSR_Layout_SD.tif — satellite"
  ]
}

with open("public/data/master_constants.json",
          "w") as f:
    json.dump(MASTER, f, indent=2)

print("master_constants.json saved")
print("\nKey values:")
print(f"  Population:    {MASTER['population']['building_based']:,}")
print(f"  Daily waste:   {MASTER['waste']['daily_tons']} tons")
print(f"  Buildings:     {MASTER['buildings']['total']:,}")
print(f"  Roads:         {MASTER['roads']['total_segments']:,}")
print(f"  Dump sites:    {MASTER['satellite']['dump_sites']}")
print(f"  Zones:         {MASTER['zones']['active']}")
print(f"  CH4/day:       {MASTER['methane']['ch4_m3_day']:,} m³")
print(f"  Carbon credits: ₹{MASTER['methane']['carbon_credits_cr']} Cr")
print(f"  Total value:   ₹{MASTER['economics']['total_value_cr']} Cr")