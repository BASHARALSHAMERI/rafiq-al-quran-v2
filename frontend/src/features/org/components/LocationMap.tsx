import { useEffect, useRef, useState } from "react";

type LocationField = "latitude" | "longitude";

type LocationMapProps = {
  active: boolean;
  ar: boolean;
  latitude: string;
  longitude: string;
  allowedRadiusMeters: string;
  onChange: (field: LocationField, value: string) => void;
};

export default function LocationMap({
  active,
  ar,
  latitude,
  longitude,
  allowedRadiusMeters,
  onChange,
}: LocationMapProps) {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const radiusRef = useRef<any>(null);

  useEffect(() => {
    if ((window as any).L) {
      setLoaded(true);
      return;
    }

    let link = document.getElementById("leaflet-css") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    let script = document.getElementById("leaflet-js") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setLoaded(true);
      document.head.appendChild(script);
      return;
    }

    const interval = window.setInterval(() => {
      if ((window as any).L) {
        setLoaded(true);
        window.clearInterval(interval);
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!active || !loaded || !containerRef.current) return;

    const L = (window as any).L;
    const lat = Number(latitude);
    const lng = Number(longitude);
    const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && latitude !== "" && longitude !== "";

    L.Marker.prototype.options.icon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const map = L.map(containerRef.current).setView(
      hasCoordinates ? [lat, lng] : [13.5795, 44.0209],
      hasCoordinates ? 18 : 12,
    );
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    map.on("click", ({ latlng }: any) => {
      onChange("latitude", latlng.lat.toFixed(6));
      onChange("longitude", latlng.lng.toFixed(6));
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      radiusRef.current = null;
    };
  }, [active, loaded, onChange]);

  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    const lat = Number(latitude);
    const lng = Number(longitude);
    const radius = Number(allowedRadiusMeters);
    const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && latitude !== "" && longitude !== "";

    if (!hasCoordinates) {
      markerRef.current?.remove();
      radiusRef.current?.remove();
      markerRef.current = null;
      radiusRef.current = null;
      return;
    }

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on("dragend", (event: any) => {
        const point = event.target.getLatLng();
        onChange("latitude", point.lat.toFixed(6));
        onChange("longitude", point.lng.toFixed(6));
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (Number.isFinite(radius) && radius > 0) {
      if (!radiusRef.current) {
        radiusRef.current = L.circle([lat, lng], {
          radius,
          color: "#0d9488",
          fillColor: "#0d9488",
          fillOpacity: 0.15,
          weight: 1.5,
        }).addTo(map);
      } else {
        radiusRef.current.setLatLng([lat, lng]);
        radiusRef.current.setRadius(radius);
      }
    } else {
      radiusRef.current?.remove();
      radiusRef.current = null;
    }

    if (map.getCenter().distanceTo([lat, lng]) > 10) {
      map.setView([lat, lng], Math.max(map.getZoom(), 18));
    }
  }, [allowedRadiusMeters, latitude, longitude, onChange]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100" style={{ height: 260 }}>
        <span className="text-sm text-slate-500">
          {ar ? "جاري تحميل الخريطة..." : "Loading map..."}
        </span>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full rounded-lg border border-slate-300" style={{ height: 260, zIndex: 1 }} />;
}
