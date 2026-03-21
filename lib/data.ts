export async function getMapConfig() {
  const res = await fetch('/data/map_config.json')
  return res.json()
}

export async function getDumpSites() {
  const res = await fetch('/data/dump_sites.json')
  return res.json()
}

export async function getWardBoundary() {
  const res = await fetch('/data/hsr_ward_boundary.geojson')
  return res.json()
}

export async function getRoadNetwork() {
  const res = await fetch('/data/hsr_road_network.geojson')
  return res.json()
}

export async function getTruckRoutes() {
  const res = await fetch('/data/truck_routes.json')
  return res.json()
}

export async function getZoneAnalysis() {
  const res = await fetch('/data/zone_analysis.json')
  return res.json()
}

export async function getBuildings() {
  const res = await fetch('/data/buildings.geojson')
  return res.json()
}

export async function getLULC() {
  const res = await fetch('/data/lulc_classification.json')
  return res.json()
}

export async function getOpenSpaces() {
  const res = await fetch('/data/open_spaces.geojson')
  return res.json()
}
