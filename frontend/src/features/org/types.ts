export type CenterGender = "MALE" | "FEMALE";
export type CircleType = "HIFZ" | "REVIEW" | "HIFZ_REVIEW";
export type CircleScheduleDay =
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY";
export type CircleScheduleMode = "CLOCK" | "PRAYER";
export type PrayerName = "FAJR" | "DHUHR" | "ASR" | "MAGHRIB" | "ISHA";

export type CircleScheduleClockRow = {
  day: CircleScheduleDay;
  mode: "CLOCK";
  fromTime: string;
  toTime: string;
};

export type CircleSchedulePrayerRow = {
  day: CircleScheduleDay;
  mode: "PRAYER";
  fromPrayer: PrayerName;
  toPrayer: PrayerName;
};

export type CircleScheduleRow = CircleScheduleClockRow | CircleSchedulePrayerRow;

export type PaginatedPayload<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type ListPayload<T> = T[] | PaginatedPayload<T>;

export type NormalizedListResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  isPaginated: boolean;
};

export type Center = {
  id: number;
  code: string;
  name: string; // Arabic name (backward-compatible field)
  nameAr?: string;
  gender?: CenterGender;
  logoUrl?: string | null;
  mosqueName?: string | null;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  timezone?: string;
  centerAdminUserId?: number | null;
  organizationId: number | null;
  isActive?: boolean;
  createdAt: string | null;
  updatedAt?: string | null;
  centerAdmin?: {
    id?: number;
    fullName?: string;
    email?: string;
    isActive?: boolean;
    [key: string]: unknown;
  } | null;
  centerSupervisors?: Array<{
    id?: number;
    supervisorUserId: number;
    isActive?: boolean;
    supervisor?: {
      id?: number;
      fullName?: string;
      email?: string;
      isActive?: boolean;
      [key: string]: unknown;
    } | null;
    [key: string]: unknown;
  }>;
  _count?: {
    circles?: number;
    userCenterAccesses?: number;
  };
  [key: string]: unknown;
};

export type Circle = {
  id: number;
  centerId: number;
  name: string; // Arabic name (backward-compatible field)
  nameAr?: string;
  gender?: CenterGender;
  circleType?: CircleType;
  teacherId: number | null;
  mosqueName?: string | null;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  isActive?: boolean;
  createdAt: string | null;
  updatedAt?: string | null;
  weeklySchedule?: CircleScheduleRow[];
  center?: {
    id?: number;
    name?: string;
    code?: string;
    gender?: CenterGender;
    isActive?: boolean;
    [key: string]: unknown;
  } | null;
  teacher?: {
    id?: number;
    fullName?: string;
    email?: string;
    isActive?: boolean;
    [key: string]: unknown;
  } | null;
  _count?: {
    enrollments?: number;
    students?: number;
  };
  [key: string]: unknown;
};

export type OrgListParams = {
  centerId?: number;
  page?: number;
  pageSize?: number;
};

export type CreateCenterPayload = {
  nameAr: string;
  gender: CenterGender;
  logoUrl?: string | null;
  mosqueName?: string;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  timezone?: string;
  centerAdminUserId: number;
  supervisorUserIds?: number[];
  centerAdminSchedule?: CircleScheduleRow[];
};

export type UpdateCenterPayload = Partial<CreateCenterPayload>;

export type OrganizationBranding = {
  id: number;
  name: string;
  code: string;
  logoUrl?: string | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  associationLocationName?: string | null;
  associationAddress?: string | null;
  associationLatitude?: number | null;
  associationLongitude?: number | null;
  associationGeoRadiusMeters?: number | null;
};

export type UpdateOrganizationBrandingPayload = {
  name?: string;
  logoUrl?: string | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  associationLocationName?: string | null;
  associationAddress?: string | null;
  associationLatitude?: number | null;
  associationLongitude?: number | null;
  associationGeoRadiusMeters?: number | null;
};

export type CreateCirclePayload = {
  centerId: number;
  nameAr: string;
  circleType: CircleType;
  primaryTeacherUserId: number;
  mosqueName?: string;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  weeklySchedule?: CircleScheduleRow[];
};

export type UpdateCirclePayload = {
  nameAr?: string;
  circleType?: CircleType;
  primaryTeacherUserId?: number;
  mosqueName?: string;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  weeklySchedule?: CircleScheduleRow[];
};

export type UpdateEntityStatusPayload = {
  isActive: boolean;
};
