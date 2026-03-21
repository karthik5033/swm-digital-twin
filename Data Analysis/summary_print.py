import json
with open(r'..\public\data\optimized_routes.json') as f:
    d = json.load(f)

print("=== OVERALL SUMMARY ===")
s = d['summary']
print(f"  Total Zones  : {s['total_zones']}")
print(f"  Total Waste  : {s['total_waste_kg_day']:,} kg/day ({s['total_waste_kg_day']/1000:.1f} tons/day)")
print(f"  Total Vehicles: {s['total_vehicles_needed']}")
print(f"  DWCC count   : {s['dwcc_count']}")
print()
print(f"{'Sector':<14} {'Zones':>5} {'Waste kg/d':>11} {'Vehicles':>9} {'DWCC':>10} {'AvgDist km':>11}")
print("-" * 66)
for row in sorted(d['sector_routes'], key=lambda x: x['sector']):
    print(f"  {row['sector']:<12} {row['zone_count']:>5} {row['total_waste_kg_day']:>11.1f} {row['vehicles_needed']:>9} {row['primary_dwcc']:>10} {row['avg_distance_to_dwcc_km']:>11.2f}")
