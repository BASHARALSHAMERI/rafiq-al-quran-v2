import { Weekday, PrayerName } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { prayerTimeService } from "./prayer-time.service";
import { attendancePolicyService } from "./attendance-policy.service";

/**
 * Phase 3 — Effective Shift Resolution Service
 *
 * Resolves the effective working shift (start/end DateTime) for a staff
 * member on a given date, based on their StaffScheduleAssignment(s).
 *
 * Supports CLOCK mode (direct HH:mm) and PRAYER mode (Aladhan-resolved
 * prayer times with configurable offsets).
 *
 * For multi-circle teachers: merges to earliest start / latest end.
 */

type EffectiveShift = {
  start: Date;
  end: Date;
  assignments: Array<{
    assignmentId: number;
    circleId: number | null;
    slotMode: string;
  }>;
};

const WEEKDAY_JS_MAP: Record<number, Weekday> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY"
};

const getTimeZoneParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value ?? "0");

  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
    hour: part("hour"),
    minute: part("minute"),
    second: part("second")
  };
};

const getTimeZoneOffsetMs = (date: Date, timeZone: string) => {
  const parts = getTimeZoneParts(date, timeZone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return localAsUtc - date.getTime();
};

const zonedWallTimeToDate = (
  date: Date,
  hhmm: string,
  timeZone: string
): Date => {
  const localDate = getTimeZoneParts(date, timeZone);
  const [h, m] = hhmm.split(":").map(Number);
  const localAsUtc = Date.UTC(localDate.year, localDate.month - 1, localDate.day, h, m, 0, 0);
  const firstPass = new Date(localAsUtc - getTimeZoneOffsetMs(new Date(localAsUtc), timeZone));
  const secondPassOffset = getTimeZoneOffsetMs(firstPass, timeZone);

  return new Date(localAsUtc - secondPassOffset);
};

const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60_000);
};

const resolvePrayerToHHmm = async (
  centerId: number,
  date: Date,
  prayerName: PrayerName,
  prayerApiSource?: string
): Promise<string | null> => {
  return prayerTimeService.resolvePrayerTime(centerId, date, prayerName, prayerApiSource);
};

