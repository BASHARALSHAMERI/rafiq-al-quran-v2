import type { CenterGender } from "../../../org/types";
import {
  createEmptyScheduleDraftRows,
  validateScheduleDraftRows,
  type CircleScheduleDraftRow
} from "../../circleSchedule";

export const PAGE_SIZES = [5, 10, 20] as const;

export type FormMode = "create" | "edit";
export type QuickRole = "CENTER_ADMIN" | "SUPERVISOR";
export type GenderFilter = "ALL" | "MALE" | "FEMALE";
export type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export type CenterDraft = {
  nameAr: string;
  gender: CenterGender | "";
  logoUrl: string;
  mosqueName: string;
  latitude: string;
  longitude: string;
  allowedRadiusMeters: string;
  centerAdminUserId: number | "";
  supervisorUserIds: number[];
  scheduleRows: CircleScheduleDraftRow[];
};

export const emptyCenterDraft: CenterDraft = {
  nameAr: "",
  gender: "",
  logoUrl: "",
  mosqueName: "",
  latitude: "",
  longitude: "",
  allowedRadiusMeters: "500",
  centerAdminUserId: "",
  supervisorUserIds: [],
  scheduleRows: createEmptyScheduleDraftRows()
};

export const genderLabel = (g: CenterGender | undefined, ar: boolean) =>
  g === "MALE"
    ? ar
      ? "\u0630\u0643\u0648\u0631"
      : "Male"
    : g === "FEMALE"
      ? ar
        ? "\u0625\u0646\u0627\u062b"
        : "Female"
      : "—";

export const validateCenter = (d: CenterDraft, ar: boolean, geoEnforcement?: string, weekendDays?: string[]) => {
  if (!d.nameAr.trim()) {
    return ar ? "اسم المركز مطلوب" : "Name required";
  }

  if (d.nameAr.trim().length < 3) {
    return ar ? "اسم المركز يجب أن يكون 3 أحرف على الأقل" : "Center name must be at least 3 characters";
  }

  if (!d.gender) {
    return ar
      ? "الفئة المستهدفة مطلوبة"
      : "Gender required";
  }

  if (!d.centerAdminUserId) {
    return ar
      ? "تعيين مدير المركز مطلوب"
      : "Admin required";
  }

  if ((geoEnforcement === "REQUIRED" || geoEnforcement === "STRICT") && (!d.latitude || !d.longitude)) {
    return ar
      ? "تحديد الموقع الجغرافي للمركز إلزامي بناءً على سياسة الحضور"
      : "Center location is required by the attendance policy";
  }

  const scheduleError = validateScheduleDraftRows(d.scheduleRows, ar, weekendDays);
  if (scheduleError) return scheduleError;

  return null;
};
