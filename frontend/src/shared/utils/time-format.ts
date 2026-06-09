import { useMemo } from "react";
import { useAuthStore } from "../../features/auth/auth.store";

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHITECTURAL NOTE — TRANSIENT SOLUTION
// ═══════════════════════════════════════════════════════════════════════════════
// timeFormat is stored inside AuthUser as an interim measure until a proper
// OrganizationSettingsStore or a consolidated OrganizationSettings model is
// introduced.
//
// RULES:
// 1. Do NOT add timezone, currency, language, dateFormat, or hijriEnabled to AuthUser.
// 2. Do NOT create an OrganizationSettingsStore or Context in this phase.
// 3. This module is the SINGLE SOURCE OF TRUTH for time formatting.
//    Every component that displays a time MUST import from here.
// 4. All direct uses of:
//      - slice(11,16)
//      - hour12: false (hardcoded)
//      - toLocaleTimeString() inside components
//    are FORBIDDEN and must be replaced by fmtTime() / fmtClockTime().
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Reads the organization's timeFormat from the authenticated user.
 * Uses a Zustand selector so only components consuming `hour12` re-render.
 */
export function useTimeFormat() {
  const user = useAuthStore((s) => s.user);
  return useMemo(() => {
    const timeFormat = user?.timeFormat ?? "HOUR_12";
    return {
      timeFormat,
      hour12: timeFormat !== "HOUR_24",
    };
  }, [user?.timeFormat]);
}

/**
 * Formats an ISO datetime string (e.g. "2026-06-04T14:30:00.000Z")
 * into a locale-sensitive time string respecting the 12/24h preference.
 *
 * THIS IS THE ONLY ALLOWED WAY TO FORMAT FULL DATETIME STRINGS IN THE UI.
 */
export function fmtTime(
  value?: string | null,
  locale = "ar-SA-u-nu-latn",
  hour12 = true
): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12,
    });
  } catch {
    return "—";
  }
}

/**
 * Formats a raw "HH:mm" clock string (e.g. "14:30")
 * into a locale-sensitive time string respecting the 12/24h preference.
 *
 * Use this for schedule slots (CircleScheduleSlot.fromTime / toTime)
 * which are stored as plain "HH:mm" text in the database.
 */
export function fmtClockTime(
  timeStr: string,
  locale = "ar-SA-u-nu-latn",
  hour12 = true
): string {
  if (!timeStr || !timeStr.includes(":")) return timeStr;

  const today = new Date().toISOString().slice(0, 10);
  const iso = `${today}T${timeStr}:00`;
  return fmtTime(iso, locale, hour12);
}
