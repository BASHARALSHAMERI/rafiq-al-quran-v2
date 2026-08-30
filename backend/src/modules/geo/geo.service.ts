import type { Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../shared/db/prisma";
import type { ScopeContext } from "../../shared/types/auth.types";

type CacheEntry<T> = { expiresAt: number; value: T };

export type GeoPlaceType = "MOSQUE" | "SCHOOL" | "CENTER" | "INTERNAL" | "OTHER";

export type GeoPlace = {
  id: string;
  name: string;
  type: GeoPlaceType;
  latitude: number;
  longitude: number;
  source: "NOMINATIM" | "OPENSTREETMAP" | "INTERNAL";
  address?: string | null;
  osmType?: string;
  osmId?: number;
  radiusMeters?: number | null;
};

const NOMINATIM_BASE_URL = env.GEO_NOMINATIM_BASE_URL;
const OVERPASS_BASE_URL = env.GEO_OVERPASS_BASE_URL;
const USER_AGENT = `${env.SERVICE_NAME}/1.0 (${env.PUBLIC_BASE_URL ?? "local"})`;
const SEARCH_CACHE_MS = 30 * 60 * 1000;
const NEARBY_CACHE_MS = 15 * 60 * 1000;
const searchCache = new Map<string, CacheEntry<GeoPlace[]>>();
const reverseCache = new Map<string, CacheEntry<{ address: string | null }>>();
const nearbyCache = new Map<string, CacheEntry<GeoPlace[]>>();
let lastNominatimRequestAt = 0;

const getCached = <T>(cache: Map<string, CacheEntry<T>>, key: string): T | null => {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const setCached = <T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number) => {
  cache.set(key, { expiresAt: Date.now() + ttlMs, value });
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForNominatim = async () => {
  const waitMs = Math.max(0, 1000 - (Date.now() - lastNominatimRequestAt));
  if (waitMs > 0) await delay(waitMs);
  lastNominatimRequestAt = Date.now();
};

const fetchJson = async <T>(url: string, timeoutMs: number): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Accept-Language": "ar,en"
      }
    });
    if (!response.ok) throw new Error(`Geo provider failed: ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
};

const numberOrNull = (value: Prisma.Decimal | number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const classifyOsm = (tags: Record<string, unknown>): GeoPlaceType => {
  if (tags.amenity === "place_of_worship" || tags.building === "mosque") return "MOSQUE";
  if (tags.amenity === "school") return "SCHOOL";
  if (tags.amenity === "community_centre" || tags.office === "association" || tags.office === "ngo") return "CENTER";
  return "OTHER";
};

const textOrNull = (value: unknown): string | null => {
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const unnamedOsmName = (type: GeoPlaceType) => {
  if (type === "MOSQUE") return "\u0645\u0633\u062c\u062f \u063a\u064a\u0631 \u0645\u0633\u0645\u0649";
  if (type === "SCHOOL") return "\u0645\u062f\u0631\u0633\u0629 \u063a\u064a\u0631 \u0645\u0633\u0645\u0627\u0629";
  if (type === "CENTER") return "\u0645\u0631\u0643\u0632 \u063a\u064a\u0631 \u0645\u0633\u0645\u0649";
  return "\u0645\u0648\u0642\u0639 \u063a\u064a\u0631 \u0645\u0633\u0645\u0649";
};

const pickNominatimName = (row: Record<string, unknown>, fallback: string) => {
  const details = (row.namedetails && typeof row.namedetails === "object" ? row.namedetails : {}) as Record<string, unknown>;
  return textOrNull(details["name:ar"]) ?? textOrNull(row.name) ?? textOrNull(row.display_name) ?? textOrNull(details.name) ?? textOrNull(details["name:en"]) ?? fallback;
};

const pickOsmName = (tags: Record<string, unknown>, type: GeoPlaceType) => {
  return textOrNull(tags["name:ar"]) ?? textOrNull(tags.name) ?? textOrNull(tags["name:en"]) ?? unnamedOsmName(type);
};

export const geoService = {
  async search(input: { q: string; limit?: number }): Promise<GeoPlace[]> {
    const query = input.q.trim();
    const limit = input.limit ?? 6;
    const key = `${query.toLowerCase()}:${limit}`;
    const cached = getCached(searchCache, key);
    if (cached) return cached;

    await waitForNominatim();

    const params = new URLSearchParams({
      format: "jsonv2",
      q: query,
      limit: String(limit),
      addressdetails: "1",
      namedetails: "1",
      countrycodes: "ye",
      "accept-language": "ar,en"
    });
    const rows = await fetchJson<Array<Record<string, unknown>>>(`${NOMINATIM_BASE_URL}/search?${params}`, 8000);
    const places = rows
      .map((row): GeoPlace | null => {
        const lat = Number(row.lat);
        const lng = Number(row.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return {
          id: `nominatim:${String(row.osm_type ?? "place")}:${String(row.osm_id ?? row.place_id ?? `${lat},${lng}`)}`,
          name: pickNominatimName(row, query),
          address: typeof row.display_name === "string" ? row.display_name : null,
          type: "OTHER",
          latitude: lat,
          longitude: lng,
          source: "NOMINATIM",
          osmType: typeof row.osm_type === "string" ? row.osm_type : undefined,
          osmId: typeof row.osm_id === "number" ? row.osm_id : undefined
        };
      })
      .filter((place): place is GeoPlace => Boolean(place));

    setCached(searchCache, key, places, SEARCH_CACHE_MS);
    return places;
  },

  async reverse(input: { lat: number; lng: number }): Promise<{ address: string | null }> {
    const key = `${input.lat.toFixed(5)}:${input.lng.toFixed(5)}`;
    const cached = getCached(reverseCache, key);
    if (cached) return cached;
    await waitForNominatim();
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(input.lat),
      lon: String(input.lng),
      zoom: "18",
      addressdetails: "1",
      "accept-language": "ar,en"
    });
    const row = await fetchJson<Record<string, unknown>>(`${NOMINATIM_BASE_URL}/reverse?${params}`, 8000);
    const result = { address: textOrNull(row.display_name) };
    setCached(reverseCache, key, result, SEARCH_CACHE_MS);
    return result;
  },

  async nearby(input: { lat: number; lng: number; radius?: number; limit?: number }): Promise<GeoPlace[]> {
    const radius = Math.min(Math.max(input.radius ?? 3000, 100), 5000);
    const limit = input.limit ?? 40;
    const key = `${input.lat.toFixed(3)}:${input.lng.toFixed(3)}:${radius}:${limit}`;
    const cached = getCached(nearbyCache, key);
    if (cached) return cached;

    const around = `(around:${radius},${input.lat},${input.lng})`;
    const query = `[out:json][timeout:10];(
      node${around}[amenity=place_of_worship][religion=muslim];way${around}[amenity=place_of_worship][religion=muslim];relation${around}[amenity=place_of_worship][religion=muslim];
      node${around}[building=mosque];way${around}[building=mosque];relation${around}[building=mosque];
      node${around}[amenity=school];way${around}[amenity=school];relation${around}[amenity=school];
      node${around}[amenity=community_centre];way${around}[amenity=community_centre];relation${around}[amenity=community_centre];
      node${around}[office=association];way${around}[office=association];relation${around}[office=association];
      node${around}[office=ngo];way${around}[office=ngo];relation${around}[office=ngo];
    );out center ${limit};`;
    const url = `${OVERPASS_BASE_URL}/interpreter?data=${encodeURIComponent(query)}`;
    const payload = await fetchJson<{ elements?: Array<Record<string, unknown>> }>(url, 12000);
    const seen = new Set<string>();
    const places: GeoPlace[] = [];

    for (const element of payload.elements ?? []) {
      const tags = (element.tags && typeof element.tags === "object" ? element.tags : {}) as Record<string, unknown>;
      const center = (element.center && typeof element.center === "object" ? element.center : {}) as Record<string, unknown>;
      const lat = Number(element.lat ?? center.lat);
      const lng = Number(element.lon ?? center.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const type = classifyOsm(tags);
      const name = pickOsmName(tags, type);
      const dedupeKey = `${name}:${lat.toFixed(6)}:${lng.toFixed(6)}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      places.push({
        id: `osm:${String(element.type ?? "node")}:${String(element.id ?? dedupeKey)}`,
        name,
        type,
        latitude: lat,
        longitude: lng,
        source: "OPENSTREETMAP",
        osmType: typeof element.type === "string" ? element.type : undefined,
        osmId: typeof element.id === "number" ? element.id : undefined
      });
      if (places.length >= limit) break;
    }

    setCached(nearbyCache, key, places, NEARBY_CACHE_MS);
    return places;
  },

  async internalLocations(scope: ScopeContext): Promise<GeoPlace[]> {
    const whereOrg = { organizationId: scope.organizationId };
    const centerFilter = scope.allAccess ? whereOrg : { ...whereOrg, id: { in: scope.centerIds } };
    const circleFilter = scope.allAccess ? { center: whereOrg } : { id: { in: scope.circleIds } };

    const [organization, centers, circles, schedules] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: scope.organizationId },
        select: { name: true, associationLatitude: true, associationLongitude: true, associationGeoRadiusMeters: true, associationLocationName: true }
      }),
      prisma.center.findMany({
        where: { ...centerFilter, latitude: { not: null }, longitude: { not: null } },
        select: { id: true, name: true, mosqueName: true, latitude: true, longitude: true, allowedRadiusMeters: true, locationText: true },
        take: 200
      }),
      prisma.circle.findMany({
        where: { ...circleFilter, latitude: { not: null }, longitude: { not: null } },
        select: { id: true, name: true, mosqueName: true, latitude: true, longitude: true, allowedRadiusMeters: true, locationText: true, center: { select: { name: true } } },
        take: 300
      }),
      prisma.staffScheduleAssignment.findMany({
        where: { ...whereOrg, isActive: true, latitude: { not: null }, longitude: { not: null } },
        select: { id: true, locationText: true, latitude: true, longitude: true, allowedRadiusMeters: true, center: { select: { name: true } }, circle: { select: { name: true } } },
        take: 200
      })
    ]);

    const places: GeoPlace[] = [];
    const orgLat = numberOrNull(organization?.associationLatitude);
    const orgLng = numberOrNull(organization?.associationLongitude);
    if (organization && orgLat !== null && orgLng !== null) {
      places.push({ id: "internal:organization", name: organization.associationLocationName ?? organization.name, type: "INTERNAL", latitude: orgLat, longitude: orgLng, source: "INTERNAL", radiusMeters: organization.associationGeoRadiusMeters });
    }

    centers.forEach((center) => {
      const lat = numberOrNull(center.latitude);
      const lng = numberOrNull(center.longitude);
      if (lat === null || lng === null) return;
      places.push({ id: `internal:center:${center.id}`, name: center.mosqueName ?? center.locationText ?? center.name, type: "INTERNAL", latitude: lat, longitude: lng, source: "INTERNAL", radiusMeters: center.allowedRadiusMeters });
    });

    circles.forEach((circle) => {
      const lat = numberOrNull(circle.latitude);
      const lng = numberOrNull(circle.longitude);
      if (lat === null || lng === null) return;
      places.push({ id: `internal:circle:${circle.id}`, name: circle.mosqueName ?? circle.locationText ?? circle.name, type: "INTERNAL", latitude: lat, longitude: lng, source: "INTERNAL", address: circle.center?.name ?? null, radiusMeters: circle.allowedRadiusMeters });
    });

    schedules.forEach((schedule) => {
      const lat = numberOrNull(schedule.latitude);
      const lng = numberOrNull(schedule.longitude);
      if (lat === null || lng === null) return;
      places.push({ id: `internal:schedule:${schedule.id}`, name: schedule.locationText ?? schedule.circle?.name ?? schedule.center?.name ?? "Staff schedule", type: "INTERNAL", latitude: lat, longitude: lng, source: "INTERNAL", radiusMeters: schedule.allowedRadiusMeters });
    });

    return places;
  }
};
