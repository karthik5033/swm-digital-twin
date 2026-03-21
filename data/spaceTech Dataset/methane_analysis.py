import json, os, shutil, math

print("=" * 55)
print("HSR LAYOUT METHANE & BIOGAS ANALYSIS")
print("IPCC 2006 + BBMP Official Data")
print("=" * 55)

# ── INPUTS ──
WET_WASTE_TONS_DAY = 14.19  # 61% of 23.26T
WET_WASTE_KG_DAY   = WET_WASTE_TONS_DAY * 1000

# IPCC 2006 Guidelines
# Controlled anaerobic digestion
CH4_FACTOR_M3_PER_KG = 0.25
CH4_DENSITY_KG_M3    = 0.716
CH4_GWP              = 28    # IPCC AR5

# Energy conversion
KWH_PER_M3_CH4 = 6.0

# Carbon credit price
# India carbon market 2024
CARBON_PRICE_INR_PER_TON = 2000

# ── CALCULATIONS ──
ch4_m3_day   = WET_WASTE_KG_DAY * CH4_FACTOR_M3_PER_KG
ch4_kg_day   = ch4_m3_day * CH4_DENSITY_KG_M3
ch4_tons_day = ch4_kg_day / 1000
co2e_day     = ch4_tons_day * CH4_GWP
energy_kwh   = ch4_m3_day * KWH_PER_M3_CH4

# Annual figures
ch4_tons_year = ch4_tons_day * 365
co2e_year     = co2e_day * 365
energy_kwh_year = energy_kwh * 365
carbon_credits_inr = co2e_year * CARBON_PRICE_INR_PER_TON
carbon_credits_cr  = carbon_credits_inr / 1e7

print(f"\nWET WASTE INPUT")
print(f"  Daily:  {WET_WASTE_TONS_DAY:.2f} tons")
print(f"          ({WET_WASTE_KG_DAY:,.0f} kg)")
print(f"  Source: 61% of 23.26T "
      f"(BBMP 2013 composition)")

print(f"\nMETHANE PRODUCTION (IPCC 2006)")
print(f"  CH4 factor: {CH4_FACTOR_M3_PER_KG}"
      f" m³/kg organic")
print(f"  CH4 daily:  {ch4_m3_day:,.0f} m³/day")
print(f"  CH4 weight: {ch4_kg_day:,.0f} kg/day")
print(f"              {ch4_tons_day:.2f} tons/day")

print(f"\nCLIMATE IMPACT")
print(f"  GWP (CH4):  {CH4_GWP}× CO2")
print(f"  CO2e daily: {co2e_day:.1f} tons/day")
print(f"  CO2e annual:{co2e_year:,.0f} tons/year")

print(f"\nENERGY POTENTIAL")
print(f"  Rate:       {KWH_PER_M3_CH4} kWh/m³")
print(f"  Daily:      {energy_kwh:,.0f} kWh/day")
print(f"  Annual:     {energy_kwh_year:,.0f} kWh/year")
print(f"  Households: ~{energy_kwh/3:.0f}/day "
      f"(avg 3kWh/home)")

print(f"\nCARBON CREDITS (India market)")
print(f"  Rate:    ₹{CARBON_PRICE_INR_PER_TON:,}/ton CO2e")
print(f"  Annual:  ₹{carbon_credits_inr:,.0f}")
print(f"           ₹{carbon_credits_cr:.2f} Crores/year")

print(f"\nHSR LAYOUT METHANE RISK: LOW ✅")
print(f"  Open dumpyards: 0")
print(f"  Controlled bio-meth: 2 units")
print(f"  All CH4 captured: YES")
print(f"  Swachagraha Kalika Kendra: Sector 4")
print(f"  Kudlu biogas plant: Under construction")

# Save
result = {
    "ward": "HSR Layout",
    "analysis_type": "Methane & Biogas",
    "inputs": {
        "wet_waste_tons_day": WET_WASTE_TONS_DAY,
        "wet_waste_kg_day": WET_WASTE_KG_DAY,
        "ch4_factor_ipcc": CH4_FACTOR_M3_PER_KG,
        "source": "IPCC Guidelines 2006, "
                  "Controlled Anaerobic Digestion"
    },
    "methane": {
        "ch4_m3_per_day": round(ch4_m3_day, 1),
        "ch4_kg_per_day": round(ch4_kg_day, 1),
        "ch4_tons_per_day": round(ch4_tons_day, 3),
        "ch4_tons_per_year": round(ch4_tons_year, 1)
    },
    "climate": {
        "gwp_ch4": CH4_GWP,
        "co2e_tons_per_day": round(co2e_day, 1),
        "co2e_tons_per_year": round(co2e_year, 1),
        "source": "IPCC AR5 GWP100"
    },
    "energy": {
        "kwh_per_day": round(energy_kwh, 0),
        "kwh_per_year": round(energy_kwh_year, 0),
        "homes_powered_per_day": round(
            energy_kwh/3, 0
        )
    },
    "carbon_credits": {
        "rate_inr_per_ton": CARBON_PRICE_INR_PER_TON,
        "annual_inr": round(carbon_credits_inr, 0),
        "annual_crores": round(carbon_credits_cr, 2),
        "source": "India carbon market 2024"
    },
    "methane_risk": "LOW",
    "risk_reason": "Zero open dumpyards, "
                   "all CH4 controlled",
    "infrastructure": {
        "bio_meth_units": 2,
        "open_dumpyards": 0,
        "swachagraha_kalika_kendra": {
            "location": "Sector 4 BBMP Park",
            "features": [
                "Community composting",
                "Home composting models",
                "BBMP approved"
            ],
            "source": "Wikipedia + OpenCity"
        },
        "kudlu_biogas": {
            "status": "Under construction",
            "location": "Kudlu, near HSR Layout",
            "source": "Deccan Herald"
        }
    }
}

os.makedirs("public/data", exist_ok=True)
out = ("data/spaceTech Dataset/output/"
       "methane_analysis.json")
with open(out, 'w') as f:
    json.dump(result, f, indent=2)
shutil.copy(out, "public/data/methane_analysis.json")

print(f"\nSaved to public/data/methane_analysis.json")
print("=" * 55)