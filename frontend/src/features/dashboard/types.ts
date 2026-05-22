import type { Role } from "../auth/types";

export type DashboardFilters = {
  centerId?: number;
  circleId?: number;
  from?: string;
  to?: string;
};

export type DashboardMetrics = {
  filters: {
    centerId: number | null;
    circleId: number | null;
    from: string;
    to: string;
  };
  totals: {
    totalStudents: number;
    totalTeachers: number;
    totalCircles: number;
    attendanceTotal: number;
    attendanceRate: number;
    attendanceTrend: "up" | "down" | "stable";
  };
  attendanceByStatus: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
};

export type ActivityFeedItem = {
  id: number;
  activityType: string;
  message: string;
  entityType: string;
  entityId: number | null;
  createdAt: string;
  metadata: unknown;
  user: {
    id: number;
    fullName: string;
    role: Role;
  } | null;
  center: {
    id: number;
    name: string;
  } | null;
  circle: {
    id: number;
    name: string;
  } | null;
};

export type AttendanceSummaryItem = {
  circleId: number;
  circleName: string;
  centerId: number | null;
  centerName: string | null;
  totals: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  total: number;
  attendanceRate: number;
};

export type ActivityFeedFilters = DashboardFilters & {
  limit?: number;
};