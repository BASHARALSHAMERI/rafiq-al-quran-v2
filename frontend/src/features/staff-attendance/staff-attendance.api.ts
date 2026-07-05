import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../shared/api/http";
import { useAuthStore } from "../auth/auth.store";

type PaginatedResponse<T> = {
  records: T[];
  total: number;
  page: number;
  limit: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const ATTENDANCE_DAILY_LIMIT = 500;

// --- Types ---
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "ON_LEAVE";
export type ExcuseRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type LeaveRequestStatus = "LEAVE_PENDING" | "LEAVE_APPROVED" | "LEAVE_REJECTED";
export type LeaveType = "MEDICAL" | "OFFICIAL" | "PERSONAL" | "UNPAID";
export type StaffRole = "TEACHER" | "SUPERVISOR" | "CENTER_ADMIN" | "SUPER_ADMIN";
export type PrayerName = "FAJR" | "DHUHR" | "ASR" | "MAGHRIB" | "ISHA";
export type GeoState =
  | "VERIFIED"
  | "INSIDE"
  | "OUTSIDE"
  | "OUTSIDE_RANGE"
  | "NOT_SENT"
  | "MISSING_TARGET";
export type DeductionTrigger =
  | "UNEXCUSED_ABSENCE"
  | "LATE_THRESHOLD"
  | "EARLY_DEPARTURE"
  | "UNPAID_LEAVE"
  | "MISSED_VISIT";
export type DeductionCalcType = "FIXED" | "PER_DAY" | "PER_OCCURRENCE";
export type DeductionEventStatus = "PENDING" | "APPROVED" | "REJECTED" | "WAIVED" | "INCLUDED_IN_PAYROLL";
export type VisitPlanStatus = "DRAFT" | "ACTIVE" | "COMPLETED";
export type PlanItemStatus = "PENDING" | "COMPLETED" | "MISSED" | "RESCHEDULED";
export type VisitPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface StaffAttendanceRecord {
  id: number;
  userId: number;
  centerId: number;
  attendanceDate: string;
  status: AttendanceStatus;
  source?: "MANUAL" | "SYSTEM" | "MOBILE" | "IMPORT" | string;
  geoState?: GeoState | string | null;
  lateMinutes?: number | null;
  effectiveShiftStart?: string | null;
  effectiveShiftEnd?: string | null;
  visitsCount?: number;
  checkInTime?: string;
  checkOutTime?: string;
  note?: string;
  user: {
    id: number;
    fullName: string;
    role: string;
    profile: {
      phone: string | null;
      gender: string;
    } | null;
    taughtCircles: Array<{
      id: number;
      name: string;
      weeklyScheduleSlots: Array<{
        dayOfWeek: string;
        fromTime: string | null;
        toTime: string | null;
      }>;
    }>;
  };
}

export interface StaffExcuseRequest {
  id: number;
  userId: number;
  centerId: number;
  absenceDate: string;
  reason: string;
  status: ExcuseRequestStatus;
  handledById?: number;
  handledAt?: string;
  responseNote?: string;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    role: string;
  };
  handledBy?: {
    id: number;
    fullName: string;
  };
}

export type SupervisorVisitLog = SupervisorVisitRecord;
export interface SupervisorVisitRecord {
  id: number;
  organizationId: number;
  centerId: number;
  supervisorId: number;
  category: string;
  status: string;
  rating?: number;
  targetLabel?: string;
  content: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string | null;
  durationMinutes?: number | null;
  startGeoState?: GeoState | string;
  endGeoState?: GeoState | string | null;
  geoState: GeoState;
  visitType?: "PLANNED" | "EMERGENCY";
  planItemId?: number | null;
  checklist?: Array<Record<string, unknown>>;
  observations?: string | null;
  supervisor: {
    id: number;
    fullName: string;
  };
  center: {
    id: number;
    name: string;
  };
  circle?: {
    id: number;
    name: string;
  } | null;
}

