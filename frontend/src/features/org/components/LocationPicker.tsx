import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { notifyError } from "../../../shared/ui/feedback";
import LocationMap from "./LocationMap";

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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setAddressLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${ar ? "ar" : "en"}`,
      );
      const data = await response.json();
      setResolvedAddress(data?.display_name ?? "");
    } catch {
      setResolvedAddress("");
    } finally {
      setAddressLoading(false);
    }
  }, [ar]);

  const fetchNearbyPlaces = useCallback(async (lat: number, lng: number) => {
    setNearbyLoading(true);
    try {
      const query = `[out:json][timeout:15];(node(around:250,${lat},${lng})[amenity];node(around:250,${lat},${lng})[shop];node(around:250,${lat},${lng})[historic];);out body 15;`;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await response.json();
      setNearbyPlaces(
        (data?.elements ?? [])
          .filter((place: any) => place.tags?.name)
          .map((place: any) => ({
            id: place.id,
            name: place.tags.name,
            lat: place.lat,
            lng: place.lon,
            distance: Math.round(distanceInMeters(lat, lng, place.lat, place.lon)),
            type: place.tags.amenity || place.tags.shop || "landmark",
          }))
          .sort((a: any, b: any) => a.distance - b.distance),
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
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || latitude === "" || longitude === "") {
      setResolvedAddress("");
      setNearbyPlaces([]);
      return;
    }

    const addressTimer = window.setTimeout(() => reverseGeocode(lat, lng), 800);
    const nearbyTimer = window.setTimeout(() => fetchNearbyPlaces(lat, lng), 1200);
    return () => {
      window.clearTimeout(addressTimer);
      window.clearTimeout(nearbyTimer);
    };
  }, [active, fetchNearbyPlaces, latitude, longitude, reverseGeocode]);

  useEffect(() => {
    const closeResults = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchResults([]);
    };
    document.addEventListener("click", closeResults);
    return () => document.removeEventListener("click", closeResults);
  }, []);

  const search = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&accept-language=${ar ? "ar" : "en"}`,
      );
      setSearchResults(await response.json());
    } catch {
      setSearchResults([]);
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
            }}
          >
            {ar ? "إلغاء التفعيل الجغرافي" : "Disable Geofence"}
          </button>
        ) : null}
        <button type="button" className="circlemod-inline-action" onClick={useCurrentLocation} disabled={pending}>
          <MapPin size={11} />
          <span>{ar ? "جلب موقعي الحالي (GPS)" : "Get Current Location"}</span>
        </button>
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
                key={result.place_id}
                type="button"
                className="flex w-full flex-col border-b border-slate-100 px-3 text-right hover:bg-slate-50"
                style={{ paddingTop: 10, paddingBottom: 10 }}
                onClick={() => {
                  onChange("latitude", Number(result.lat).toFixed(6));
                  onChange("longitude", Number(result.lon).toFixed(6));
                  setSearchQuery(result.display_name);
                  setSearchResults([]);
                }}
              >
                <span className="truncate text-xs font-semibold text-slate-800">{result.display_name}</span>
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
        onChange={onChange}
      />

      {resolvedAddress || addressLoading ? (
        <div className="flex items-start rounded-lg border border-emerald-100 bg-emerald-50" style={{ gap: 6, padding: 8 }}>
          <MapPin size={13} className="mt-0.5 flex-shrink-0" style={{ color: "#0d9488" }} />
          <div style={{ fontSize: 11, lineHeight: 1.7, color: "#0f766e" }}>
            <strong style={{ display: "block" }}>{ar ? "الموقع المحدد حالياً:" : "Selected Address:"}</strong>
            {addressLoading ? (ar ? "جاري جلب العنوان..." : "Resolving address...") : resolvedAddress}
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
                    onChange("latitude", place.lat.toFixed(6));
                    onChange("longitude", place.lng.toFixed(6));
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
        <label>{ar ? "نطاق التحقق الجغرافي (متر) *" : "Geofence Radius (meters) *"}</label>
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
