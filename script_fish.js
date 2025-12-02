// Configure AOI bounding box (replace with your AOI later)
const swLon = -123.30;
const swLat = 49.00;
const neLon = -122.90;
const neLat = 49.40;

// Create the map
const map = L.map("map").setView([(swLat+neLat)/2, (swLon+neLon)/2], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

// iNaturalist API (fish = taxon 47178)
const url =
  `https://api.inaturalist.org/v1/observations?taxon_id=47178&nelat=${neLat}&nelng=${neLon}&swlat=${swLat}&swlng=${swLon}&per_page=200`;

fetch(url)
  .then(r => r.json())
  .then(data => {
    data.results.forEach(obs => {
      if (!obs.geojson) return;
      
      const coords = obs.geojson.coordinates.reverse();
      L.circleMarker(coords, {
        radius: 5,
        color: "#0077bb",
        fillColor: "#55ccff",
        fillOpacity: 0.9
      })
      .bindPopup(`
        <strong>${obs.species_guess || "Unknown species"}</strong><br>
        <a href="${obs.uri}" target="_blank">View on iNaturalist</a>
      `)
      .addTo(map);
    });
  });
