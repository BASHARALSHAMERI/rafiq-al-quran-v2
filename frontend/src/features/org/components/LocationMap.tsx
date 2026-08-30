import { useEffect, useRef, useState } from "react";
import { Map, Satellite } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LocationField = "latitude" | "longitude";
type MapLayer = "streets" | "satellite";
export type DevicePosition = { latitude: number; longitude: number; accuracy: number };
type Props = { active: boolean; ar: boolean; latitude: string; longitude: string; allowedRadiusMeters: string; devicePosition?: DevicePosition | null; onChange: (field: LocationField, value: string) => void };
const DEFAULT_CENTER: L.LatLngExpression = [13.5795, 44.0209];
const STORAGE_KEY = "rafiq-map-layer";
const locationIcon = L.divIcon({
  className: "rafiq-location-marker",
  html: `<svg width="38" height="48" viewBox="0 0 38 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M19 46C16.8 40.8 4 29.8 4 18.5C4 10.5 10.7 4 19 4s15 6.5 15 14.5C34 29.8 21.2 40.8 19 46Z" fill="#059669" stroke="#fff" stroke-width="3"/><circle cx="19" cy="18.5" r="6" fill="#fff"/><circle cx="19" cy="18.5" r="2.5" fill="#047857"/></svg>`,
  iconSize: [38, 48], iconAnchor: [19, 46], tooltipAnchor: [0, -42],
});
const parseLocation = (latitude: string, longitude: string) => {
  if (!latitude.trim() || !longitude.trim()) return null;
  const lat = Number(latitude); const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) return null;
  return { lat, lng };
};
const savedLayer = (): MapLayer => typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "satellite" ? "satellite" : "streets";

