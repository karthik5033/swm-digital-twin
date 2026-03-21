export const HSR_DATA = {
  area_sq_km: 18.5,
  area_hectares: 1850,
  sectors: 7,

  total_buildings: 9471,
  building_density_per_sqkm: 512,

  road_segments: 2027,
  road_density_per_sqkm: 110,
  truck_roads: 352,
  truck_roads_pct: 17.4,
  auto_roads: 1579,
  auto_roads_pct: 77.9,
  total_coverage_pct: 95.3,

  road_breakdown: [
    {type:'Trunk',count:38,pct:1.9,
     vehicle:'Large Truck',color:'#00d4aa'},
    {type:'Primary',count:10,pct:0.5,
     vehicle:'Large Truck',color:'#00d4aa'},
    {type:'Secondary',count:113,pct:5.6,
     vehicle:'Truck',color:'#22c55e'},
    {type:'Tertiary',count:191,pct:9.4,
     vehicle:'Truck',color:'#22c55e'},
    {type:'Residential',count:840,pct:41.4,
     vehicle:'Auto Rickshaw',color:'#f59e0b'},
    {type:'Service',count:179,pct:8.8,
     vehicle:'Auto Rickshaw',color:'#f59e0b'},
    {type:'Footway',count:509,pct:25.1,
     vehicle:'Walk/Handcart',color:'#6b7280'},
    {type:'Path',count:51,pct:2.5,
     vehicle:'Walk/Handcart',color:'#6b7280'},
  ],

  population_building_based: 46219,
  population_breakdown: {
    houses:     { count: 8998, per_unit: 4,   total: 35992 },
    apartments: { count: 250,  per_unit: 30,  total: 7500  },
    offices:    { count: 39,   per_unit: 15,  total: 585   },
    hospitals:  { count: 2,    per_unit: 50,  total: 100   },
    schools:    { count: 15,   per_unit: 150, total: 2250  },
    others:     { count: 30,   per_unit: 3,   total: 90    },
  },
  population_source: 'Census 2011 Karnataka household size',

  waste_per_capita_kg: 0.5,
  waste_per_capita_source: 'CPCB large city official',
  daily_waste_kg: 23110,
  daily_waste_tons: 23.11,
  daily_waste_display: '23.1 tons',

  waste_wet_tons: 14.19,
  waste_wet_kg: 14188,
  waste_wet_pct: 61,
  waste_wet_label: 'Wet/Compostable',
  waste_wet_source: 'BBMP Chemical Analysis',

  waste_dry_tons: 6.98,
  waste_dry_kg: 6977,
  waste_dry_pct: 30,
  waste_dry_label: 'Dry/Recyclable',
  waste_dry_source: 'CPCB 59-cities study',

  waste_hazardous_tons: 1.16,
  waste_hazardous_kg: 1163,
  waste_hazardous_pct: 5,
  waste_hazardous_label: 'Hazardous',

  waste_other_tons: 0.93,
  waste_other_kg: 930,
  waste_other_pct: 4,
  waste_other_label: 'Street Sweeping',
  
  // Appended BBMP Infra context for Impact page crashes
  bbmp_wet_plants: 7,
  bbmp_wet_capacity_tpd: 1570,
  bbmp_bio_plants: 13,
  bbmp_bio_capacity_tpd: 65,
  bengaluru_total_tpd: "3000-3500",

  dwcc_centers: 16,
  bio_methanisation_units: 2,
  dumpyards: 0,
  dump_sites_detected: 29,
  high_risk_dumps: 10,

  baseline_route_km: 132.44,
  optimized_route_km: 32.41,
  route_improvement_pct: 75.5,
  annual_savings_cr: 4.23,
  annual_savings_ops_cr: 4.23,
  annual_savings_carbon_cr: 5.19,
  annual_savings_total_cr: 9.42,
  fuel_savings_cr: 3.28,

  // Methane & Climate (IPCC 2006)
  methane_m3_per_day: 3548,        // 0.25 m³/kg × 14,190 kg
  methane_factor: 0.25,            // IPCC 2006
  co2e_per_day_tons: 71.1,         // CH4 GWP = 28× (IPCC AR5)
  co2e_per_year_tons: 25959,
  energy_kwh_per_day: 21285,       // 6 kWh/m³
  homes_powered_per_day: 7095,
  carbon_credits_cr_per_year: 5.19, // 25959 × ₹2000/ton
  carbon_price_per_ton: 2000,      // India carbon market 2024
  methane_risk_level: 'LOW',
  open_dumpyards: 0,

  ward_name: 'HSR Layout',
  ward_number: '174',
  city: 'Bengaluru',

  data_sources: [
    'CPCB large city rate: 0.5kg/day',
    'Census 2011 Karnataka: 4.0 persons/house',
    'OpenStreetMap: 9,471 buildings',
    'BBMP Chemical Analysis: composition',
    'CPCB 59-cities study: dry waste %',
    'Census 2011 Ward 174: baseline',
  ]
};
