import { useCallback, useEffect, useRef, useState } from "react";
import { CircleDot, Crosshair, MapPin, Search } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { notifyError } from "../../../shared/ui/feedback";
import { geoApi, type GeoPlace } from "../../../shared/geo/geo-api";
import LocationMap, { type DevicePosition } from "./LocationMap";

type LocationField = "latitude" | "longitude" | "allowedRadiusMeters";

type LocationPickerProps = {
  active: boolean;
  ar: boolean;
  latitude: string;
  longitude: string;
  allowedRadiusMeters: string;
  pending: boolean;
  allowClear?: boolean;
  onChange: (field: LocationField, value: string) => void;
};

type NearbyPlace = GeoPlace & { distance: number };

const distanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const radius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function LocationPicker({
  active,
  ar,
  latitude,
  longitude,
  allowedRadiusMeters,
  pending,
  allowClear = false,
  onChange,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeoPlace[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [devicePosition, setDevicePosition] = useState<DevicePosition | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);


  const fetchNearbyPlaces = useCallback(async (lat: number, lng: number) => {
    setNearbyLoading(true);
    try {
      const places = await geoApi.nearby({ lat, lng, radius: 3000 });
      setNearbyPlaces(
        places
          .map((place): NearbyPlace => ({
            ...place,
            distance: Math.round(distanceInMeters(lat, lng, place.latitude, place.longitude)),
          }))
          .sort((a, b) => a.distance - b.distance),
      );
    } catch {
      setNearbyPlaces([]);
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || latitude === "" || longitude === "" || (lat === 0 && lng === 0)) {
      setResolvedAddress("");
      setNearbyPlaces([]);
      return;
    }
    const nearbyTimer = window.setTimeout(() => fetchNearbyPlaces(lat, lng), 600);
    const controller = new AbortController();
    const reverseTimer = window.setTimeout(() => {
      void geoApi.reverse({ lat, lng }, controller.signal)
        .then((result) => setResolvedAddress(result.address ?? ""))
        .catch(() => undefined);
    }, 350);
    return () => { window.clearTimeout(nearbyTimer); window.clearTimeout(reverseTimer); controller.abort(); };
  }, [active, fetchNearbyPlaces, latitude, longitude]);

  useEffect(() => {
    const closeResults = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchResults([]);
    };
    document.addEventListener("click", closeResults);
    return () => document.removeEventListener("click", closeResults);
  }, []);

  const search = async () => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      notifyError(ar ? "اكتب ثلاثة أحرف على الأقل للبحث." : "Enter at least three characters to search.");
      return;
    }
    setSearchLoading(true);
    try {
      const results = await geoApi.search(query);
      setSearchResults(results);
      if (!results.length) notifyError(ar ? "لم يتم العثور على نتائج مطابقة." : "No matching locations found.");
    } catch (error) {
      setSearchResults([]);
      notifyError(error instanceof Error ? error.message : ar ? "تعذر البحث عن الموقع." : "Location search failed.");
    } finally {
      setSearchLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      notifyError(ar ? "المتصفح لا يدعم تحديد الموقع الجغرافي." : "Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDevicePosition({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy });
        onChange("latitude", coords.latitude.toFixed(6));
        onChange("longitude", coords.longitude.toFixed(6));
      },
      () => notifyError(ar ? "تعذر تحديد الموقع الجغرافي. تأكد من تفعيل GPS ومنح الصلاحية للمتصفح." : "Unable to retrieve location. Make sure GPS is enabled and browser permissions are granted."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2">
        {allowClear && (latitude || longitude) ? (
          <button
            type="button"
            className="circlemod-inline-action"
            style={{ color: "#ef4444" }}
            onClick={() => {
              onChange("latitude", "");
              onChange("longitude", "");
              setResolvedAddress("");
              setNearbyPlaces([]);
              setDevicePosition(null);
            }}
          >
            {ar ? "إلغاء التفعيل الجغرافي" : "Disable Geofence"}
          </button>
        ) : null}
        <Button type="button" variant="secondary" size="sm" onClick={useCurrentLocation} disabled={pending}>
          <Crosshair size={15} />
          <span>{ar ? "جلب موقعي الحالي (GPS)" : "Get Current Location"}</span>
        </Button>
      </div>

      <div ref={searchRef} className="relative">
        <div className="flex items-end gap-2">
          <input
            className="circlemod-input w-full"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void search();
              }
            }}
            placeholder={ar ? "ابحث عن اسم المسجد، الشارع، أو الحي..." : "Search for mosque, street, or district..."}
            disabled={pending}
          />
          <Button type="button" variant="primary" onClick={() => void search()} isLoading={searchLoading} disabled={pending || !searchQuery.trim()}>
            <Search size={15} />
            {ar ? "بحث" : "Search"}
          </Button>
        </div>
        {searchResults.length ? (
          <div
            className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-slate-200 bg-white shadow-sm"
            style={{ zIndex: 9999, maxHeight: "220px", overflowY: "auto" }}
          >
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                className="flex w-full items-start gap-2 border-b border-slate-100 px-3 text-right hover:bg-slate-50"
                style={{ paddingTop: 10, paddingBottom: 10 }}
                onClick={() => {
                  onChange("latitude", result.latitude.toFixed(6));
                  onChange("longitude", result.longitude.toFixed(6));
                  setSearchQuery(result.name);
                  setResolvedAddress(result.address ?? result.name);
                  setSearchResults([]);
                }}
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                <span className="min-w-0">
                  <strong className="block truncate text-xs text-slate-800">{result.name}</strong>
                  {result.address ? <span className="block truncate text-[10px] text-slate-500">{result.address}</span> : null}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <LocationMap
        active={active}
        ar={ar}
        latitude={latitude}
        longitude={longitude}
        allowedRadiusMeters={allowedRadiusMeters}
        devicePosition={devicePosition}
        onChange={onChange}
      />

      {resolvedAddress ? (
        <div className="flex items-start rounded-lg border border-emerald-100 bg-emerald-50" style={{ gap: 6, padding: 8 }}>
          <MapPin size={13} className="mt-0.5 flex-shrink-0" style={{ color: "#0d9488" }} />
          <div style={{ fontSize: 11, lineHeight: 1.7, color: "#0f766e" }}>
            <strong style={{ display: "block" }}>{ar ? "الموقع المحدد حالياً:" : "Selected Address:"}</strong>
            {resolvedAddress}
          </div>
        </div>
      ) : null}

      {nearbyPlaces.length || nearbyLoading ? (
        <div>
          <span className="mb-1 font-bold text-slate-500" style={{ display: "block", fontSize: 11 }}>
            {ar ? "معالم وأماكن قريبة:" : "Nearby landmarks:"}
          </span>
          {nearbyLoading ? (
            <span className="text-[10px] text-slate-400">{ar ? "جاري البحث..." : "Searching..."}</span>
          ) : (
            <div className="flex flex-wrap" style={{ maxHeight: "100px", overflowY: "auto", gap: 6 }}>
              {nearbyPlaces.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px]"
                  onClick={() => {
                    onChange("latitude", place.latitude.toFixed(6));
                    onChange("longitude", place.longitude.toFixed(6));
                  }}
                >
                  {place.name} ({place.distance}{ar ? "م" : "m"})
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="circlemod-field">
        <label className="flex items-center gap-1.5">
          <CircleDot size={15} className="text-emerald-600" />
          {ar ? "نطاق التحقق الجغرافي (متر) *" : "Geofence Radius (meters) *"}
        </label>
        <input
          type="number"
          min="10"
          className="circlemod-input"
          value={allowedRadiusMeters}
          onChange={(event) => onChange("allowedRadiusMeters", event.target.value)}
          placeholder="500"
          disabled={pending}
        />
      </div>
    </div>
  );
}