export interface StaffMonthlyReport {
  userId: number;
  fullName: string;
  role: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  onLeaveDays: number;
  excusedDays: number;
  workingHours: number;
  expectedHours: number;
  visitsCount: number;
  pendingDeductions: number;
}

export interface StaffLeaveRequest {
  id: number;
  userId: number;
  centerId: number;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string | null;
  status: LeaveRequestStatus;
  handledById?: number | null;
  handledAt?: string | null;
  responseNote?: string | null;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    role: StaffRole | string;
  };
  handledBy?: {
    id: number;
    fullName: string;
  } | null;
}

export type SubmitLeavePayload = {
  centerId: number;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string | null;
};

export interface StaffMonthlyReportResponse {
  workDays: number;
  report: StaffMonthlyReport[];
}

export interface SelfAttendanceRecord {
  id: number;
  attendanceDate: string;
  status: AttendanceStatus;
  source?: string | null;
  geoState?: GeoState | string | null;
  staffRole?: StaffRole | string | null;
  lateMinutes?: number | null;
  earlyDepartureMinutes?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  effectiveShiftStart?: string | null;
  effectiveShiftEnd?: string | null;
  note?: string | null;
}

export interface SelfAttendanceGeoCheck {
  state: "unavailable" | "missing_location" | "inside_range" | "outside_range" | string;
  message?: string;
  isWithinRange: boolean | null;
  distanceMeters: number | null;
  allowedRadiusMeters: number | null;
  locationText?: string | null;
}

export interface SelfAttendanceExcuse {
  id: number;
  absenceDate: string;
  status: ExcuseRequestStatus | string;
  reason: string;
  responseNote?: string | null;
}

export interface SelfAttendanceTarget {
  type?: "CENTER" | "CIRCLE" | string;
  id: number;
  centerId: number;
  name: string;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  timezone?: string | null;
}

export interface SelfAttendanceResponse {
  target?: SelfAttendanceTarget;
  circle?: SelfAttendanceTarget;
  effectiveShift?: {
    start: string;
    end: string;
  } | null;
  policy?: {
    gracePeriodMinutes: number;
    earlyDepartureThresholdMinutes: number;
    weekendDays: string[];
    holidays: AttendanceHolidayPeriod[];
    geoEnforcement: "REQUIRED" | "OPTIONAL";
    timezone: string;
    timeFormat?: "HOUR_12" | "HOUR_24";
  };
  eligibility?: {
    canCheckIn: boolean;
    canCheckOut: boolean;
    checkInBlockedReasons: string[];
    checkOutBlockedReasons: string[];
    warnings: string[];
    isWorkday: boolean;
    isWeekend: boolean;
    isHoliday: boolean;
    shiftStart: string | null;
    shiftEnd: string | null;
    minimumCheckOutAt: string | null;
    minimumCheckOutMinutes: number | null;
    serverNow: string;
  };
  month?: number;
  year?: number;
  today: {
    date?: string;
    status: "checked_in" | "checked_out" | "not_checked_in" | "on_leave" | string;
    attendance: SelfAttendanceRecord | null;
    geoCheck?: SelfAttendanceGeoCheck;
    effectiveShiftStart?: string | null;
    effectiveShiftEnd?: string | null;
    todayExcuse?: unknown;
  };
  stats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    onLeaveDays?: number;
  };
  history: SelfAttendanceRecord[];
  excuses: SelfAttendanceExcuse[];
}

export interface SelfAttendanceActionResponse {
  action: "check_in" | "check_out" | string;
  record: SelfAttendanceRecord;
  geoCheck: SelfAttendanceGeoCheck;
}

export interface AttendanceHolidayPeriod {
  reason: string;
  startDate: string;
  endDate: string;
}

export interface AttendancePolicy {
  gracePeriodMinutes: number;
  autoAbsenceAfterMinutes: number;
  autoAbsenceDelayMinutes: number;
  earlyDepartureThresholdMinutes: number;
  weekendDays: string[];
  holidays: AttendanceHolidayPeriod[];
  geoEnforcementMode: string;
  geoEnforcement: "REQUIRED" | "OPTIONAL";
  timezone: string;
  defaultShiftDurationMinutes: number;
  prayerApiSource: string;
  timeFormat: "HOUR_12" | "HOUR_24";
}

