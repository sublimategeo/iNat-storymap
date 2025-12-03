// --- AOI extent ---
const swLon = -123.23407668799925;
const swLat = 49.53559929341239;
const neLon = -123.06988635889327;
const neLat = 49.61080514852734;

const centerLat = (swLat + neLat) / 2;
const centerLon = (swLon + neLon) / 2;

const map = L.map("map", {
    attributionControl: true
}).setView([centerLat, centerLon], 12);

map.attributionControl.addAttribution(
    'Fish icons © <a href="https://www.svgrepo.com/svg/481416/salmon-1" target="_blank">SVG Repo</a>'
);


// --- Fish icons ---
// Fish icons sourced from SVG Repo (https://www.svgrepo.com/)
// License: CC0 1.0 Universal PD Dedication.
// Specific icon: https://www.svgrepo.com/svg/481416/salmon-1

// --- Custom fish icons (local SVGs in repo root) ---
const iconSize = [28, 28];
const iconAnchor = [14, 14];
const popupAnchor = [0, -14];

const icons = {
    cutthroat: L.icon({
        iconUrl: "color_fish_1.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    dolly_varden: L.icon({
        iconUrl: "color_fish_2.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    rainbow_trout: L.icon({
        iconUrl: "color_fish_3.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    coastal_cutthroat: L.icon({
        iconUrl: "color_fish_4.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    steelhead: L.icon({
        iconUrl: "color_fish_5.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    coho: L.icon({
        iconUrl: "color_fish_6.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    sculpin: L.icon({
        iconUrl: "color_fish_7.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    unknown: L.icon({
        iconUrl: "unknown_fish.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    })
};

function classifySpeciesName(nameRaw) {
    const name = (nameRaw || "").toLowerCase().trim();

    if (!name) return "unknown";

    // order: specific → general
    if (name === "coho salmon" || name.includes("coho")) return "coho";
    if (name === "coastal cutthroat trout" || name.includes("coastal cutthroat"))
        return "coastal_cutthroat";
    if (name === "cutthroat trout" || name.includes("cutthroat"))
        return "cutthroat";
    if (name === "dolly varden" || name.includes("dolly varden"))
        return "dolly_varden";
    if (name === "steelhead" || name.includes("steelhead")) return "steelhead";
    if (name === "rainbow trout" || name.includes("rainbow"))
        return "rainbow_trout";
    if (name.startsWith("sculpin")) return "sculpin";
    if (name.startsWith("fish unidentified")) return "unknown";

    return "unknown";
}


// --- Add basemap ---
L.esri.basemapLayer('Topographic').addTo(map);

// --- Draw AOI rectangle (optional) ---
L.rectangle([[swLat, swLon], [neLat, neLon]], { color: "#999", weight: 1, fillOpacity: 0 }).addTo(map);

// Get correct Leaflet icon from a species name
function iconForSpecies(nameRaw) {
    const key = classifySpeciesName(nameRaw);
    return icons[key] || icons.unknown;
}

// --- iNaturalist observations ---

// Coho, Coastal Cutthroat, Rainbow, Dolly Varden, Sculpin
const taxonIds = [53692, 128272, 47516, 68077, 47645];

const inatUrl =
    `https://api.inaturalist.org/v1/observations` +
    `?taxon_ids=${taxonIds.join(",")}` +
    `&nelat=${neLat}&nelng=${neLon}` +
    `&swlat=${swLat}&swlng=${swLon}` +
    `&per_page=200`;

fetch(inatUrl)
    .then((r) => r.json())
    .then((data) => {
        data.results.forEach((obs) => {
            if (!obs.geojson) return;

            const coords = obs.geojson.coordinates.slice().reverse(); // [lat, lon]

            // Try common name first, fall back to scientific, then guess
            const nameForClass =
                (obs.taxon &&
                    (obs.taxon.preferred_common_name || obs.taxon.name)) ||
                obs.species_guess ||
                "";

            const icon = iconForSpecies(nameForClass);

            L.marker(coords, { icon })
                .bindPopup(
                    `
          <strong>${obs.species_guess || "Unknown"}</strong><br/>
          ${obs.taxon
                        ? obs.taxon.preferred_common_name || obs.taxon.name
                        : ""}<br/>
          <a href="${obs.uri}" target="_blank">View on iNaturalist</a>
        `
                )
                .addTo(map);
        });
    })
    .catch((err) => {
        console.error("Error loading iNaturalist data:", err);
    });

// --- Load iNat live observations ---
fetch(url)
    .then(r => r.json())
    .then(data => {
        data.results.forEach(obs => {
            if (!obs.geojson) return;

            const coords = obs.geojson.coordinates.slice().reverse();

            const nameForClass =
                (obs.taxon && (obs.taxon.preferred_common_name || obs.taxon.name)) ||
                obs.species_guess ||
                "";

            const key = classifySpeciesName(nameForClass);
            const icon = icons[key] || icons.default;

            L.marker(coords, { icon })
                .bindPopup(`
          <strong>${obs.species_guess || "Unknown"}</strong><br/>
          ${obs.taxon ? obs.taxon.preferred_common_name || obs.taxon.name : ""}<br/>
          <a href="${obs.uri}" target="_blank">View on iNaturalist</a>
        `)
                .addTo(map);
        });
    });

// --- Load BC Provincial Observations (STATIC HOSTED FEATURE LAYER) ---
const bcLayerUrl = "https://services7.arcgis.com/MNgXxsTORgPk9EjE/arcgis/rest/services/fish_known_obs_20251202/FeatureServer/0";

L.esri.featureLayer({
    url: bcLayerUrl,
    // Use pointToLayer so we can set a custom icon
    pointToLayer: function (feature, latlng) {
        const attrs = feature.properties || feature.attributes || {};

        const speciesName = attrs.SPECIES_NAME || "";

        const icon = iconForSpecies(speciesName);

        return L.marker(latlng, { icon }).bindPopup(
            `
      <strong>${speciesName || "Fish observation"}</strong><br/>
      LIFE_STAGE: ${attrs.LIFE_STAGE || "NA"}<br/>
      SOURCE: ${attrs.SOURCE || "NA"}<br/>
      ID: ${attrs.FISH_OBSERVATION_POINT_ID || ""}`
        );
    }
}).addTo(map);

