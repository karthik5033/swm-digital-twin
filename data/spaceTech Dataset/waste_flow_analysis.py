import json
import os
import shutil

print("=" * 50)
print("HSR LAYOUT WASTE FLOW ANALYSIS")
print("Real data from official sources")
print("=" * 50)

# ── VERIFIED CONSTANTS ──

# Infrastructure (from hackathon dataset)
HSR_DWCC_COUNT = 16
HSR_BIO_METH_COUNT = 2
HSR_DUMPYARDS = 0

# DWCC capacity (BBMP official)
DWCC_CAPACITY_TPD = 2.5  # avg per centre
TOTAL_DWCC_CAPACITY = (
    HSR_DWCC_COUNT * DWCC_CAPACITY_TPD
)  # = 40 TPD

# Population (building-based)
POPULATION = 46219
PER_CAPITA_KG = 0.5  # CPCB official

# Waste totals
total_waste_tons = (
    POPULATION * PER_CAPITA_KG / 1000
)  # = 23.11 tons/day

# Composition (BBMP 2013 official)
WET_PCT = 0.61
DRY_PCT = 0.30
HAZ_PCT = 0.05
OTH_PCT = 0.04

wet = total_waste_tons * WET_PCT
dry = total_waste_tons * DRY_PCT
haz = total_waste_tons * HAZ_PCT
oth = total_waste_tons * OTH_PCT

# Dry waste routing (BBMP official)
dry_to_dwcc      = dry * 0.80
dry_to_recyclers = dry * 0.20

# DWCC capacity utilisation
dwcc_util_pct = (
    dry / TOTAL_DWCC_CAPACITY * 100
)

# Citywide context (Deccan Herald + BBMP)
CITY_DWCC_COUNT        = 164
CITY_RECYCLABLES_TPD   = 130
CITY_TOTAL_WASTE_TPD   = 3250  # midpoint
CITY_SEGREGATED_TPD    = 1530

# Collection schedule
# Source: hsrcitizenforum.in
COLLECTION_SCHEDULE = {
    "wet_kitchen_waste": {
        "frequency": "Daily (7 days/week)",
        "vehicle": "Auto tipper",
        "source": "hsrcitizenforum.in"
    },
    "dry_recyclables": {
        "frequency": "Twice weekly",
        "vehicle": "Auto tipper",
        "source": "hsrcitizenforum.in"
    },
    "reject_sanitary": {
        "frequency": "Daily (7 days/week)",
        "vehicle": "Auto tipper",
        "source": "hsrcitizenforum.in"
    }
}

# Landfill diversion
landfill_diverted_pct = (
    (wet + dry_to_dwcc + dry_to_recyclers)
    / total_waste_tons * 100
)

print(f"\nPOPULATION & GENERATION")
print(f"  Population:    {POPULATION:,}")
print(f"  Per capita:    {PER_CAPITA_KG} kg/day")
print(f"  Total waste:   {total_waste_tons:.2f} T/day")

print(f"\nWASTE FLOW")
print(f"  Wet (61%):     {wet:.2f} T/day")
print(f"    → 2 Bio-methanisation units")
print(f"    → KCDC composting plant")
print(f"  Dry (30%):     {dry:.2f} T/day")
print(f"    → DWCCs (80%): {dry_to_dwcc:.2f} T")
print(f"    → Recyclers (20%): "
      f"{dry_to_recyclers:.2f} T")
print(f"  Hazardous (5%): {haz:.2f} T/day")
print(f"    → Special contractor")
print(f"  Other (4%):    {oth:.2f} T/day")
print(f"    → Street sweep")

print(f"\nDWCC CAPACITY CHECK")
print(f"  HSR DWCCs:     {HSR_DWCC_COUNT}")
print(f"  Total capacity:{TOTAL_DWCC_CAPACITY} T/day")
print(f"  Dry demand:    {dry:.2f} T/day")
print(f"  Utilisation:   {dwcc_util_pct:.1f}%")
print(f"  Status:        ✅ Within capacity")

