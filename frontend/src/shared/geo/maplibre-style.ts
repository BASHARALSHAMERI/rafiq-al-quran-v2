import maplibregl, { type Map as MapLibreMap, type StyleSpecification } from "maplibre-gl";

import type { MapMode, SatelliteMapConfig } from "./map-config";

const RTL_PLUGIN_URL = "/mapbox-gl-rtl-text.js";
const SATELLITE_SOURCE = "satellite-imagery";
const SATELLITE_LAYER = "satellite-imagery-layer";

export const ARABIC_NAME_EXPRESSION = [
  "coalesce",
  ["get", "name:ar"],
  ["get", "name"],
  ["get", "name:en"]
] as const;

let rtlPluginPromise: Promise<void> | null = null;

export function ensureMapLibreRtl() {
  const status = maplibregl.getRTLTextPluginStatus();
  if (status === "loaded" || status === "deferred" || status === "requested" || status === "error") {
    return rtlPluginPromise ?? Promise.resolve();
  }

  rtlPluginPromise = maplibregl.setRTLTextPlugin(RTL_PLUGIN_URL, false).catch((error) => {
    rtlPluginPromise = null;
    throw error;
  });
  return rtlPluginPromise;
}

function textFieldUsesName(textField: unknown) {
  return JSON.stringify(textField).includes("name");
}

export function shouldUseArabicNameLabel(layer: { id: string; type?: string; layout?: { "text-field"?: unknown } }) {
  if (layer.type !== "symbol" || !textFieldUsesName(layer.layout?.["text-field"])) return false;
  const id = layer.id.toLowerCase();
  return !/(shield|ref|route-number|housenumber|house-number|building-number|exit|airport-code)/.test(id);
}

export function applyArabicMapLabels(map: MapLibreMap) {
  for (const layer of map.getStyle().layers ?? []) {
    if (shouldUseArabicNameLabel(layer as { id: string; type?: string; layout?: { "text-field"?: unknown } })) {
      map.setLayoutProperty(layer.id, "text-field", ARABIC_NAME_EXPRESSION);
    }
  }
}

export function createSatelliteStyle(config: SatelliteMapConfig): StyleSpecification {
  return {
    version: 8,
    sources: {
      [SATELLITE_SOURCE]: {
        type: "raster",
        tiles: [config.tileUrl],
        tileSize: 256,
        maxzoom: config.maxZoom,
        attribution: config.attribution
      }
    },
    layers: [{ id: SATELLITE_LAYER, type: "raster", source: SATELLITE_SOURCE }]
  };
}

export function applyHybridSatellite(map: MapLibreMap, config: SatelliteMapConfig, mode: MapMode) {
  if (mode === "map") return;
  if (!map.getSource(SATELLITE_SOURCE)) {
    const before = map.getStyle().layers?.[0]?.id;
    map.addSource(SATELLITE_SOURCE, {
      type: "raster",
      tiles: [config.tileUrl],
      tileSize: 256,
      maxzoom: config.maxZoom,
      attribution: config.attribution
    });
    map.addLayer({ id: SATELLITE_LAYER, type: "raster", source: SATELLITE_SOURCE }, before);
  }

  if (mode !== "hybrid") return;
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.id === SATELLITE_LAYER) continue;
    if (layer.type === "background") map.setPaintProperty(layer.id, "background-opacity", 0);
    if (layer.type === "fill") map.setPaintProperty(layer.id, "fill-opacity", 0.16);
    if (layer.type === "hillshade") map.setLayoutProperty(layer.id, "visibility", "none");
  }
}
