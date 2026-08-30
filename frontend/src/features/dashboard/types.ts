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
    previousAttendanceRate: number;
    attendanceDelta: number;
    attendanceTrend: "up" | "down" | "stable";
  };
  attendanceByStatus: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  staffAttendance: {
    applicable: boolean;
    dataKind: "RECORDED_ATTENDANCE";
    coverage: {
      scheduledWithoutRecord: null;
      withoutActiveShift: null;
      dataSufficiency: "RECORDED_ONLY";
    };
    totals: StaffAttendanceTotals;
    recordedTotal: number;
    attendanceRate: number;
    byRole: Array<StaffAttendanceTotals & {
      staffRole: string;
      recordedTotal: number;
    }>;
    lastUpdatedAt: string | null;
  };
  lastUpdatedAt: string | null;
};

export type StaffAttendanceTotals = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  onLeave: number;
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
  teacher: {
    id: number;
    fullName: string;
  } | null;
  activeStudents: number;
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