export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface VisitPlanItem {
  id: number;
  planId: number;
  centerId: number;
  circleId?: number | null;
  plannedDate: string;
  plannedTimeWindow?: string | null;
  priority: VisitPriority;
  notes?: string | null;
  status: PlanItemStatus;
  center?: { id: number; name: string };
  circle?: { id: number; name: string } | null;
}

export interface VisitPlan {
  id: number;
  supervisorId: number;
  centerId: number;
  month: number;
  year: number;
  status: VisitPlanStatus;
  items: VisitPlanItem[];
  supervisor: { id: number; fullName: string };
  center?: { id: number; name: string };
  completionRate: number;
}

export type AddPlanItemPayload = Omit<VisitPlanItem, "id" | "planId" | "status" | "center" | "circle">;
export type UpdatePlanItemPayload = Partial<AddPlanItemPayload>;

export interface DeductionRule {
  id: number;
  triggerType: DeductionTrigger;
  deductionType: DeductionCalcType;
  amount: number;
  threshold?: number | null;
  thresholdCount?: number | null;
  
  
  description?: string | null;
  isActive: boolean;
}

export interface DeductionEvent {
  id: number;
  userId: number;
  centerId: number;
  month: number;
  year: number;
  triggerType: DeductionTrigger;
  occurrences: number;
  amount: number;
  status: DeductionEventStatus;
  reviewNote?: string | null;
  user: { id: number; fullName: string; role: string };
  center: { id: number; name: string };
  reviewedBy?: { id: number; fullName: string } | null;
}

export interface DeductionEventsResponse {
  records: DeductionEvent[];
  total: number;
  page: number;
  limit: number;
}


// --- API Keys ---
export const staffOpsKeys = {
  all: ["staffOps"] as const,
  attendance: (date: string) => [...staffOpsKeys.all, "attendance", date] as const,
  excuses: (status?: string) => [...staffOpsKeys.all, "excuses", status] as const,
  leaves: (filters?: unknown) => [...staffOpsKeys.all, "leaves", filters] as const,
  visits: () => [...staffOpsKeys.all, "visits"] as const,
  reports: (month: number, year: number) => [...staffOpsKeys.all, "reports", month, year] as const,
  self: (filters?: unknown) => [...staffOpsKeys.all, "self", filters] as const,

  policy: () => [...staffOpsKeys.all, "policy"] as const,
  visitPlans: (filters?: unknown) => [...staffOpsKeys.all, "visitPlans", filters] as const,
  visitLogs: (filters?: unknown) => [...staffOpsKeys.all, "visitLogs", filters] as const,
  deductionRules: () => [...staffOpsKeys.all, "deductionRules"] as const,
  deductionEvents: (filters?: unknown) => [...staffOpsKeys.all, "deductionEvents", filters] as const,
  staffSchedules: (filters?: unknown) => [...staffOpsKeys.all, "staffSchedules", filters] as const,
  staffUsers: (role?: string) => [...staffOpsKeys.all, "staffUsers", role] as const,
  prayerTimes: (centerId: number, date?: string) => [...staffOpsKeys.all, "prayerTimes", centerId, date] as const,
};


// --- Hooks ---
export function useStaffAttendance(date: string) {
  return useQuery({
    queryKey: staffOpsKeys.attendance(date),
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResponse<StaffAttendanceRecord> }>(
        "/staff-operations",
        { params: { date, page: DEFAULT_PAGE, limit: ATTENDANCE_DAILY_LIMIT } }
      );
      return res.data.data.records;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarkStaffAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { records: any[]; date: string }) => {
      const res = await apiClient.post("/staff-operations", payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.attendance(variables.date) });
    },
  });
}

export function useStaffExcuses(status?: ExcuseRequestStatus) {
  return useQuery({
    queryKey: staffOpsKeys.excuses(status),
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResponse<StaffExcuseRequest> }>(
        "/staff-operations/excuses",
        { params: { status, page: DEFAULT_PAGE, limit: DEFAULT_LIMIT } }
      );
      return res.data.data.records;
    },
  });
}

