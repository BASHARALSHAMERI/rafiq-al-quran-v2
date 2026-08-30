import { AppError } from "../../shared/errors/app-error";
import { safeDate } from "../../shared/utils/time";

export type DateRange = {
  from: Date;
  to: Date;
};

const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

export const dashboardDomain = {
  resolveDateRange(from?: string, to?: string): DateRange {
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 30);

    const resolvedFrom = from ? safeDate(from, "from") : defaultFrom;
    const resolvedTo = to ? safeDate(to, "to") : now;

    const normalized = {
      from: startOfDay(resolvedFrom),
      to: endOfDay(resolvedTo)
    };

    if (normalized.from > normalized.to) {
      throw new AppError("Date range is invalid: from must be before to", 400);
    }

    return normalized;
  },

  intersect(base: number[], other: number[]): number[] {
    const set = new Set(other);
    return base.filter((value) => set.has(value));
  },

  attendanceRate(presentCount: number, totalCount: number): number {
    if (!totalCount) {
      return 0;
    }

    return Number(((presentCount / totalCount) * 100).toFixed(2));
  },

  staffAttendanceRate(present: number, late: number, absent: number): number {
    const accountable = present + late + absent;
    return accountable ? Number((((present + late) / accountable) * 100).toFixed(2)) : 0;
  }
};