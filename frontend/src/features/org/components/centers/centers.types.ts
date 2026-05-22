import type { CenterGender } from "../../../org/types";
import {
  createEmptyScheduleDraftRows,
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
  centerAdminUserId: number | "";
  supervisorUserIds: number[];
  scheduleRows: CircleScheduleDraftRow[];
};

export const emptyCenterDraft: CenterDraft = {
  nameAr: "",
  gender: "",
  logoUrl: "",
  mosqueName: "",
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

export const validateCenter = (d: CenterDraft, ar: boolean) => {
  if (!d.nameAr.trim()) {
    return ar ? "\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0643\u0632 \u0645\u0637\u0644\u0648\u0628" : "Name required";
  }

  if (!d.gender) {
    return ar
      ? "\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0629 \u0645\u0637\u0644\u0648\u0628\u0629"
      : "Gender required";
  }

  if (!d.centerAdminUserId) {
    return ar
      ? "\u062a\u0639\u064a\u064a\u0646 \u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0631\u0643\u0632 \u0645\u0637\u0644\u0648\u0628"
      : "Admin required";
  }

  return null;
};
