const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const wardScoresPath = path.join(dataDir, 'ward_scores.json');
const wardScores = JSON.parse(fs.readFileSync(wardScoresPath, 'utf8'));

// Center of bangalore: [77.5946, 12.9716]
const startLon = 77.45;
const startLat = 12.85;
const lonStep = 0.05;
const latStep = 0.05;

const features = wardScores.map((ward, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    
    const lon1 = startLon + col * lonStep;
    const lat1 = startLat + row * latStep;
    const lon2 = lon1 + lonStep;
    const lat2 = lat1 + latStep;
    
    return {
        "type": "Feature",
        "properties": {
            "name": ward.name,
            "id": ward.id,
            "zone": ward.zone
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [lon1, lat1],
                [lon2, lat1],
                [lon2, lat2],
                [lon1, lat2],
                [lon1, lat1]
            ]]
        }
    };
});

const geojson = {
    "type": "FeatureCollection",
    "features": features
};

fs.writeFileSync(path.join(dataDir, 'bengaluru_wards.geojson'), JSON.stringify(geojson, null, 2));

// Since Next.js requires Mapbox CSS, let's also ensure Mapbox CSS is loaded in the layout if possible or we can import it in page.tsx
console.log("Dummy GeoJSON created successfully!");