export function useRequestStaffExcuse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { centerId: number; date: string; reason: string }) => {
      const res = await apiClient.post("/staff-operations/excuses", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.excuses() });
    },
  });
}

export function useUpdateExcuseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: number; status: ExcuseRequestStatus; note?: string }) => {
      const res = await apiClient.patch(`/staff-operations/excuses/${payload.id}/status`, {
        status: payload.status,
        note: payload.note,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.excuses() });
    },
  });
}

export function useLeaveRequests(filters?: {
  centerId?: number;
  userId?: number;
  status?: LeaveRequestStatus;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: staffOpsKeys.leaves(filters),
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResponse<StaffLeaveRequest> }>(
        "/staff-operations/leaves",
        { params: { ...filters, page: DEFAULT_PAGE, limit: DEFAULT_LIMIT } }
      );
      return res.data.data.records;
    },
  });
}

export function useSubmitLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitLeavePayload) => {
      const res = await apiClient.post<{ data: StaffLeaveRequest }>("/staff-operations/leaves", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.all });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, responseNote }: { id: number; responseNote?: string }) => {
      const res = await apiClient.patch<{ data: StaffLeaveRequest }>(`/staff-operations/leaves/${id}/approve`, {
        responseNote,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.all });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, responseNote }: { id: number; responseNote?: string }) => {
      const res = await apiClient.patch<{ data: StaffLeaveRequest }>(`/staff-operations/leaves/${id}/reject`, {
        responseNote,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.all });
    },
  });
}

export function useCancelLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.patch(`/staff-operations/leaves/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.all });
    },
  });
}

export function useSupervisorVisits() {
  return useQuery({
    queryKey: staffOpsKeys.visits(),
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResponse<SupervisorVisitRecord> }>(
        "/staff-operations/visits",
        { params: { page: DEFAULT_PAGE, limit: DEFAULT_LIMIT } }
      );
      return res.data.data.records;
    },
  });
}

export function useStaffMonthlyReport(month: number, year: number) {
  return useQuery({
    queryKey: staffOpsKeys.reports(month, year),
    queryFn: async () => {
      const res = await apiClient.get<{ data: StaffMonthlyReport[] | StaffMonthlyReportResponse }>("/staff-operations/reports/monthly", {
        params: { month, year },
      });
      const data = res.data.data;
      return Array.isArray(data) ? { workDays: 0, report: data } : data;
    },
    enabled: !!month && !!year,
  });
}



export function useAttendancePolicy() {
  return useQuery({
    queryKey: staffOpsKeys.policy(),
    queryFn: async () => {
      const res = await apiClient.get<{ data: AttendancePolicy }>("/attendance-policy");
      return res.data.data;
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AttendancePolicy>) => {
      const res = await apiClient.put<{ data: AttendancePolicy }>("/attendance-policy", payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.policy() });
      // Keep AuthStore in sync so useTimeFormat() reflects the change immediately
      const user = useAuthStore.getState().user;
      if (user && data.timeFormat) {
        useAuthStore.getState().setUser({ ...user, timeFormat: data.timeFormat });
      }
    },
  });
}

export function useSupervisorVisitLogs(filters?: {
  supervisorId?: number;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: staffOpsKeys.visitLogs(filters),
    queryFn: async () => {
      const res = await apiClient.get<{ data: SupervisorVisitRecord[] }>("/supervisor-visits/logs", {
        params: filters,
      });
      return res.data.data;
    },
  });
}

export function useVisitPlans(filters?: {
  supervisorId?: number;
  month?: number;
  year?: number;
  status?: VisitPlanStatus;
}) {
  return useQuery({
    queryKey: staffOpsKeys.visitPlans(filters),
    queryFn: async () => {
      const res = await apiClient.get<{ data: VisitPlan[] }>("/supervisor-visits/plans", {
        params: filters,
      });
      return res.data.data;
    },
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { supervisorId: number; centerId: number; month: number; year: number }) => {
      const res = await apiClient.post<{ data: VisitPlan }>("/supervisor-visits/plans", payload);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffOpsKeys.all }),
  });
}

export function useAddPlanItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, ...payload }: AddPlanItemPayload & { planId: number }) => {
      const res = await apiClient.post<{ data: VisitPlanItem }>(`/supervisor-visits/plans/${planId}/items`, payload);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffOpsKeys.all }),
  });
}

export function useUpdatePlanItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, ...payload }: UpdatePlanItemPayload & { itemId: number }) => {
      const res = await apiClient.put<{ data: VisitPlanItem }>(`/supervisor-visits/plans/items/${itemId}`, payload);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffOpsKeys.all }),
  });
}

export function useRemovePlanItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiClient.delete(`/supervisor-visits/plans/items/${itemId}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffOpsKeys.all }),
  });
}