export const effectiveShiftService = {
  /**
   * Resolve the effective shift for a user on a given date.
   *
   * Algorithm:
   * 1. Find all active StaffScheduleAssignment for this user
   * 2. For each, find the StaffScheduleSlot matching today's weekday
   * 3. Resolve each slot to a concrete start/end DateTime
   * 4. Merge: earliest start, latest end
   *
   * Returns null if no slot matches today.
   */
  async resolveEffectiveShift(
    userId: number,
    date: Date,
    centerId: number,
    organizationId: number,
    timeZone?: string
  ): Promise<EffectiveShift | null> {
    const policy = await attendancePolicyService.getPolicy(organizationId);
    const resolvedTimeZone = timeZone ?? policy.timezone ?? "Asia/Aden";
    const localDate = getTimeZoneParts(date, resolvedTimeZone);
    const dayOfWeek = WEEKDAY_JS_MAP[
      new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day)).getUTCDay()
    ];

    // ── Diagnostic logging ──
    console.info(
      `[resolveEffectiveShift] userId=${userId} date=${date.toISOString()} dayOfWeek=${dayOfWeek} centerId=${centerId} tz=${resolvedTimeZone}`
    );

    // 1. Find active assignments with their slots for today
    const assignments = await prisma.staffScheduleAssignment.findMany({
      where: {
        userId,
        isActive: true,
        effectiveFrom: { lte: date },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: date } }
        ]
      },
      include: {
        slots: {
          where: { dayOfWeek }
        }
      }
    });

    console.info(
      `[resolveEffectiveShift] found ${assignments.length} active assignment(s) for user ${userId}`,
      assignments.map(a => ({
        id: a.id,
        staffRole: a.staffRole,
        centerId: a.centerId,
        effectiveFrom: a.effectiveFrom,
        effectiveTo: a.effectiveTo,
        sourceType: a.sourceType,
        slotsForToday: a.slots.length,
        slots: a.slots.map(s => ({ day: s.dayOfWeek, mode: s.mode, from: s.fromTime, to: s.toTime }))
      }))
    );

    if (assignments.length === 0) {
      console.warn(`[resolveEffectiveShift] → null: no active assignment found for userId=${userId}`);
      return null;
    }

    // 2. Collect all resolved time ranges
    const ranges: Array<{ start: Date; end: Date; assignmentId: number; circleId: number | null; mode: string }> = [];

    for (const assignment of assignments) {
      for (const slot of assignment.slots) {
        let start: Date;
        let end: Date;

        if (slot.mode === "CLOCK") {
          // Direct HH:mm resolution
          if (!slot.fromTime) continue;

          start = zonedWallTimeToDate(date, slot.fromTime, resolvedTimeZone);

          if (slot.toTime) {
            end = zonedWallTimeToDate(date, slot.toTime, resolvedTimeZone);
          } else {
            const duration = slot.defaultDurationMinutes ?? policy.defaultShiftDurationMinutes;
            end = addMinutes(start, duration);
          }
        } else if (slot.mode === "PRAYER") {
          // Prayer-based resolution
          if (!slot.fromPrayer) continue;

          const resolvedCenter = assignment.centerId || centerId;
          const fromHHmm = await resolvePrayerToHHmm(resolvedCenter, date, slot.fromPrayer, policy.prayerApiSource);
          if (!fromHHmm) continue; // Center has no GPS / prayer times unavailable

          start = zonedWallTimeToDate(date, fromHHmm, resolvedTimeZone);
          start = addMinutes(start, slot.fromPrayerOffsetMinutes ?? 0);

          if (slot.toPrayer) {
            const toHHmm = await resolvePrayerToHHmm(resolvedCenter, date, slot.toPrayer, policy.prayerApiSource);
            if (!toHHmm) continue;
            end = zonedWallTimeToDate(date, toHHmm, resolvedTimeZone);
            end = addMinutes(end, slot.toPrayerOffsetMinutes ?? 0);
          } else {
            const duration = slot.defaultDurationMinutes ?? policy.defaultShiftDurationMinutes;
            end = addMinutes(start, duration);
          }
        } else {
          continue;
        }

        ranges.push({
          start,
          end,
          assignmentId: assignment.id,
          circleId: assignment.circleId,
          mode: slot.mode
        });
      }
    }

    if (ranges.length === 0) {
      console.warn(
        `[resolveEffectiveShift] → null: assignment(s) found but no slot resolved for dayOfWeek=${dayOfWeek}. ` +
        `Check that slots exist for this day and have valid fromTime/fromPrayer.`
      );
      return null;
    }

    // 3. Merge: earliest start, latest end
    let mergedStart = ranges[0].start;
    let mergedEnd = ranges[0].end;

    for (const range of ranges) {
      if (range.start < mergedStart) mergedStart = range.start;
      if (range.end > mergedEnd) mergedEnd = range.end;
    }

    return {
      start: mergedStart,
      end: mergedEnd,
      assignments: ranges.map((r) => ({
        assignmentId: r.assignmentId,
        circleId: r.circleId,
        slotMode: r.mode
      }))
    };
  },

  /**
   * Get all circles that a teacher has active schedule slots for on a given weekday.
   * Used for multi-circle teacher circle selection on check-in.
   */
  async getActiveCirclesForDay(
    userId: number,
    date: Date,
    timeZone = "Asia/Aden"
  ): Promise<Array<{ circleId: number; assignmentId: number; circleName: string }>> {
    const localDate = getTimeZoneParts(date, timeZone);
    const dayOfWeek = WEEKDAY_JS_MAP[
      new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day)).getUTCDay()
    ];

    const assignments = await prisma.staffScheduleAssignment.findMany({
      where: {
        userId,
        isActive: true,
        circleId: { not: null },
        effectiveFrom: { lte: date },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: date } }
        ],
        slots: {
          some: { dayOfWeek }
        }
      },
      include: {
        circle: { select: { id: true, name: true } }
      }
    });

    return assignments
      .filter((a) => a.circle !== null)
      .map((a) => ({
        circleId: a.circle!.id,
        assignmentId: a.id,
        circleName: a.circle!.name
      }));
  }
};
