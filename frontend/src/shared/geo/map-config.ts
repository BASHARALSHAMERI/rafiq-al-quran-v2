export type MapMode = "map" | "satellite" | "hybrid";

export type SatelliteMapConfig = {
  tileUrl: string;
  attribution: string;
  maxZoom: number;
};

export const DEFAULT_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
export const DEFAULT_SATELLITE_TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const DEFAULT_SATELLITE_ATTRIBUTION = "Tiles (c) Esri, Maxar, Earthstar Geographics, and the GIS User Community";
export const DEFAULT_SATELLITE_MAX_ZOOM = 19;

export function getMapStyleUrl() {
  return String(import.meta.env.VITE_MAP_STYLE_URL ?? DEFAULT_MAP_STYLE_URL).trim() || DEFAULT_MAP_STYLE_URL;
}

export function getSatelliteMapConfig(): SatelliteMapConfig {
  const maxZoom = Number(import.meta.env.VITE_SATELLITE_MAX_ZOOM ?? DEFAULT_SATELLITE_MAX_ZOOM);
  return {
    tileUrl: String(import.meta.env.VITE_SATELLITE_TILE_URL ?? DEFAULT_SATELLITE_TILE_URL).trim() || DEFAULT_SATELLITE_TILE_URL,
    attribution: String(import.meta.env.VITE_SATELLITE_ATTRIBUTION ?? DEFAULT_SATELLITE_ATTRIBUTION).trim() || DEFAULT_SATELLITE_ATTRIBUTION,
    maxZoom: Number.isFinite(maxZoom) ? maxZoom : DEFAULT_SATELLITE_MAX_ZOOM
  };
}
