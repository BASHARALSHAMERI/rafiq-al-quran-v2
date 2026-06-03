import { prisma } from "../../shared/db/prisma";

/**
 * Phase 3 — Prayer Time Cache Service
 *
 * Provides resolved prayer times (HH:mm) for a given center + date.
 * Uses the `prayer_time_cache` table. Falls back to Aladhan API
 * when no fresh cache entry exists.
 */

type PrayerTimes = {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

const PRAYER_KEYS: (keyof PrayerTimes)[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const ALADHAN_METHOD = 4; // Umm Al-Qura

const CACHE_FRESHNESS_HOURS = 24;

const isFresh = (fetchedAt: Date) => {
  const ageMs = Date.now() - fetchedAt.getTime();
  return ageMs < CACHE_FRESHNESS_HOURS * 60 * 60 * 1000;
};

const formatDateForAladhan = (date: Date): string => {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const extractHHmm = (timeString: string): string => {
  // Aladhan returns times like "05:23 (EET)" — extract just HH:mm
  const match = /^(\d{2}:\d{2})/.exec(timeString.trim());
  return match ? match[1] : timeString.trim().slice(0, 5);
};

const fetchFromAladhan = async (latitude: number, longitude: number, date: Date): Promise<PrayerTimes> => {
  const dateStr = formatDateForAladhan(date);
  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=${ALADHAN_METHOD}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Aladhan API returned ${response.status}: ${response.statusText}`);
  }

  const body = (await response.json()) as {
    data?: { timings?: Record<string, string> };
  };

  const timings = body?.data?.timings;
  if (!timings) {
    throw new Error("Aladhan API returned unexpected response shape");
  }

  return {
    fajr: extractHHmm(timings.Fajr ?? ""),
    dhuhr: extractHHmm(timings.Dhuhr ?? ""),
    asr: extractHHmm(timings.Asr ?? ""),
    maghrib: extractHHmm(timings.Maghrib ?? ""),
    isha: extractHHmm(timings.Isha ?? "")
  };
};

/**
 * Get prayer times for a given center and date.
 *
 * Strategy:
 * 1. Check `PrayerTimeCache` table for (centerId, date).
 * 2. If cached and fresh (< 24h old), return cached values.
 * 3. Otherwise, fetch from Aladhan API using center's lat/lng.
 * 4. Store result in cache (upsert) and return.
 * 5. If API fails and a stale cache entry exists, return stale entry.
 * 6. If API fails and no cache at all, throw.
 */
export const prayerTimeService = {
  async getPrayerTimes(centerId: number, date: Date): Promise<PrayerTimes | null> {
    const dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    // 1. Check cache
    const cached = await prisma.prayerTimeCache.findUnique({
      where: { centerId_date: { centerId, date: dateOnly } }
    });

    if (cached && isFresh(cached.fetchedAt)) {
      return {
        fajr: cached.fajr,
        dhuhr: cached.dhuhr,
        asr: cached.asr,
        maghrib: cached.maghrib,
        isha: cached.isha
      };
    }

    // 2. Resolve center coordinates
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: { latitude: true, longitude: true }
    });

    const lat = center?.latitude ? Number(center.latitude) : null;
    const lng = center?.longitude ? Number(center.longitude) : null;

    if (lat === null || lng === null) {
      if (cached) {
        // Return stale cache if center has no coordinates
        return { fajr: cached.fajr, dhuhr: cached.dhuhr, asr: cached.asr, maghrib: cached.maghrib, isha: cached.isha };
      }
      // Gracefully return null when center has no GPS and no cache
      return null;
    }

    // 3. Fetch from API
    try {
      const times = await fetchFromAladhan(lat, lng, dateOnly);

      // Validate
      for (const key of PRAYER_KEYS) {
        if (!/^\d{2}:\d{2}$/.test(times[key])) {
          throw new Error(`Invalid prayer time for ${key}: ${times[key]}`);
        }
      }

      // 4. Upsert cache
      await prisma.prayerTimeCache.upsert({
        where: { centerId_date: { centerId, date: dateOnly } },
        create: {
          centerId,
          date: dateOnly,
          ...times,
          fetchedAt: new Date()
        },
        update: {
          ...times,
          fetchedAt: new Date()
        }
      });

      return times;
    } catch (error) {
      // 5. Fallback to stale cache
      if (cached) {
        console.warn(`[prayer-time] Aladhan API failed for center ${centerId}, using stale cache: ${(error as Error).message}`);
        return { fajr: cached.fajr, dhuhr: cached.dhuhr, asr: cached.asr, maghrib: cached.maghrib, isha: cached.isha };
      }

      // 6. No cache, no API
      throw new Error(`Cannot resolve prayer times for center ${centerId}: ${(error as Error).message}`);
    }
  },

  /**
   * Resolve a specific prayer time to HH:mm string for a center and date.
   */
  async resolvePrayerTime(centerId: number, date: Date, prayerName: string): Promise<string | null> {
    const times = await this.getPrayerTimes(centerId, date);
    if (!times) return null;
    const key = prayerName.toLowerCase() as keyof PrayerTimes;
    const value = times[key];
    if (!value) {
      throw new Error(`Unknown prayer name: ${prayerName}`);
    }
    return value;
  }
};