export function useUpdatePlanStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, status }: { planId: number; status: VisitPlanStatus }) => {
      const res = await apiClient.patch<{ data: VisitPlan }>(`/supervisor-visits/plans/${planId}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffOpsKeys.all }),
  });
}

export function useDeductionRules() {
  return useQuery({
    queryKey: staffOpsKeys.deductionRules(),
    queryFn: async () => {
      const res = await apiClient.get<{ data: DeductionRule[] }>("/finance-deductions/rules");
      return res.data.data;
    },
  });
}

export function useSelfAttendance(filters?: { centerId?: number; circleId?: number; month?: number; year?: number }, enabled = true) {
  return useQuery({
    queryKey: staffOpsKeys.self(filters),
    queryFn: async () => {
      const res = await apiClient.get<{ data: SelfAttendanceResponse }>("/staff-operations/self", {
        params: filters
      });
      return res.data.data;
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useSelfCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { centerId?: number; circleId?: number; latitude?: number | null; longitude?: number | null }) => {
      const res = await apiClient.post<{ data: SelfAttendanceActionResponse }>("/staff-operations/self/check-in", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.all });
    },
  });
}

export function useSelfCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { centerId?: number; circleId?: number; latitude?: number | null; longitude?: number | null }) => {
      const res = await apiClient.post<{ data: SelfAttendanceActionResponse }>("/staff-operations/self/check-out", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.all });
    },
  });
}

export function useUpsertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DeductionRule> & { triggerType: DeductionTrigger }) => {
      const res = await apiClient.post<{ data: DeductionRule }>("/finance-deductions/rules", payload);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffOpsKeys.deductionRules() }),
  });
}

export function useDeductionEvents(filters?: {
  month?: number;
  year?: number;
  centerId?: number;
  triggerType?: DeductionTrigger;
  status?: DeductionEventStatus;
}) {
  return useQuery({
    queryKey: staffOpsKeys.deductionEvents(filters),
    queryFn: async () => {
      const res = await apiClient.get<{ data: DeductionEventsResponse }>("/finance-deductions/deductions", {
        params: {
          ...filters,
          page: 1,
          limit: 100,
        },
      });
      return res.data.data;
    },
  });
}

export function useGenerateDeductions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { month: number; year: number; centerId?: number }) => {
      const res = await apiClient.post("/finance-deductions/deductions/generate", payload);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffOpsKeys.all }),
  });
}

// ─────────────────────────────────────────────────
// Staff Schedule Types + Hooks
// ─────────────────────────────────────────────────
export interface StaffScheduleSlot {
  id?: number;
  dayOfWeek: string;
  mode: "CLOCK" | "PRAYER";
  fromTime?: string | null;
  toTime?: string | null;
  fromPrayer?: string | null;
  toPrayer?: string | null;
  fromPrayerOffsetMinutes?: number | null;
  toPrayerOffsetMinutes?: number | null;
  defaultDurationMinutes?: number | null;
}

export interface StaffScheduleAssignment {
  id: number;
  userId: number;
  staffRole: string;
  centerId: number;
  circleId?: number | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  locationText?: string | null;
  isActive: boolean;
  createdAt: string;
  slots: StaffScheduleSlot[];
  user: { id: number; fullName: string; role: string };
  center: { id: number; name: string };
  circle?: { id: number; name: string } | null;
}

export type CreateSchedulePayload = {
  userId: number;
  staffRole: string;
  centerId: number;
  circleId?: number | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  locationText?: string | null;
  slots: Omit<StaffScheduleSlot, "id">[];
};

export type UpdateSchedulePayload = {
  effectiveTo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  locationText?: string | null;
  slots?: Omit<StaffScheduleSlot, "id">[];
};

export interface StaffUserOption {
  id: number;
  fullName: string;
  role: string;
}

export function useStaffSchedules(filters?: { centerId?: number; staffRole?: string; isActive?: boolean; userId?: number }) {
  return useQuery({
    queryKey: staffOpsKeys.staffSchedules(filters),
    queryFn: async () => {
      const res = await apiClient.get<{ data: StaffScheduleAssignment[] }>("/staff-schedules", { params: filters });
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useStaffUsersByRole(role?: string) {
  return useQuery({
    queryKey: staffOpsKeys.staffUsers(role),
    queryFn: async () => {
      const res = await apiClient.get<{ data: StaffUserOption[] }>("/users", { params: role ? { role } : {} });
      return res.data.data;
    },
    enabled: !!role,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateStaffSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSchedulePayload) => {
      const res = await apiClient.post<{ data: StaffScheduleAssignment }>("/staff-schedules", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.staffSchedules() });
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.self() });
    },
  });
}

export function useUpdateStaffSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: UpdateSchedulePayload }) => {
      const res = await apiClient.put<{ data: StaffScheduleAssignment }>(`/staff-schedules/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.staffSchedules() });
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.self() });
    },
  });
}

