import type { CircleType } from "../../types";
import type { CircleScheduleDraftRow } from "../../circleSchedule";

export const PAGE_SIZES = [6, 12, 24] as const;
export type FormMode = "create" | "edit";
export type CircleTypeFilter = "ALL" | CircleType;
export type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export type CircleDraft = {
  centerId: number | "";
  nameAr: string;
  circleType: CircleType | "";
  primaryTeacherUserId: number | "";
  mosqueName: string;
  useCenterLocation: boolean;
  locationText: string;
  latitude: string;
  longitude: string;
  allowedRadiusMeters: string;
  scheduleRows: CircleScheduleDraftRow[];
};

export const parseNumber = (v: string | null): number | undefined => {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export const circleTypeLabel = (v: CircleType | undefined, ar: boolean) => {
  if (v === "HIFZ") return ar ? "حفظ" : "Hifz";
  if (v === "REVIEW") return ar ? "مراجعة" : "Review";
  if (v === "HIFZ_REVIEW") return ar ? "حفظ + مراجعة" : "Hifz + Review";
  return ar ? "غير محدد" : "N/A";
};

export const circleGenderLabel = (v: string | undefined, ar: boolean) => {
  if (v === "MALE") return ar ? "ذكور" : "Male";
  if (v === "FEMALE") return ar ? "إناث" : "Female";
  return "—";
};
