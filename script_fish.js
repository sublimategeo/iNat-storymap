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

// ArcGIS Topographic basemap
L.esri.basemapLayer("Topographic").addTo(map);

// Optional AOI rectangle
L.rectangle(
    [
        [swLat, swLon],
        [neLat, neLon]
    ],
    { color: "#666", weight: 1, fillOpacity: 0 }
).addTo(map);

// Attribution for SVG icons
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
        iconUrl: "icons/color_fish_1.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    dolly_varden: L.icon({
        iconUrl: "icons/color_fish_2.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    rainbow_trout: L.icon({
        iconUrl: "icons/color_fish_3.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    coastal_cutthroat: L.icon({
        iconUrl: "icons/color_fish_4.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    steelhead: L.icon({
        iconUrl: "icons/color_fish_5.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    coho: L.icon({
        iconUrl: "icons/color_fish_6.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    sculpin: L.icon({
        iconUrl: "icons/color_fish_7.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    }),
    unknown: L.icon({
        iconUrl: "icons/unknown_fish.svg",
        iconSize,
        iconAnchor,
        popupAnchor
    })
};


// Species -> icon
function classifySpeciesName(nameRaw) {
    const name = (nameRaw || "").toLowerCase().trim();

    if (!name) return "unknown";

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

function iconForSpecies(nameRaw) {
    const key = classifySpeciesName(nameRaw);
    return icons[key] || icons.unknown;
}


// --- Legend ---
const legendItems = [
    { key: "coho", label: "Coho Salmon" },
    { key: "coastal_cutthroat", label: "Coastal Cutthroat Trout" },
    { key: "cutthroat", label: "Cutthroat Trout" },
    { key: "rainbow_trout", label: "Rainbow Trout" },
    { key: "steelhead", label: "Steelhead" },
    { key: "dolly_varden", label: "Dolly Varden" },
    { key: "sculpin", label: "Sculpin (General)" },
    { key: "unknown", label: "Others" }
];

const legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend leaflet-control");
    div.innerHTML = "<h4>Species</h4>";

    legendItems.forEach((item) => {
        const icon = icons[item.key];
        if (!icon) return;

        div.innerHTML += `
      <div class="legend-row">
        <img src="${icon.options.iconUrl}" width="18" height="18" alt="${item.label}">
        <span>${item.label}</span>
      </div>
    `;
    });

    L.DomEvent.disableClickPropagation(div);
    return div;
};

legend.addTo(map);

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

            const nameForClass =
                (obs.taxon &&
                    (obs.taxon.preferred_common_name || obs.taxon.name)) ||
                obs.species_guess ||
                "";

            const icon = iconForSpecies(nameForClass);

            L.marker(coords, { icon: icon })
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

// --- Load BC Provincial Observations (STATIC HOSTED FEATURE LAYER) ---

const bcLayerUrl = "https://services7.arcgis.com/MNgXxsTORgPk9EjE/arcgis/rest/services/fish_known_obs_20251202/FeatureServer/0"

L.esri.featureLayer({
    url: bcLayerUrl,
    // optional: limit to the 8 species of interest
    // where: "SPECIES_NAME IN ('Cutthroat Trout','Dolly Varden','Rainbow Trout'," +
    //        "'Coastal Cutthroat Trout','Steelhead','Fish Unidentified Species'," +
    //        "'Coho Salmon','Sculpin (General)')",

    pointToLayer: function (feature, latlng) {
        const attrs = feature.properties || feature.attributes || {};

        // BC species name column
        const speciesName = attrs.SPECIES_NAME || "";

        // Use the same classifier + icon system as iNat
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