export function useDeactivateStaffSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/staff-schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.staffSchedules() });
      queryClient.invalidateQueries({ queryKey: staffOpsKeys.self() });
    },
  });
}

export type CreateVisitPayload = {
  centerId: number;
  circleId?: number | null;
  planItemId?: number | null;
  startLatitude?: number | null;
  startLongitude?: number | null;
  observations?: string | null;
};

export type EndVisitPayload = {
  endLatitude?: number | null;
  endLongitude?: number | null;
  rating?: number | null;
  observations?: string | null;
  checklist?: unknown[];
};

export function useCreateVisitLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateVisitPayload) => {
      const res = await apiClient.post<{ data: SupervisorVisitLog }>("/staff-operations/visits", payload);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffOpsKeys.all }),
  });
}

export function useEndVisitLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ visitId, payload }: { visitId: number; payload: EndVisitPayload }) => {
      const res = await apiClient.patch<{ data: SupervisorVisitLog }>(`/staff-operations/visits/${visitId}/end`, payload);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffOpsKeys.all }),
  });
}

export function useExportMonthlyReport() {
  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      const res = await apiClient.get("/staff-operations/reports/export", {
        params: { month, year },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance-report-${year}-${String(month).padStart(2, "0")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}

export function useReviewDeduction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      action,
      note,
      reviewNote
    }: {
      id: number;
      status?: DeductionEventStatus;
      action?: DeductionEventStatus;
      note?: string;
      reviewNote?: string;
    }) => {
      const res = await apiClient.patch<{ data: DeductionEvent }>(`/finance-deductions/deductions/${id}/review`, {
        status: status ?? action,
        note: note ?? reviewNote,
      });
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffOpsKeys.all }),
  });
}

export function usePrayerTimes(centerId: number, date?: string, enabled = true) {
  return useQuery({
    queryKey: staffOpsKeys.prayerTimes(centerId, date),
    queryFn: async () => {
      const res = await apiClient.get<{ data: PrayerTimes | null }>(`/staff-operations/prayer-times/${centerId}`, {
        params: date ? { date } : undefined
      });
      return res.data.data;
    },
    enabled: enabled && !!centerId
  });
}