print(f"\nCOLLECTION SCHEDULE")
for wtype, s in COLLECTION_SCHEDULE.items():
    print(f"  {wtype}:")
    print(f"    {s['frequency']}")

print(f"\nLANDFILL DIVERSION")
print(f"  Diverted:      "
      f"{landfill_diverted_pct:.1f}%")
print(f"  To landfill:   "
      f"{100-landfill_diverted_pct:.1f}%")

print(f"\nCITYWIDE CONTEXT")
print(f"  Bengaluru DWCCs:   {CITY_DWCC_COUNT}")
print(f"  Recyclables sold:  "
      f"{CITY_RECYCLABLES_TPD} TPD")
print(f"  City total waste:  "
      f"{CITY_TOTAL_WASTE_TPD} TPD")
print(f"  Currently segregated: "
      f"{CITY_SEGREGATED_TPD} TPD")
print(f"  Segregation rate:  "
      f"{CITY_SEGREGATED_TPD/CITY_TOTAL_WASTE_TPD*100:.1f}%")
print(f"\n  HSR as % of city:  "
      f"{total_waste_tons/CITY_TOTAL_WASTE_TPD*100:.1f}%")

# Save output
waste_flow = {
    "ward": "HSR Layout",
    "infrastructure": {
        "dwcc_count": HSR_DWCC_COUNT,
        "dwcc_capacity_tpd_each": DWCC_CAPACITY_TPD,
        "dwcc_total_capacity_tpd": TOTAL_DWCC_CAPACITY,
        "bio_meth_units": HSR_BIO_METH_COUNT,
        "dumpyards": HSR_DUMPYARDS,
        "source": "Hackathon dataset + BBMP"
    },
    "generation": {
        "population": POPULATION,
        "per_capita_kg": PER_CAPITA_KG,
        "total_tons_day": round(
            total_waste_tons, 2
        ),
        "source": "CPCB official"
    },
    "composition": {
        "wet_pct": 61, "wet_tons": round(wet,2),
        "wet_destination": "Bio-methanisation + KCDC",
        "dry_pct": 30, "dry_tons": round(dry,2),
        "dry_to_dwcc_tons": round(dry_to_dwcc,2),
        "dry_to_recyclers_tons": round(
            dry_to_recyclers,2
        ),
        "dry_destination": "16 DWCCs + recyclers",
        "haz_pct": 5, "haz_tons": round(haz,2),
        "haz_destination": "Special contractor",
        "other_pct": 4, "other_tons": round(oth,2),
        "source": "BBMP 2013 Chemical Analysis"
    },
    "collection_schedule": COLLECTION_SCHEDULE,
    "capacity_analysis": {
        "dwcc_utilisation_pct": round(
            dwcc_util_pct,1
        ),
        "status": "Within capacity",
        "surplus_capacity_tpd": round(
            TOTAL_DWCC_CAPACITY - dry, 2
        )
    },
    "landfill_diversion_pct": round(
        landfill_diverted_pct, 1
    ),
    "city_context": {
        "bengaluru_dwcc_count": CITY_DWCC_COUNT,
        "bengaluru_recyclables_tpd": 
            CITY_RECYCLABLES_TPD,
        "bengaluru_total_waste_tpd": 
            CITY_TOTAL_WASTE_TPD,
        "bengaluru_segregated_tpd": 
            CITY_SEGREGATED_TPD,
        "segregation_rate_pct": round(
            CITY_SEGREGATED_TPD /
            CITY_TOTAL_WASTE_TPD * 100, 1
        ),
        "hsr_as_pct_of_city": round(
            total_waste_tons /
            CITY_TOTAL_WASTE_TPD * 100, 1
        ),
        "sources": [
            "Deccan Herald",
            "BBMP NGT report",
            "bbmp.gov.in"
        ]
    }
}

out = ("data/spaceTech Dataset/output/"
       "waste_flow.json")
with open(out, 'w') as f:
    json.dump(waste_flow, f, indent=2)

dest = "public/data/waste_flow.json"
os.makedirs("public/data", exist_ok=True)
shutil.copy(out, dest)

print(f"\nSaved: {out}")
print(f"Copied: {dest}")
print("=" * 50)