export default function LocationMap({ active, ar, latitude, longitude, allowedRadiusMeters, devicePosition, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null); const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null); const radiusRef = useRef<L.Circle | null>(null);
  const gpsRef = useRef<L.CircleMarker | null>(null); const accuracyRef = useRef<L.Circle | null>(null);
  const streetsRef = useRef<L.TileLayer | null>(null); const satelliteRef = useRef<L.TileLayer | null>(null); const labelsRef = useRef<L.TileLayer | null>(null);
  const onChangeRef = useRef(onChange); const arRef = useRef(ar);
  const [layer, setLayer] = useState<MapLayer>(savedLayer); const [tileNotice, setTileNotice] = useState("");
  useEffect(() => { onChangeRef.current = onChange; arRef.current = ar; }, [ar, onChange]);

  useEffect(() => {
    if (!active || !containerRef.current || mapRef.current) return;
    const initial = parseLocation(latitude, longitude);
    const map = L.map(containerRef.current, { maxZoom: 19, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView(initial ? [initial.lat, initial.lng] : DEFAULT_CENTER, initial ? 17 : 12);
    mapRef.current = map;
    streetsRef.current = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, maxNativeZoom: 19, keepBuffer: 4, updateWhenZooming: false, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    satelliteRef.current = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, maxNativeZoom: 19, keepBuffer: 4, attribution: "Imagery &copy; Esri" });
    const labelsPane = map.createPane("satelliteLabels"); labelsPane.style.zIndex = "350"; labelsPane.style.pointerEvents = "none";
    labelsRef.current = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, maxNativeZoom: 19, pane: "satelliteLabels", attribution: "Labels &copy; Esri" });
    let tileErrors = 0;
    satelliteRef.current.on("tileload", () => { tileErrors = 0; });
    satelliteRef.current.on("tileerror", () => {
      if (++tileErrors < 3) return;
      setTileNotice(arRef.current ? "تعذر تحميل صور الأقمار الصناعية، تم الرجوع إلى خريطة الشوارع." : "Satellite imagery could not be loaded. Streets view was restored.");
      setLayer("streets");
    });
    L.control.scale({ imperial: false }).addTo(map);
    map.on("click", ({ latlng }: L.LeafletMouseEvent) => { onChangeRef.current("latitude", latlng.lat.toFixed(6)); onChangeRef.current("longitude", latlng.lng.toFixed(6)); });
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false })); observer.observe(containerRef.current);
    const timer = window.setTimeout(() => map.invalidateSize({ pan: false }), 100);
    return () => {
      window.clearTimeout(timer); observer.disconnect(); map.remove(); mapRef.current = null;
      markerRef.current = null; radiusRef.current = null; gpsRef.current = null; accuracyRef.current = null;
      streetsRef.current = null; satelliteRef.current = null; labelsRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    const map = mapRef.current; const streets = streetsRef.current; const satellite = satelliteRef.current; const labels = labelsRef.current;
    if (!map || !streets || !satellite || !labels) return;
    if (layer === "satellite") { map.removeLayer(streets); satellite.addTo(map); labels.addTo(map); }
    else { map.removeLayer(satellite); map.removeLayer(labels); streets.addTo(map); }
    window.localStorage.setItem(STORAGE_KEY, layer);
  }, [active, layer]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const location = parseLocation(latitude, longitude); const radius = Number(allowedRadiusMeters);
    if (!location) { markerRef.current?.remove(); radiusRef.current?.remove(); markerRef.current = null; radiusRef.current = null; return; }
    const center: L.LatLngExpression = [location.lat, location.lng];
    if (!markerRef.current) {
      markerRef.current = L.marker(center, { draggable: true, icon: locationIcon }).addTo(map).bindTooltip(ar ? "الموقع المعتمد" : "Selected location", { direction: "top" });
      markerRef.current.on("dragend", () => { const point = markerRef.current?.getLatLng(); if (!point) return; onChangeRef.current("latitude", point.lat.toFixed(6)); onChangeRef.current("longitude", point.lng.toFixed(6)); });
    } else markerRef.current.setLatLng(center).setTooltipContent(ar ? "الموقع المعتمد" : "Selected location");
    if (Number.isFinite(radius) && radius > 0) {
      const tooltip = ar ? `حدود نطاق التحقق<br>نصف القطر: ${radius} متر` : `Geofence boundary<br>Radius: ${radius} m`;
      if (!radiusRef.current) radiusRef.current = L.circle(center, { radius, color: "#047857", fillColor: "#10b981", fillOpacity: 0.2, weight: 3, dashArray: "8 6" }).addTo(map).bindTooltip(tooltip, { sticky: true });
      else radiusRef.current.setLatLng(center).setRadius(radius).setTooltipContent(tooltip);
      map.fitBounds(radiusRef.current.getBounds(), { padding: [34, 34], maxZoom: 18, animate: false });
    } else { radiusRef.current?.remove(); radiusRef.current = null; map.setView(center, Math.max(map.getZoom(), 17), { animate: false }); }
  }, [active, allowedRadiusMeters, ar, latitude, longitude]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const valid = devicePosition && Number.isFinite(devicePosition.latitude) && Number.isFinite(devicePosition.longitude) && !(devicePosition.latitude === 0 && devicePosition.longitude === 0);
    if (!valid || !devicePosition) { gpsRef.current?.remove(); accuracyRef.current?.remove(); gpsRef.current = null; accuracyRef.current = null; return; }
    const point: L.LatLngExpression = [devicePosition.latitude, devicePosition.longitude];
    if (!accuracyRef.current) {
      accuracyRef.current = L.circle(point, { radius: Math.max(devicePosition.accuracy, 1), color: "#2563eb", fillColor: "#60a5fa", fillOpacity: 0.12, weight: 1 }).addTo(map);
      gpsRef.current = L.circleMarker(point, { radius: 7, color: "#fff", fillColor: "#2563eb", fillOpacity: 1, weight: 3 }).addTo(map).bindTooltip(ar ? "موقعك الحالي (GPS)" : "Your current GPS location");
    } else { accuracyRef.current.setLatLng(point).setRadius(Math.max(devicePosition.accuracy, 1)); gpsRef.current?.setLatLng(point).setTooltipContent(ar ? "موقعك الحالي (GPS)" : "Your current GPS location"); }
  }, [active, ar, devicePosition]);

  const radius = Number(allowedRadiusMeters); const radiusMissing = Boolean(parseLocation(latitude, longitude)) && (!Number.isFinite(radius) || radius <= 0);
  const buttonClass = (value: MapLayer) => `flex items-center gap-1.5 px-3 py-2 text-xs font-bold ${layer === value ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-100"}`;
  return <div className="relative">
    <div ref={containerRef} className="w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-sm" style={{ height: 380, zIndex: 1 }} aria-label={ar ? "خريطة تحديد الموقع" : "Location selection map"} />
    <div className="absolute left-1/2 top-3 flex -translate-x-1/2 overflow-hidden rounded-lg border border-white/70 bg-white/95 shadow-md" style={{ zIndex: 500 }} dir={ar ? "rtl" : "ltr"} role="group" aria-label={ar ? "نوع الخريطة" : "Map type"}>
      <button type="button" aria-pressed={layer === "streets"} className={buttonClass("streets")} onClick={() => { setTileNotice(""); setLayer("streets"); }}><Map size={14} /> {ar ? "الشوارع" : "Streets"}</button>
      <button type="button" aria-pressed={layer === "satellite"} className={buttonClass("satellite")} onClick={() => { setTileNotice(""); setLayer("satellite"); }}><Satellite size={14} /> {ar ? "الأقمار الصناعية" : "Satellite"}</button>
    </div>
{tileNotice ? <div className="absolute bottom-7 left-3 right-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-800 shadow" style={{ zIndex: 500 }}>{tileNotice}</div> : null}
    {radiusMissing ? <p className="mt-1 text-xs font-semibold text-amber-700">{ar ? "لم يتم تحديد نصف قطر التحقق لهذا الموقع." : "No verification radius is set for this location."}</p> : null}
  </div>;
}
