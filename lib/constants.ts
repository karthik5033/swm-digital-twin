export const HSR_DATA = {
  area_sq_km: 18.5,
  area_hectares: 1850,
  sectors: 7,

  total_buildings: 9471,
  building_density_per_sqkm: 512,
  building_avg_sqm: 163,
  building_median_sqm: 114.8,
  total_footprint_ha: 154.4,

  road_segments: 2027,
  road_density_per_sqkm: 110,
  
  truck_roads: 352,
  truck_roads_pct: 17.4,
  auto_roads: 1579,
  auto_roads_pct: 77.9,
  total_coverage_pct: 95.3,

  road_breakdown: [
    {type:'Trunk',     count:38,  pct:1.9,  vehicle:'Large Truck'},
    {type:'Primary',   count:10,  pct:0.5,  vehicle:'Large Truck'},
    {type:'Secondary', count:113, pct:5.6,  vehicle:'Truck'},
    {type:'Tertiary',  count:191, pct:9.4,  vehicle:'Truck'},
    {type:'Residential',count:840,pct:41.4, vehicle:'Auto Rickshaw'},
    {type:'Service',   count:179, pct:8.8,  vehicle:'Auto Rickshaw'},
    {type:'Footway',   count:509, pct:25.1, vehicle:'Walk/Handcart'},
    {type:'Path',      count:51,  pct:2.5,  vehicle:'Walk/Handcart'},
  ],

  population_2011: 63033,
  population_2025: 115000,
  growth_rate_pct: 4.5,
  population_density_per_sqkm: 6216,

  daily_waste_tons: 57.5,
  daily_waste_kg: 57500,
  waste_wet_tons: 34.5,
  waste_dry_tons: 20.1,
  waste_other_tons: 2.9,
  waste_per_capita_kg: 0.5,

  dwcc_centers: 16,
  bio_methanisation_units: 2,
  dumpyards: 0,
  dump_sites_detected: 29,
  high_risk_dumps: 10,

  baseline_route_km: 132.44,
  optimized_route_km: 32.41,
  route_improvement_pct: 75.5,
  annual_savings_cr: 4.23,

  ward_name: 'HSR Layout',
  ward_number: '174',
  city: 'Bengaluru',
  data_sources: [
    'Census 2011 Ward 174',
    'OpenStreetMap',
    'CPCB Guidelines',
    'Beegru.com 2025',
    'geoiq.io'
  ]
};
