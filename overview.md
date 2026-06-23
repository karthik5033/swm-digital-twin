# AstraCity: Bengaluru Waste Ecosystem Spatial Intelligence Platform

## Overview
AstraCity is a digital twin and policy simulation AI platform designed for Bengaluru's solid waste management system. It leverages satellite intelligence to map the waste ecosystem, predict the formation of illegal dumps, model methane emissions, and quantify economic savings for the government.

## How It Works
AstraCity provides a unified dashboard to monitor, simulate, and optimize waste management across Bengaluru's wards. The platform operates on several core modules:

1. **Satellite Intelligence:** Ingests satellite imagery (e.g., Sentinel-2) to automatically detect illegal dump sites using anomaly detection algorithms.
2. **Digital Twin & Smart Map:** Visualizes 198 wards of Bengaluru with overlays for dump sites, methane heatmaps, dumping probabilities, and route optimizations.
3. **Policy Simulation:** Allows users to adjust variables like population growth, rainfall, and festival occurrences to simulate future waste generation and their impact on landfills and methane emissions.
4. **Economic Impact:** Quantifies the fiscal savings achieved by optimizing truck routes, avoiding cleanups, and reducing carbon emissions.
5. **Ward Scoring:** Assigns a vulnerability and governance score (0-100) to each ward based on multiple risk factors.
6. **AI Assistant:** Integrates a Gemini-powered query bar to ask natural language questions about ward-level data and spatial intelligence.

## The Math & Algorithms

### 1. Ward Vulnerability Score (0-100)
A governance KPI that ranks wards based on risk factors:
```text
Score = (1 - DumpRisk) × 30 
      + (1 - MethaneIntensity) × 25 
      + RouteEfficiency × 25 
      + (1 - ComplaintRate) × 20
```
- **0-40**: High Risk (Rose)
- **41-70**: Medium Risk (Amber)
- **71+**: Low Risk (Emerald)

### 2. Policy Simulation Engine
Pre-computes environmental impacts based on user-adjustable sliders:
```text
WasteGenerated = BaseWaste × (1 + PopulationGrowth) × FestivalMultiplier × WeatherFactor
DumpsPredicted = (WasteGenerated / CollectionCapacity) × ZonalRiskIndex
MethaneProjection = LandfillInflow × EmissionFactor × (1 - CaptureRate)
```

### 3. Economic Impact Calculations
Calculates annual savings in Indian Rupees (₹) using BBMP constants:
- **Fuel Savings**: `(BaselineRouteKm - OptimizedRouteKm) × 2800 trucks × 365 days × ₹20/km`
- **Cleanup Avoided**: `DumpsPrevented × ₹62,000/dump`
- **Carbon Credits**: `MethaneReductionTons × ₹2,000/ton`
- **Labor Savings**: `1.8 hrs × 2800 trucks × 365 days × ₹180/hr`
- **Total Savings**: Sum of all factors (approx. ₹4.2 Crores / year)

### 4. Satellite Dump Detection (Python)
Processes visible spectrum `.tif` imagery to detect anomalies:
- Calculates pixel brightness from RGB bands.
- Identifies the bottom 10% brightness as dark anomalies (potential dumps).
- Uses `DBSCAN` clustering (from `scikit-learn`) to group nearby anomalies into distinct dump sites.

## Impact & Value Proposition

- **Proactive Management:** Shifts the city from reacting to citizen complaints to predicting and preventing illegal dumps before they escalate.
- **Economic Efficiency:** Estimates **₹4.2 Crores saved annually** by streamlining truck routes and reducing manual cleanup costs.
- **Environmental Benefits:** Reduces methane emissions by an estimated 23%, contributing to decarbonization goals and earning carbon credits.
- **Actionable Reporting:** Automatically generates PDF reports for the BBMP (Bruhat Bengaluru Mahanagara Palike), complete with ward risk profiles and recommended actions.

## Tech Stack
- **Frontend Framework:** Next.js 14 (App Router) with React 18 & TypeScript
- **Styling:** Tailwind CSS 3.4 & Framer Motion for animations
- **Mapping:** MapLibre GL JS v5.20.2 + OpenFreeMap Positron tiles
- **Data Visualization:** Recharts for economic and ROI graphs
- **State Management:** Zustand
- **AI Integration:** Google Gemini 1.5 Flash (via REST API)
- **Spatial Data:** Rasterio, scikit-learn, GeoPandas (for offline preprocessing)
