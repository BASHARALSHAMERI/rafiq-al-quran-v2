import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type {
  Center,
  Circle,
  CircleScheduleDay,
  CircleScheduleRow,
  CreateCenterPayload,
  CreateCirclePayload,
  OrganizationBranding,
  ListPayload,
  NormalizedListResult,
  OrgListParams,
  PrayerName,
  UpdateCenterPayload,
  UpdateCirclePayload,
  UpdateOrganizationBrandingPayload,
  UpdateEntityStatusPayload
} from "./types";

const normalizeListResult = <T>(payload: ListPayload<T>): NormalizedListResult<T> => {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      page: 1,
      pageSize: payload.length,
      total: payload.length,
      isPaginated: false
    };
  }

  return {
    items: payload.items,
    page: payload.page,
    pageSize: payload.pageSize,
    total: payload.total,
    isPaginated: true
  };
};

const normalizeCenter = (value: Center): Center => {
  const centerSupervisors = Array.isArray(value.centerSupervisors)
    ? value.centerSupervisors.map((item) => ({
        ...item,
        supervisorUserId: Number(item.supervisorUserId)
      }))
    : [];

  return {
    ...value,
    id: Number(value.id),
    code: String(value.code ?? ""),
    name: String(value.name ?? ""),
    nameAr: String((value.nameAr ?? value.name) ?? ""),
    gender: value.gender,
    logoUrl: typeof value.logoUrl === "string" ? value.logoUrl : null,
    mosqueName: typeof value.mosqueName === "string" ? value.mosqueName : null,
    timezone: typeof value.timezone === "string" ? value.timezone : "Asia/Riyadh",
    centerAdminUserId:
      typeof value.centerAdminUserId === "number" ? value.centerAdminUserId : null,
    organizationId: typeof value.organizationId === "number" ? value.organizationId : null,
    isActive: typeof value.isActive === "boolean" ? value.isActive : undefined,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : null,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
    centerSupervisors
  };
};

const normalizeBranding = (value: OrganizationBranding): OrganizationBranding => ({
  ...value,
  id: Number(value.id),
  name: String(value.name ?? ""),
  code: String(value.code ?? ""),
  logoUrl: typeof value.logoUrl === "string" ? value.logoUrl : null,
  createdAt: typeof value.createdAt === "string" ? value.createdAt : null,
  updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null
});

const SCHEDULE_DAYS = new Set<CircleScheduleDay>([
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY"
]);

const PRAYER_NAMES = new Set<PrayerName>(["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"]);

const parseScheduleRow = (raw: unknown): CircleScheduleRow | null => {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const day = row.day;
  const mode = row.mode;

  if (typeof day !== "string" || !SCHEDULE_DAYS.has(day as CircleScheduleDay)) return null;
  if (mode === "CLOCK") {
    if (typeof row.fromTime !== "string" || typeof row.toTime !== "string") return null;
    return {
      day: day as CircleScheduleDay,
      mode: "CLOCK",
      fromTime: row.fromTime,
      toTime: row.toTime
    };
  }
  if (mode === "PRAYER") {
    if (
      typeof row.fromPrayer !== "string" ||
      typeof row.toPrayer !== "string" ||
      !PRAYER_NAMES.has(row.fromPrayer as PrayerName) ||
      !PRAYER_NAMES.has(row.toPrayer as PrayerName)
    ) {
      return null;
    }
    return {
      day: day as CircleScheduleDay,
      mode: "PRAYER",
      fromPrayer: row.fromPrayer as PrayerName,
      toPrayer: row.toPrayer as PrayerName
    };
  }
  return null;
};

const normalizeCircleWeeklySchedule = (value: Circle): CircleScheduleRow[] => {
  const direct = (value as { weeklySchedule?: unknown }).weeklySchedule;
  if (Array.isArray(direct)) {
    return direct.map(parseScheduleRow).filter((row): row is CircleScheduleRow => Boolean(row));
  }

  const slots = (value as { weeklyScheduleSlots?: unknown }).weeklyScheduleSlots;
  if (!Array.isArray(slots)) {
    return [];
  }

  return slots
    .map((slot) => {
      if (!slot || typeof slot !== "object") return null;
      const row = slot as Record<string, unknown>;
      const mode = row.mode;
      const dayOfWeek = row.dayOfWeek;
      if (typeof dayOfWeek !== "string" || !SCHEDULE_DAYS.has(dayOfWeek as CircleScheduleDay)) return null;
      if (mode === "CLOCK") {
        if (typeof row.fromTime !== "string" || typeof row.toTime !== "string") return null;
        return {
          day: dayOfWeek as CircleScheduleDay,
          mode: "CLOCK",
          fromTime: row.fromTime,
          toTime: row.toTime
        } satisfies CircleScheduleRow;
      }
      if (mode === "PRAYER") {
        if (
          typeof row.fromPrayer !== "string" ||
          typeof row.toPrayer !== "string" ||
          !PRAYER_NAMES.has(row.fromPrayer as PrayerName) ||
          !PRAYER_NAMES.has(row.toPrayer as PrayerName)
        ) {
          return null;
        }
        return {
          day: dayOfWeek as CircleScheduleDay,
          mode: "PRAYER",
          fromPrayer: row.fromPrayer as PrayerName,
          toPrayer: row.toPrayer as PrayerName
        } satisfies CircleScheduleRow;
      }
      return null;
    })
    .filter((row): row is CircleScheduleRow => Boolean(row));
};

const normalizeCircle = (value: Circle): Circle => {
  const centerId =
    typeof value.centerId === "number"
      ? value.centerId
      : typeof value.center?.id === "number"
        ? value.center.id
        : 0;

  const teacherId =
    typeof value.teacherId === "number"
      ? value.teacherId
      : typeof value.teacher?.id === "number"
        ? value.teacher.id
        : null;

  const enrollmentsCount =
    typeof value._count?.enrollments === "number"
      ? value._count.enrollments
      : typeof value._count?.students === "number"
        ? value._count.students
        : undefined;

  return {
    ...value,
    id: Number(value.id),
    centerId,
    name: String(value.name ?? ""),
    nameAr: String((value.nameAr ?? value.name) ?? ""),
    gender: value.gender,
    circleType: value.circleType,
    teacherId,
    mosqueName: typeof value.mosqueName === "string" ? value.mosqueName : null,
    isActive: typeof value.isActive === "boolean" ? value.isActive : undefined,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : null,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
    weeklySchedule: normalizeCircleWeeklySchedule(value),
    _count: {
      ...(value._count ?? {}),
      ...(typeof enrollmentsCount === "number"
        ? { enrollments: enrollmentsCount, students: enrollmentsCount }
        : {})
    }
  };
};

export const orgApi = {
  async getBranding(): Promise<OrganizationBranding> {
    const response = await apiClient.get<ApiResponse<OrganizationBranding>>("/public/branding");
    return normalizeBranding(response.data.data);
  },

  async updateBranding(payload: UpdateOrganizationBrandingPayload): Promise<OrganizationBranding> {
    const response = await apiClient.patch<ApiResponse<OrganizationBranding>>("/org/branding", payload);
    return normalizeBranding(response.data.data);
  },

  async getCenters(): Promise<NormalizedListResult<Center>> {
    const response = await apiClient.get<ApiResponse<ListPayload<Center>>>("/org/centers");
    const normalized = normalizeListResult(response.data.data);

    return {
      ...normalized,
      items: normalized.items.map((center) => normalizeCenter(center))
    };
  },

  async getCircles(params?: OrgListParams): Promise<NormalizedListResult<Circle>> {
    const response = await apiClient.get<ApiResponse<ListPayload<Circle>>>("/org/circles", {
      params: {
        centerId: params?.centerId
      }
    });

    const normalized = normalizeListResult(response.data.data);

    return {
      ...normalized,
      items: normalized.items.map((circle) => normalizeCircle(circle))
    };
  },

  async createCenter(payload: CreateCenterPayload): Promise<Center> {
    const response = await apiClient.post<ApiResponse<Center>>("/org/centers", payload);
    return normalizeCenter(response.data.data);
  },

  async updateCenter(centerId: number, payload: UpdateCenterPayload): Promise<Center> {
    const response = await apiClient.patch<ApiResponse<Center>>(`/org/centers/${centerId}`, payload);
    return normalizeCenter(response.data.data);
  },

  async updateCenterStatus(centerId: number, payload: UpdateEntityStatusPayload): Promise<Center> {
    const response = await apiClient.patch<ApiResponse<Center>>(
      `/org/centers/${centerId}/status`,
      payload
    );
    return normalizeCenter(response.data.data);
  },

  async createCircle(payload: CreateCirclePayload): Promise<Circle> {
    const response = await apiClient.post<ApiResponse<Circle>>("/org/circles", payload);
    return normalizeCircle(response.data.data);
  },

  async updateCircle(circleId: number, payload: UpdateCirclePayload): Promise<Circle> {
    const response = await apiClient.patch<ApiResponse<Circle>>(`/org/circles/${circleId}`, payload);
    return normalizeCircle(response.data.data);
  },

  async updateCircleStatus(circleId: number, payload: UpdateEntityStatusPayload): Promise<Circle> {
    const response = await apiClient.patch<ApiResponse<Circle>>(
      `/org/circles/${circleId}/status`,
      payload
    );
    return normalizeCircle(response.data.data);
  }
};
