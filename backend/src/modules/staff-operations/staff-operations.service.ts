import {
  Prisma,
  AttendanceStatus,
  AttendanceSource,
  ExcuseRequestStatus,
  LeaveRequestStatus,
  LeaveType,
  DeductionEventStatus,
  StaffRoleType,
  Role
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import { ScopeContext } from "../../shared/types/auth.types";
import { effectiveShiftService } from "./effective-shift.service";
import { attendancePolicyService } from "./attendance-policy.service";

const toStartOfDay = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toEndOfDay = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const getMonthRange = (month: number, year: number) => {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { from, to };
};

const getTimeZoneDateParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value ?? "0");

  return {
    year: part("year"),
    month: part("month"),
    day: part("day")
  };
};

const getAttendanceDateForTimeZone = (date: Date, timeZone: string) => {
  const parts = getTimeZoneDateParts(date, timeZone);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
};

const getMonthYearForTimeZone = (date: Date, timeZone: string) => {
  const parts = getTimeZoneDateParts(date, timeZone);
  return { month: parts.month, year: parts.year };
};

const haversineMeters = (input: {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}) => {
  const rad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = rad(input.toLat - input.fromLat);
  const dLng = rad(input.toLng - input.fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(input.fromLat)) *
      Math.cos(rad(input.toLat)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const serializeGeoCheck = (input: {
  circle: {
    locationText: string | null;
    latitude: Prisma.Decimal | number | null;
    longitude: Prisma.Decimal | number | null;
    allowedRadiusMeters: number | null;
  };
  latitude?: number | null;
  longitude?: number | null;
}) => {
  const configuredLatitude =
    input.circle.latitude === null || input.circle.latitude === undefined
      ? null
      : Number(input.circle.latitude);
  const configuredLongitude =
    input.circle.longitude === null || input.circle.longitude === undefined
      ? null
      : Number(input.circle.longitude);
  const configuredRadius = input.circle.allowedRadiusMeters ?? null;
  const hasCircleGeo =
    configuredLatitude !== null &&
    configuredLongitude !== null &&
    configuredRadius !== null;
  const hasPayloadGeo = input.latitude !== null && input.latitude !== undefined &&
    input.longitude !== null && input.longitude !== undefined;

  if (!hasCircleGeo) {
    return {
      state: "unavailable",
      message: "لم يتم تجهيز نطاق جغرافي لهذا الموقع بعد",
      isWithinRange: null,
      distanceMeters: null,
      allowedRadiusMeters: configuredRadius,
      locationText: input.circle.locationText
    };
  }

  if (!hasPayloadGeo) {
    return {
      state: "missing_location",
      message: "لم يتم إرسال موقع الجهاز للتحقق",
      isWithinRange: null,
      distanceMeters: null,
      allowedRadiusMeters: configuredRadius,
      locationText: input.circle.locationText
    };
  }

  const distanceMeters = haversineMeters({
    fromLat: Number(input.latitude),
    fromLng: Number(input.longitude),
    toLat: configuredLatitude,
    toLng: configuredLongitude
  });
  const isWithinRange = distanceMeters <= configuredRadius;

  return {
    state: isWithinRange ? "inside_range" : "outside_range",
    message: isWithinRange
      ? "تم التحقق من الموقع داخل النطاق المعتمد"
      : "تم التسجيل من خارج النطاق المعتمد",
    isWithinRange,
    distanceMeters: Math.round(distanceMeters),
    allowedRadiusMeters: configuredRadius,
    locationText: input.circle.locationText
  };
};

const mapAttendanceSourceToApi = (source: AttendanceSource | null | undefined): "MANUAL" | "SYSTEM" | "MOBILE" | "IMPORT" => {
  switch (source) {
    case AttendanceSource.SYSTEM:
      return "SYSTEM";
    case AttendanceSource.IMPORT:
      return "IMPORT";
    case AttendanceSource.SELF_CHECK_IN:
      return "MOBILE";
    default:
      return "MANUAL";
  }
};

const inferGeoStateFromNote = (record: { note?: string | null; checkInTime?: Date | null; checkOutTime?: Date | null }) => {
  if (!record.checkInTime && !record.checkOutTime) return "NOT_SENT";
  const text = String(record.note ?? "").toLowerCase();
  if (text.includes("outside") || text.includes("خارج")) return "OUTSIDE_RANGE";
  return "VERIFIED";
};

const minutesBetween = (later: Date, earlier: Date) => {
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / 60000));
};

const WEEKDAY_JS_MAP: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY"
};

const isHolidayDate = (
  dateKey: string,
  holidays: Array<{ startDate: string; endDate: string }>
) => holidays.some((holiday) => holiday.startDate <= dateKey && dateKey <= holiday.endDate);

const getAttendanceWorkdayState = (
  attendanceDate: Date,
  policy: {
    weekendDays: string[];
    holidays: Array<{ startDate: string; endDate: string }>;
  }
) => {
  const dateKey = attendanceDate.toISOString().slice(0, 10);
  const weekday = WEEKDAY_JS_MAP[attendanceDate.getUTCDay()];
  const isWeekend = policy.weekendDays.includes(weekday);
  const isHoliday = isHolidayDate(dateKey, policy.holidays);

  return {
    dateKey,
    weekday,
    isWorkday: !isWeekend && !isHoliday,
    isWeekend,
    isHoliday
  };
};

const formatMinuteDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} ساعة و${remainingMinutes} دقيقة` : `${hours} ساعة`;
};

const buildSelfAttendanceEligibility = (input: {
  now: Date;
  attendanceDate: Date;
  todayStatus: string;
  todayRecord: { checkInTime: Date | null; checkOutTime: Date | null } | null;
  effectiveShift: { start: Date; end: Date } | null;
  policy: {
    weekendDays: string[];
    holidays: Array<{ startDate: string; endDate: string }>;
    gracePeriodMinutes: number;
    geoEnforcement: "REQUIRED" | "OPTIONAL";
  };
  geoCheck: ReturnType<typeof serializeGeoCheck>;
}) => {
  const workday = getAttendanceWorkdayState(input.attendanceDate, input.policy);
  const reasons: string[] = [];
  const warnings: string[] = [];
  const shiftStart = input.effectiveShift?.start ?? null;
  const shiftEnd = input.effectiveShift?.end ?? null;
  const shiftDurationMinutes =
    shiftStart && shiftEnd ? Math.max(0, minutesBetween(shiftEnd, shiftStart)) : 0;
  const minimumCheckOutAt =
    shiftStart && shiftDurationMinutes > 0
      ? new Date(shiftStart.getTime() + Math.floor(shiftDurationMinutes / 2) * 60_000)
      : null;

  if (!workday.isWorkday) {
    reasons.push(workday.isWeekend ? "اليوم عطلة أسبوعية حسب سياسة الحضور." : "اليوم ضمن الإجازات المعتمدة في سياسة الحضور.");
  }

  if (!input.effectiveShift) {
    reasons.push("لا يوجد دوام محدد لهذا اليوم.");
  }

  if (shiftStart && input.now < shiftStart) {
    reasons.push("لم يبدأ وقت الدوام بعد.");
  }

  if (shiftEnd && input.now > shiftEnd && !input.todayRecord?.checkInTime) {
    reasons.push("انتهى وقت الدوام ولا يمكن تسجيل الحضور الآن.");
  }

  if (input.todayStatus === "on_leave") {
    reasons.push("لديك إجازة معتمدة لهذا اليوم.");
  }

  if (input.todayStatus === "excuse_requested") {
    reasons.push("يوجد طلب عذر مرتبط بهذا اليوم.");
  }

  if (input.policy.geoEnforcement === "REQUIRED" && input.geoCheck.isWithinRange !== true) {
    reasons.push(input.geoCheck.message);
  } else if (input.geoCheck.isWithinRange === false) {
    warnings.push(input.geoCheck.message);
  }

  const checkInBlocked =
    reasons.length > 0 ||
    Boolean(input.todayRecord?.checkInTime) ||
    Boolean(input.todayRecord?.checkOutTime);

  const checkOutReasons: string[] = [];
  if (!input.todayRecord?.checkInTime) {
    checkOutReasons.push("يجب تسجيل الحضور أولاً قبل الانصراف.");
  }
  if (input.todayRecord?.checkOutTime) {
    checkOutReasons.push("تم تسجيل الانصراف لهذا اليوم.");
  }
  if (minimumCheckOutAt && input.now < minimumCheckOutAt) {
    checkOutReasons.push(`لا يمكن تسجيل الانصراف قبل مرور نصف مدة الدوام (${formatMinuteDuration(Math.floor(shiftDurationMinutes / 2))}).`);
  }
  if (!workday.isWorkday) {
    checkOutReasons.push(workday.isWeekend ? "اليوم عطلة أسبوعية حسب سياسة الحضور." : "اليوم ضمن الإجازات المعتمدة في سياسة الحضور.");
  }
  if (!input.effectiveShift) {
    checkOutReasons.push("لا يوجد دوام محدد لهذا اليوم.");
  }
  if (input.todayStatus === "on_leave") {
    checkOutReasons.push("لديك إجازة معتمدة لهذا اليوم.");
  }
  if (input.policy.geoEnforcement === "REQUIRED" && input.geoCheck.isWithinRange !== true) {
    checkOutReasons.push(input.geoCheck.message);
  }

  return {
    canCheckIn: !checkInBlocked,
    canCheckOut: checkOutReasons.length === 0,
    checkInBlockedReasons: Array.from(new Set(reasons)),
    checkOutBlockedReasons: Array.from(new Set(checkOutReasons)),
    warnings,
    isWorkday: workday.isWorkday,
    isWeekend: workday.isWeekend,
    isHoliday: workday.isHoliday,
    shiftStart: shiftStart?.toISOString() ?? null,
    shiftEnd: shiftEnd?.toISOString() ?? null,
    minimumCheckOutAt: minimumCheckOutAt?.toISOString() ?? null,
    minimumCheckOutMinutes: shiftDurationMinutes > 0 ? Math.floor(shiftDurationMinutes / 2) : null,
    serverNow: input.now.toISOString()
  };
};

const resolveStaffRole = (role: Role): StaffRoleType => {
  switch (role) {
    case Role.TEACHER:
      return StaffRoleType.TEACHER;
    case Role.SUPERVISOR:
      return StaffRoleType.SUPERVISOR;
    case Role.CENTER_ADMIN:
      return StaffRoleType.CENTER_ADMIN;
    default:
      return StaffRoleType.OTHER;
  }
};

const serializeSelfAttendanceRecord = (
  record: {
    id: number;
    attendanceDate: Date;
    status: AttendanceStatus;
    source?: AttendanceSource;
    staffRole?: string;
    lateMinutes?: number | null;
    earlyDepartureMinutes?: number | null;
    checkInTime: Date | null;
    checkOutTime: Date | null;
    note: string | null;
  },
  effectiveShift?: { start: Date; end: Date } | null
) => ({
  id: record.id,
  attendanceDate: record.attendanceDate.toISOString().slice(0, 10),
  status: record.status,
  source: mapAttendanceSourceToApi(record.source),
  geoState: inferGeoStateFromNote(record),
  staffRole: record.staffRole ?? null,
  lateMinutes: record.lateMinutes ?? null,
  earlyDepartureMinutes: record.earlyDepartureMinutes ?? null,
  checkInTime: record.checkInTime?.toISOString() ?? null,
  checkOutTime: record.checkOutTime?.toISOString() ?? null,
  effectiveShiftStart: effectiveShift?.start?.toISOString() ?? null,
  effectiveShiftEnd: effectiveShift?.end?.toISOString() ?? null,
  note: record.note
});

export const staffOperationsService = {

  // ==========================================
  // 1. Staff Attendance
  // ==========================================
  async listAttendance(
    scope: ScopeContext,
    query: { date?: string; page: number; limit: number }
  ) {
    const targetDate = query.date ? toStartOfDay(query.date) : toStartOfDay(new Date());
    const skip = (query.page - 1) * query.limit;

    let whereClause: Prisma.StaffAttendanceRecordWhereInput = {
      organizationId: scope.organizationId,
      attendanceDate: targetDate,
    };

    if (!scope.allAccess && scope.centerIds.length > 0) {
      whereClause.centerId = { in: scope.centerIds };
    }

    if (scope.role === Role.TEACHER) {
      whereClause.userId = scope.userId;
    }

    const [records, total] = await prisma.$transaction([
      (prisma as any).staffAttendanceRecord.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              role: true,
              profile: { select: { phone: true, gender: true } },
              taughtCircles: {
                include: { weeklyScheduleSlots: true }
              }
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.staffAttendanceRecord.count({
        where: whereClause,
      })
    ]);

    const supervisorIds: number[] = Array.from(
      new Set(
        records
          .filter((record: any) => record.user.role === Role.SUPERVISOR)
          .map((record: any) => record.userId)
      )
    );

    const visitCounts = supervisorIds.length > 0
      ? await prisma.supervisorVisitLog.groupBy({
          by: ["supervisorId"],
          where: {
            organizationId: scope.organizationId,
            supervisorId: { in: supervisorIds },
            startedAt: {
              gte: targetDate,
              lte: toEndOfDay(targetDate),
            },
          },
          _count: { _all: true },
        })
      : [];

    const visitCountsBySupervisor = new Map<number, number>(
      visitCounts.map((visit) => [visit.supervisorId, visit._count._all ?? 0])
    );

    const effectiveShifts = await Promise.all(
      records.map(async (record: any) => {
        const shift = await effectiveShiftService.resolveEffectiveShift(
          record.userId,
          new Date(record.attendanceDate),
          record.centerId,
          scope.organizationId
        );
        return [record.id, shift] as const;
      })
    );

    const shiftByRecordId = new Map<number, { start: Date; end: Date } | null>(effectiveShifts);

    const enriched = records.map((record: any) => {
      const shift = shiftByRecordId.get(record.id) ?? null;
      return {
        ...record,
        source: mapAttendanceSourceToApi(record.source),
        geoState: inferGeoStateFromNote(record),
        effectiveShiftStart: shift?.start?.toISOString() ?? null,
        effectiveShiftEnd: shift?.end?.toISOString() ?? null,
        visitsCount:
          record.user.role === Role.SUPERVISOR
            ? visitCountsBySupervisor.get(record.userId) ?? 0
            : 0,
      };
    });

    return {
      records: enriched,
      total,
      page: query.page,
      limit: query.limit,
    };
  },

  async markAttendance(scope: ScopeContext, records: Array<{ userId: number; centerId: number; status: AttendanceStatus; note?: string }>, dateStr: string) {
    const attendanceDate = new Date(dateStr);
    attendanceDate.setHours(0, 0, 0, 0);

    if (scope.role === Role.TEACHER) {
        // Teacher can only mark their own attendance
        const myRecord = records.find(r => r.userId === scope.userId);
        if (!myRecord) {
            throw new AppError("Teachers can only mark their own attendance", 403);
        }
        records = [myRecord];
    } else if (!scope.allAccess && scope.centerIds.length > 0) {
      // Admin/Supervisor can only mark within their center
      const invalid = records.find(r => !scope.centerIds.includes(r.centerId));
      if (invalid) {
        throw new AppError("Access denied for one or more centers", 403);
      }
    }

    return prisma.$transaction(
      records.map((record) =>
        prisma.staffAttendanceRecord.upsert({
          where: {
            userId_attendanceDate: {
              userId: record.userId,
              attendanceDate,
            },
          },
          update: {
            status: record.status,
            note: record.note,
            markedById: scope.userId,
          },
          create: {
            organizationId: scope.organizationId,
            centerId: record.centerId,
            userId: record.userId,
            attendanceDate,
            status: record.status,
            note: record.note,
            markedById: scope.userId,
            source: AttendanceSource.MANUAL,
            staffRole: resolveStaffRole(Role.TEACHER), // Fallback, will be updated by trigger or later
          },
        })
      )
    );
  },

  async getSelfAttendance(
    scope: ScopeContext,
    query: { centerId?: number; circleId?: number; month?: number; year?: number }
  ) {
    const circle = await resolveSelfAttendanceTarget(scope, {
      centerId: query.centerId,
      circleId: query.circleId
    });
    const now = new Date();
    const policy = await attendancePolicyService.getPolicy(scope.organizationId);
    const timezone = policy.timezone ?? "Asia/Riyadh";
    const todayUtc = getAttendanceDateForTimeZone(now, timezone);
    const currentMonthYear = getMonthYearForTimeZone(now, timezone);
    
    const month = query.month ?? currentMonthYear.month;
    const year = query.year ?? currentMonthYear.year;
    const range = getMonthRange(month, year);

    const [todayRecord, monthlyRecords, monthlyExcuses, monthlyLeaves, activeCirclesRaw, effectiveShift] =
      await Promise.all([
        prisma.staffAttendanceRecord.findUnique({
          where: {
            userId_attendanceDate: {
              userId: scope.userId,
              attendanceDate: todayUtc
            }
          }
        }),
        prisma.staffAttendanceRecord.findMany({
          where: {
            organizationId: scope.organizationId,
            userId: scope.userId,
            attendanceDate: {
              gte: range.from,
              lte: range.to
            }
          },
          orderBy: [{ attendanceDate: "desc" }]
        }),
        prisma.staffExcuseRequest.findMany({
          where: {
            organizationId: scope.organizationId,
            userId: scope.userId,
            absenceDate: {
              gte: range.from,
              lte: range.to
            },
            status: {
              not: ExcuseRequestStatus.REJECTED
            }
          },
          orderBy: [{ absenceDate: "desc" }]
        }),
        prisma.staffLeaveRequest.findMany({
          where: {
            organizationId: scope.organizationId,
            userId: scope.userId,
            status: {
              in: [LeaveRequestStatus.LEAVE_PENDING, LeaveRequestStatus.LEAVE_APPROVED]
            },
            startDate: { lte: range.to },
            endDate: { gte: range.from }
          },
          orderBy: [{ startDate: "desc" }]
        }),
        effectiveShiftService.getActiveCirclesForDay(scope.userId, now, timezone),
        effectiveShiftService.resolveEffectiveShift(scope.userId, now, circle.centerId, scope.organizationId, timezone)
      ]);

    const activeCircles =
      activeCirclesRaw.length > 0
        ? activeCirclesRaw
        : [{ circleId: circle.id, assignmentId: null, circleName: circle.name }];

    const presentDays = monthlyRecords.filter(
      (record) => record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.LATE
    ).length;
    const onLeaveDays = monthlyRecords.filter((record) => record.status === AttendanceStatus.ON_LEAVE).length;
    const excusedDays = monthlyRecords.filter((record) => record.status === AttendanceStatus.EXCUSED).length;
    const absentDays =
      monthlyRecords.filter(
        (record) => record.status === AttendanceStatus.ABSENT
      ).length +
      monthlyExcuses.filter((excuse) => {
        return !monthlyRecords.some(
          (record) =>
            record.attendanceDate.toISOString().slice(0, 10) ===
            excuse.absenceDate.toISOString().slice(0, 10)
        );
      }).length;

    const totalDays = presentDays + absentDays + onLeaveDays + excusedDays;
    const todayExcuse = monthlyExcuses.find(
      (excuse) => excuse.absenceDate.toISOString().slice(0, 10) === todayUtc.toISOString().slice(0, 10)
    );
    const todayLeave = monthlyLeaves.find((leave) => {
      const todayKey = todayUtc.toISOString().slice(0, 10);
      const startKey = leave.startDate.toISOString().slice(0, 10);
      const endKey = leave.endDate.toISOString().slice(0, 10);
      return leave.status === LeaveRequestStatus.LEAVE_APPROVED && startKey <= todayKey && endKey >= todayKey;
    });

    const todayStatus =
      todayRecord?.status === AttendanceStatus.ON_LEAVE || todayLeave
        ? "on_leave"
        : todayRecord?.checkOutTime != null
          ? "checked_out"
          : todayRecord?.checkInTime != null
            ? "checked_in"
            : todayExcuse
              ? "excuse_requested"
              : "not_checked_in";
    const geoCheck = serializeGeoCheck({ circle });
    const eligibility = buildSelfAttendanceEligibility({
      now,
      attendanceDate: todayUtc,
      todayStatus,
      todayRecord,
      effectiveShift,
      policy,
      geoCheck
    });

    return {
      target: {
        type: scope.role === Role.CENTER_ADMIN ? "CENTER" : "CIRCLE",
        id: circle.id,
        centerId: circle.centerId,
        name: circle.name,
        locationText: circle.locationText,
        latitude: circle.latitude !== null ? Number(circle.latitude) : null,
        longitude: circle.longitude !== null ? Number(circle.longitude) : null,
        allowedRadiusMeters: circle.allowedRadiusMeters,
        timezone
      },
      circle: {
        id: circle.id,
        centerId: circle.centerId,
        name: circle.name,
        locationText: circle.locationText,
        latitude: circle.latitude !== null ? Number(circle.latitude) : null,
        longitude: circle.longitude !== null ? Number(circle.longitude) : null,
        allowedRadiusMeters: circle.allowedRadiusMeters,
        timezone
      },
      activeCircles,
      effectiveShift: effectiveShift
        ? {
            start: effectiveShift.start.toISOString(),
            end: effectiveShift.end.toISOString()
          }
        : null,
      month,
      year,
      policy: {
        gracePeriodMinutes: policy.gracePeriodMinutes,
        earlyDepartureThresholdMinutes: policy.earlyDepartureThresholdMinutes,
        weekendDays: policy.weekendDays,
        holidays: policy.holidays,
        geoEnforcement: policy.geoEnforcement,
        timezone
      },
      eligibility,
      today: {
        date: todayUtc.toISOString().slice(0, 10),
        status: todayStatus,
        attendance: todayRecord ? serializeSelfAttendanceRecord(todayRecord, effectiveShift) : null,
        excuse: todayExcuse
          ? {
              id: todayExcuse.id,
              status: todayExcuse.status,
              reason: todayExcuse.reason,
              responseNote: todayExcuse.responseNote
            }
          : null,
        geoCheck
      },
      stats: {
        totalDays,
        presentDays,
        absentDays,
        onLeaveDays,
        excusedDays
      },
      history: monthlyRecords.map((record) => serializeSelfAttendanceRecord(record)),
      excuses: monthlyExcuses.map((excuse) => ({
        id: excuse.id,
        absenceDate: excuse.absenceDate.toISOString().slice(0, 10),
        status: excuse.status,
        reason: excuse.reason
      }))
    };
  },

  async getTeacherPreparation(
    scope: ScopeContext,
    input: { circleId?: number; month?: number; year?: number }
  ) {
    const now = new Date();
    const month = input.month ?? now.getUTCMonth() + 1;
    const year = input.year ?? now.getUTCFullYear();
    
    // Today's date in UTC (e.g. 2026-04-08 00:00:00.000 Z)
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const circle = await resolveTeacherCircle(scope, input.circleId);
    
    const { from: startObj, to: endObj } = getMonthRange(month, year);

    const [monthlyRecords, monthlyExcuses] = await Promise.all([
      prisma.staffAttendanceRecord.findMany({
        where: {
          userId: scope.userId,
          attendanceDate: {
            gte: startObj,
            lte: endObj
          }
        },
        orderBy: { attendanceDate: "asc" }
      }),
      prisma.staffExcuseRequest.findMany({
        where: {
          userId: scope.userId,
          absenceDate: {
            gte: startObj,
            lte: endObj
          }
        },
        orderBy: { absenceDate: "asc" }
      })
    ]);

    const presentDays = monthlyRecords.filter((r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE).length;
    const absentDays = monthlyRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const excusedDays = monthlyRecords.filter((r) => r.status === AttendanceStatus.EXCUSED).length;
    const onLeaveDays = monthlyRecords.filter((r) => r.status === AttendanceStatus.ON_LEAVE).length;

    const todayRecord = await prisma.staffAttendanceRecord.findUnique({
      where: {
        userId_attendanceDate: {
          userId: scope.userId,
          attendanceDate: todayUtc
        }
      }
    });

    const todayExcuse = monthlyExcuses.find(
      (excuse) => excuse.absenceDate.toISOString().slice(0, 10) === todayUtc.toISOString().slice(0, 10)
    );

    return {
      month,
      year,
      circle: {
        id: circle.id,
        centerId: circle.centerId,
        name: circle.name,
        locationText: circle.locationText,
        latitude: circle.latitude ? Number(circle.latitude) : null,
        longitude: circle.longitude ? Number(circle.longitude) : null,
        allowedRadiusMeters: circle.allowedRadiusMeters
      },
      today: {
        date: todayUtc.toISOString().slice(0, 10),
        status:
          todayRecord?.checkOutTime != null
            ? "checked_out"
            : todayRecord?.checkInTime != null
              ? "checked_in"
              : todayExcuse
                ? "excuse_requested"
                : "not_checked_in",
        attendance: todayRecord ? serializeSelfAttendanceRecord(todayRecord) : null,
        excuse: todayExcuse
          ? {
              id: todayExcuse.id,
              status: todayExcuse.status,
              reason: todayExcuse.reason,
              responseNote: todayExcuse.responseNote
            }
          : null,
        geoCheck: serializeGeoCheck({ circle })
      },
      stats: {
        totalDays: presentDays + absentDays + excusedDays + onLeaveDays,
        presentDays,
        absentDays,
        excusedDays,
        onLeaveDays
      },
      history: monthlyRecords.map((record) => serializeSelfAttendanceRecord(record)),
      excuses: monthlyExcuses.map((excuse) => ({
        id: excuse.id,
        absenceDate: excuse.absenceDate.toISOString().slice(0, 10),
        status: excuse.status,
        reason: excuse.reason
      }))
    };
  },


  async checkInSelf(
    scope: ScopeContext,
    input: { centerId?: number; circleId?: number; latitude?: number | null; longitude?: number | null }
  ) {
    const circle = await resolveSelfAttendanceTarget(scope, {
      centerId: input.centerId,
      circleId: input.circleId
    });
    const now = new Date();
    const policy = await attendancePolicyService.getPolicy(scope.organizationId);
    const timezone = policy.timezone ?? "Asia/Riyadh";
    const attendanceDate = getAttendanceDateForTimeZone(now, timezone);

    const [existing, effectiveShift, approvedLeave] = await Promise.all([
      prisma.staffAttendanceRecord.findUnique({
        where: {
          userId_attendanceDate: {
            userId: scope.userId,
            attendanceDate
          }
        }
      }),
      effectiveShiftService.resolveEffectiveShift(
        scope.userId,
        now,
        circle.centerId,
        scope.organizationId,
        timezone
      ),
      prisma.staffLeaveRequest.findFirst({
        where: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          status: LeaveRequestStatus.LEAVE_APPROVED,
          startDate: { lte: attendanceDate },
          endDate: { gte: attendanceDate }
        },
        select: { id: true }
      })
    ]);

    if (existing?.status === AttendanceStatus.ON_LEAVE || approvedLeave) {
      throw new AppError("Cannot check in while ON_LEAVE", 409, undefined, "INVALID_STATE");
    }

    if (existing?.checkOutTime) {
      throw new AppError("Attendance already closed for today", 409, undefined, "INVALID_STATE");
    }

    if (existing?.checkInTime && !existing.checkOutTime) {
      return {
        action: "check_in",
        record: serializeSelfAttendanceRecord(existing, effectiveShift),
        geoCheck: serializeGeoCheck({
          circle,
          latitude: input.latitude,
          longitude: input.longitude
        })
      };
    }

    const workday = getAttendanceWorkdayState(attendanceDate, policy);
    if (!workday.isWorkday) {
      throw new AppError(
        workday.isWeekend
          ? "لا يمكن تسجيل الحضور في يوم عطلة أسبوعية"
          : "لا يمكن تسجيل الحضور في يوم إجازة معتمدة",
        409,
        undefined,
        "ATTENDANCE_NOT_ALLOWED"
      );
    }

    if (!effectiveShift) {
      throw new AppError("لا يوجد دوام محدد لهذا اليوم", 409, undefined, "NO_SHIFT");
    }

    if (now < effectiveShift.start) {
      throw new AppError("لا يمكن تسجيل الحضور قبل بداية وقت الدوام", 409, undefined, "BEFORE_SHIFT_START");
    }

    if (now > effectiveShift.end) {
      throw new AppError("لا يمكن تسجيل الحضور بعد نهاية وقت الدوام", 409, undefined, "AFTER_SHIFT_END");
    }

    const geoCheck = serializeGeoCheck({
      circle,
      latitude: input.latitude,
      longitude: input.longitude
    });

    if (policy.geoEnforcement === "REQUIRED" && geoCheck.isWithinRange !== true) {
      throw new AppError(geoCheck.message, 403, undefined, "GEO_OUT_OF_RANGE");
    }

    const graceMinutes = Math.max(0, policy.gracePeriodMinutes ?? 0);
    const lateMinutesRaw = effectiveShift ? minutesBetween(now, effectiveShift.start) - graceMinutes : 0;
    const lateMinutes = lateMinutesRaw > 0 ? lateMinutesRaw : null;
    const status = lateMinutes !== null ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    const noteParts = [
      existing?.note ?? null,
      geoCheck.state === "outside_range" ? geoCheck.message : null
    ].filter((part): part is string => Boolean(part && part.trim().length > 0));
    const note = noteParts.length > 0 ? noteParts.join(" | ") : null;

    const record = await prisma.staffAttendanceRecord.upsert({
      where: {
        userId_attendanceDate: {
          userId: scope.userId,
          attendanceDate
        }
      },
      update: {
        organizationId: scope.organizationId,
        centerId: circle.centerId,
        status,
        source: AttendanceSource.SELF_CHECK_IN,
        staffRole: resolveStaffRole(scope.role),
        markedById: scope.userId,
        checkInTime: existing?.checkInTime ?? now,
        lateMinutes,
        note
      },
      create: {
        organizationId: scope.organizationId,
        centerId: circle.centerId,
        userId: scope.userId,
        attendanceDate,
        status,
        source: AttendanceSource.SELF_CHECK_IN,
        staffRole: resolveStaffRole(scope.role),
        markedById: scope.userId,
        checkInTime: now,
        lateMinutes,
        note
      }
    });

    return {
      action: "check_in",
      record: serializeSelfAttendanceRecord(record, effectiveShift),
      geoCheck
    };
  },

  async checkOutSelf(
    scope: ScopeContext,
    input: { centerId?: number; circleId?: number; latitude?: number | null; longitude?: number | null }
  ) {
    const circle = await resolveSelfAttendanceTarget(scope, {
      centerId: input.centerId,
      circleId: input.circleId
    });
    const now = new Date();
    const policy = await attendancePolicyService.getPolicy(scope.organizationId);
    const timezone = policy.timezone ?? "Asia/Riyadh";
    const attendanceDate = getAttendanceDateForTimeZone(now, timezone);
    const [existing, effectiveShift, approvedLeave] = await Promise.all([
      prisma.staffAttendanceRecord.findUnique({
        where: {
          userId_attendanceDate: {
            userId: scope.userId,
            attendanceDate
          }
        }
      }),
      effectiveShiftService.resolveEffectiveShift(
        scope.userId,
        now,
        circle.centerId,
        scope.organizationId,
        timezone
      ),
      prisma.staffLeaveRequest.findFirst({
        where: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          status: LeaveRequestStatus.LEAVE_APPROVED,
          startDate: { lte: attendanceDate },
          endDate: { gte: attendanceDate }
        },
        select: { id: true }
      })
    ]);

    if (!existing?.checkInTime) {
      throw new AppError("Check-in is required before check-out", 400, undefined, "INVALID_STATE");
    }

    if (existing.status === AttendanceStatus.ON_LEAVE || approvedLeave) {
      throw new AppError("Cannot check out while ON_LEAVE", 409, undefined, "INVALID_STATE");
    }

    if (existing.checkOutTime) {
      return {
        action: "check_out",
        record: serializeSelfAttendanceRecord(existing, effectiveShift),
        geoCheck: serializeGeoCheck({
          circle,
          latitude: input.latitude,
          longitude: input.longitude
        })
      };
    }

    const workday = getAttendanceWorkdayState(attendanceDate, policy);
    if (!workday.isWorkday) {
      throw new AppError(
        workday.isWeekend
          ? "لا يمكن تسجيل الانصراف في يوم عطلة أسبوعية"
          : "لا يمكن تسجيل الانصراف في يوم إجازة معتمدة",
        409,
        undefined,
        "ATTENDANCE_NOT_ALLOWED"
      );
    }

    if (!effectiveShift) {
      throw new AppError("لا يوجد دوام محدد لهذا اليوم", 409, undefined, "NO_SHIFT");
    }

    const shiftDurationMinutes = minutesBetween(effectiveShift.end, effectiveShift.start);
    const minimumCheckOutAt = new Date(
      effectiveShift.start.getTime() + Math.floor(shiftDurationMinutes / 2) * 60_000
    );

    if (now < minimumCheckOutAt) {
      throw new AppError("لا يمكن تسجيل الانصراف قبل مرور نصف مدة الدوام", 409, undefined, "BEFORE_MINIMUM_CHECKOUT");
    }

    const geoCheck = serializeGeoCheck({
      circle,
      latitude: input.latitude,
      longitude: input.longitude
    });

    if (policy.geoEnforcement === "REQUIRED" && geoCheck.isWithinRange !== true) {
      throw new AppError(geoCheck.message, 403, undefined, "GEO_OUT_OF_RANGE");
    }

    const threshold = Math.max(0, policy.earlyDepartureThresholdMinutes ?? 0);
    let earlyDepartureMinutes: number | null = null;

    if (effectiveShift) {
      const earlyCutoff = new Date(effectiveShift.end.getTime() - threshold * 60_000);
      if (now < earlyCutoff) {
        earlyDepartureMinutes = minutesBetween(effectiveShift.end, now);
      }
    }

    const noteParts = [
      existing.note ?? null,
      geoCheck.state === "outside_range" ? geoCheck.message : null
    ].filter((part): part is string => Boolean(part && part.trim().length > 0));
    const note = noteParts.length > 0 ? noteParts.join(" | ") : null;

    const record = await prisma.staffAttendanceRecord.update({
      where: { id: existing.id },
      data: {
        organizationId: scope.organizationId,
        centerId: circle.centerId,
        source: AttendanceSource.SELF_CHECK_IN,
        staffRole: resolveStaffRole(scope.role),
        markedById: scope.userId,
        checkOutTime: now,
        earlyDepartureMinutes,
        note
      }
    });

    return {
      action: "check_out",
      record: serializeSelfAttendanceRecord(record, effectiveShift),
      geoCheck
    };
  },
  // ==========================================
  // 2. Staff Excuses
  // ==========================================
  async listExcuses(
    scope: ScopeContext,
    query: {
      status?: ExcuseRequestStatus;
      startDate?: string;
      endDate?: string;
      page: number;
      limit: number;
    }
  ) {
    const skip = (query.page - 1) * query.limit;
    let whereClause: Prisma.StaffExcuseRequestWhereInput = {
      organizationId: scope.organizationId,
    };

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.startDate || query.endDate) {
      whereClause.absenceDate = {
        ...(query.startDate ? { gte: toStartOfDay(query.startDate) } : {}),
        ...(query.endDate ? { lte: toEndOfDay(query.endDate) } : {})
      };
    }

    if (scope.role === Role.SUPER_ADMIN) {
      // No filter needed if allAccess
    } else if (scope.role === Role.CENTER_ADMIN) {
      whereClause.centerId = { in: scope.centerIds };
    } else {
      whereClause.userId = scope.userId;
    }

    const [records, total] = await prisma.$transaction([
      prisma.staffExcuseRequest.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, fullName: true, role: true } },
          handledBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.staffExcuseRequest.count({
        where: whereClause,
      })
    ]);

    return {
      records,
      total,
      page: query.page,
      limit: query.limit,
    };
  },

  async requestExcuse(scope: ScopeContext, data: { centerId: number; date: string | Date; reason: string }) {
    if (!scope.allAccess && !scope.centerIds.includes(data.centerId) && scope.role !== Role.TEACHER) {
       throw new AppError("Access denied for this center", 403);
    }

    const absenceDate = typeof data.date === "string" 
      ? toStartOfDay(data.date) 
      : new Date(Date.UTC(data.date.getUTCFullYear(), data.date.getUTCMonth(), data.date.getUTCDate()));

    const existing = await prisma.staffExcuseRequest.findFirst({
      where: {
        organizationId: scope.organizationId,
        userId: scope.userId,
        absenceDate,
        status: {
          not: ExcuseRequestStatus.REJECTED,
        },
      },
    });

    if (existing) {
      throw new AppError("Excuse already submitted for this date", 409);
    }

    return prisma.staffExcuseRequest.create({
      data: {
        organizationId: scope.organizationId,
        centerId: data.centerId,
        userId: scope.userId,
        absenceDate,
        reason: data.reason,
        status: ExcuseRequestStatus.PENDING,
      },
    });
  },

  async updateExcuseStatus(scope: ScopeContext, excuseId: number, status: ExcuseRequestStatus, note?: string) {
    if (scope.role !== Role.CENTER_ADMIN && scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("Access denied: only admins can update excuse status", 403);
    }

    const excuse = await prisma.staffExcuseRequest.findUnique({ where: { id: excuseId } });
    if (!excuse || excuse.organizationId !== scope.organizationId) {
      throw new AppError("Excuse not found", 404);
    }

    if (excuse.status !== ExcuseRequestStatus.PENDING) {
      throw new AppError("Only pending excuses can be updated", 400, undefined, "INVALID_STATE");
    }

    if (status === ExcuseRequestStatus.PENDING) {
      throw new AppError("Excuse status can only be approved or rejected", 400, undefined, "INVALID_STATE");
    }

    if (excuse.userId === scope.userId) {
      throw new AppError("Cannot handle your own excuse", 403);
    }

    if (!scope.allAccess && !scope.centerIds.includes(excuse.centerId)) {
      throw new AppError("Access denied to update excuse in this center", 403);
    }

    return prisma.$transaction(async (tx) => {
      const updatedExcuse = await tx.staffExcuseRequest.update({
        where: { id: excuseId },
        data: {
          status,
          handledById: scope.userId,
          handledAt: new Date(),
          responseNote: note,
        },
      });

      if (status === ExcuseRequestStatus.APPROVED) {
        const user = await tx.user.findUnique({
          where: { id: excuse.userId },
          select: { role: true }
        });

        await tx.staffAttendanceRecord.upsert({
          where: {
            userId_attendanceDate: {
              userId: excuse.userId,
              attendanceDate: excuse.absenceDate,
            },
          },
          update: {
            status: AttendanceStatus.EXCUSED,
            note: `عذر مقبول: ${excuse.reason}`
          },
          create: {
            organizationId: excuse.organizationId,
            centerId: excuse.centerId,
            userId: excuse.userId,
            attendanceDate: excuse.absenceDate,
            status: AttendanceStatus.EXCUSED,
            source: AttendanceSource.SYSTEM,
            markedById: scope.userId,
            staffRole: resolveStaffRole(user?.role ?? Role.TEACHER),
            note: `عذر مقبول: ${excuse.reason}`
          }
        });
      }

      return updatedExcuse;
    });
  },

  async listLeaves(
    scope: ScopeContext,
    query: {
      status?: LeaveRequestStatus;
      startDate?: string;
      endDate?: string;
      page: number;
      limit: number;
    }
  ) {
    const skip = (query.page - 1) * query.limit;
    let whereClause: Prisma.StaffLeaveRequestWhereInput = {
      organizationId: scope.organizationId,
    };

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.startDate || query.endDate) {
      whereClause.startDate = {
        ...(query.startDate ? { gte: toStartOfDay(query.startDate) } : {}),
      };
      whereClause.endDate = {
        ...(query.endDate ? { lte: toEndOfDay(query.endDate) } : {}),
      };
    }

    if (scope.role === Role.SUPER_ADMIN) {
      // No filter needed if allAccess
    } else if (scope.role === Role.CENTER_ADMIN) {
      whereClause.centerId = { in: scope.centerIds };
    } else {
      whereClause.userId = scope.userId;
    }

    const [records, total] = await prisma.$transaction([
      prisma.staffLeaveRequest.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, fullName: true, role: true } },
          handledBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.staffLeaveRequest.count({
        where: whereClause,
      })
    ]);

    return {
      records,
      total,
      page: query.page,
      limit: query.limit,
    };
  },

  async requestLeave(
    scope: ScopeContext,
    data: {
      centerId: number;
      leaveType: LeaveType;
      startDate: string | Date;
      endDate: string | Date;
      reason: string;
    }
  ) {
    if (!scope.allAccess && !scope.centerIds.includes(data.centerId) && scope.role !== Role.TEACHER) {
      throw new AppError("Access denied for this center", 403);
    }

    const startDate = typeof data.startDate === "string" ? toStartOfDay(data.startDate) : data.startDate;
    const endDate = typeof data.endDate === "string" ? toEndOfDay(data.endDate) : data.endDate;

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return prisma.staffLeaveRequest.create({
      data: {
        organizationId: scope.organizationId,
        centerId: data.centerId,
        userId: scope.userId,
        leaveType: data.leaveType,
        startDate,
        endDate,
        totalDays,
        reason: data.reason,
        status: LeaveRequestStatus.LEAVE_PENDING,
      },
    });
  },

  async updateLeaveStatus(scope: ScopeContext, leaveId: number, status: LeaveRequestStatus, note?: string) {
    if (scope.role !== Role.CENTER_ADMIN && scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("Access denied: only admins can update leave status", 403);
    }

    const leave = await prisma.staffLeaveRequest.findUnique({ where: { id: leaveId } });
    if (!leave || leave.organizationId !== scope.organizationId) {
      throw new AppError("Leave request not found", 404);
    }

    if (leave.status !== LeaveRequestStatus.LEAVE_PENDING) {
      throw new AppError("Only pending leave requests can be updated", 400, undefined, "INVALID_STATE");
    }

    if (leave.userId === scope.userId) {
      throw new AppError("Cannot handle your own leave request", 403);
    }

    if (!scope.allAccess && !scope.centerIds.includes(leave.centerId)) {
      throw new AppError("Access denied to update leave request in this center", 403);
    }

    return prisma.$transaction(async (tx) => {
      const updatedLeave = await tx.staffLeaveRequest.update({
        where: { id: leaveId },
        data: {
          status,
          handledById: scope.userId,
          handledAt: new Date(),
          responseNote: note,
        },
      });

      if (status === LeaveRequestStatus.LEAVE_APPROVED) {
        const user = await tx.user.findUnique({
          where: { id: leave.userId },
          select: { role: true }
        });

        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const dates: Date[] = [];
        let current = new Date(start);
        while (current <= end) {
          dates.push(new Date(current));
          current.setUTCDate(current.getUTCDate() + 1);
        }

        for (const date of dates) {
          await tx.staffAttendanceRecord.upsert({
            where: {
              userId_attendanceDate: {
                userId: leave.userId,
                attendanceDate: date,
              },
            },
            update: {
              status: AttendanceStatus.ON_LEAVE,
              note: `إجازة معتمدة: ${leave.reason}`
            },
            create: {
              organizationId: leave.organizationId,
              centerId: leave.centerId,
              userId: leave.userId,
              attendanceDate: date,
              status: AttendanceStatus.ON_LEAVE,
              source: AttendanceSource.SYSTEM,
              markedById: scope.userId,
              staffRole: resolveStaffRole(user?.role ?? Role.TEACHER),
              note: `إجازة معتمدة: ${leave.reason}`
            }
          });
        }
      }

      return updatedLeave;
    });
  },

  // ==========================================
  // 3. Supervisor Visits
  // ==========================================
  async listVisits(
    scope: ScopeContext,
    query: {
      startDate?: string;
      endDate?: string;
      page: number;
      limit: number;
    }
  ) {
    if (scope.role === Role.TEACHER) {
      throw new AppError("Access denied", 403);
    }

    const skip = (query.page - 1) * query.limit;
    let whereClause: Prisma.SupervisorVisitLogWhereInput = {
      organizationId: scope.organizationId
    };

    if (query.startDate || query.endDate) {
      whereClause.startedAt = {
        ...(query.startDate ? { gte: toStartOfDay(query.startDate) } : {}),
        ...(query.endDate ? { lte: toEndOfDay(query.endDate) } : {})
      };
    }

    if (scope.role === Role.SUPERVISOR) {
      whereClause.supervisorId = scope.userId;
    } else if (!scope.allAccess && scope.centerIds.length > 0) {
      whereClause.centerId = { in: scope.centerIds };
    }

    const [records, total] = await prisma.$transaction([
      prisma.supervisorVisitLog.findMany({
        where: whereClause,
        include: {
          supervisor: { select: { id: true, fullName: true } },
          center: { select: { id: true, name: true } },
          circle: { select: { id: true, name: true } }
        },
        orderBy: { startedAt: "desc" },
        skip,
        take: query.limit
      }),
      prisma.supervisorVisitLog.count({
        where: whereClause
      })
    ]);

    const mapped = records.map((record) => {
      const geoState =
        record.endGeoState === "INSIDE" || record.startGeoState === "INSIDE"
          ? "VERIFIED"
          : record.endGeoState === "OUTSIDE" || record.startGeoState === "OUTSIDE"
            ? "OUTSIDE_RANGE"
            : "NOT_SENT";

      return {
        ...record,
        category: "VISIT",
        status: record.endedAt ? "COMPLETED" : "PENDING",
        geoState,
        startGeoState:
          record.startGeoState === "INSIDE"
            ? "VERIFIED"
            : record.startGeoState === "OUTSIDE"
              ? "OUTSIDE_RANGE"
              : "NOT_SENT",
        endGeoState:
          record.endGeoState === "INSIDE"
            ? "VERIFIED"
            : record.endGeoState === "OUTSIDE"
              ? "OUTSIDE_RANGE"
              : "NOT_SENT",
        visitType: record.planItemId ? "PLANNED" : "EMERGENCY",
        targetLabel: record.circle?.name ?? record.center?.name ?? "General Visit",
        content: record.observations ?? "",
        createdAt: record.createdAt ?? record.startedAt,
        checklist: Array.isArray(record.checklist) ? record.checklist : []
      };
    });

    return {
      records: mapped,
      total,
      page: query.page,
      limit: query.limit
    };
  },

  // ==========================================
  // 4. Monthly Report
  // ==========================================
  async getMonthlyReport(scope: ScopeContext, month: number, year: number) {
    const { from: startObj, to: endObj } = getMonthRange(month, year);
    const workDays = await attendancePolicyService.getWorkdaysInMonth(scope.organizationId, month, year);
    const centerFilter =
      !scope.allAccess && scope.centerIds.length > 0
        ? ({ centerId: { in: scope.centerIds } } as const)
        : {};

    const whereClause: Prisma.StaffAttendanceRecordWhereInput = {
      organizationId: scope.organizationId,
      attendanceDate: {
        gte: startObj,
        lte: endObj
      },
      ...centerFilter
    };

    const attendanceRecords = await prisma.staffAttendanceRecord.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      }
    });

    const expectedHoursByRecordId = new Map<number, number>(
      await Promise.all(
        attendanceRecords.map(async (record) => {
          const effectiveShift = await effectiveShiftService.resolveEffectiveShift(
            record.userId,
            new Date(record.attendanceDate),
            record.centerId,
            scope.organizationId
          );
          const expectedHours = effectiveShift
            ? (effectiveShift.end.getTime() - effectiveShift.start.getTime()) / (1000 * 60 * 60)
            : 0;
          return [record.id, expectedHours] as const;
        })
      )
    );

    const reportByStaff = new Map<number, any>();

    attendanceRecords.forEach((r) => {
      if (!reportByStaff.has(r.userId)) {
        reportByStaff.set(r.userId, {
          userId: r.userId,
          fullName: r.user.fullName,
          role: r.user.role,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          onLeaveDays: 0,
          excusedDays: 0,
          workingHours: 0,
          expectedHours: 0,
          visitsCount: 0,
          pendingDeductions: 0
        } as any);
      }

      const stats = reportByStaff.get(r.userId);
      if (r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE) {
        stats.presentDays++;
      } else if (r.status === AttendanceStatus.ABSENT) {
        stats.absentDays++;
      } else if (r.status === AttendanceStatus.EXCUSED) {
        stats.excusedDays++;
      } else if (r.status === AttendanceStatus.ON_LEAVE) {
        stats.onLeaveDays++;
      }

      if (r.status === AttendanceStatus.LATE) {
        stats.lateDays++;
      }

      if (r.checkInTime && r.checkOutTime) {
        const diff = r.checkOutTime.getTime() - r.checkInTime.getTime();
        stats.workingHours += diff / (1000 * 60 * 60);
      }

      stats.expectedHours += expectedHoursByRecordId.get(r.id) ?? 0;
    });

    const supervisors = Array.from(reportByStaff.values()).filter((s: any) => s.role === Role.SUPERVISOR);
    if (supervisors.length > 0) {
      const visits = await prisma.supervisorVisitLog.groupBy({
        by: ["supervisorId"],
        where: {
          organizationId: scope.organizationId,
          ...centerFilter,
          startedAt: {
            gte: startObj,
            lte: endObj
          },
          supervisorId: { in: supervisors.map((s: any) => s.userId) }
        },
        _count: { _all: true }
      });

      visits.forEach((v) => {
        const stats = reportByStaff.get(v.supervisorId);
        if (stats) stats.visitsCount = v._count._all ?? 0;
      });
    }

    const deductionSums = await prisma.financeDeductionEvent.groupBy({
      by: ["userId"],
      where: {
        organizationId: scope.organizationId,
        month,
        year,
        status: DeductionEventStatus.DEDUCTION_PENDING,
        ...centerFilter
      },
      _sum: { calculatedAmountSAR: true }
    });

    deductionSums.forEach((row) => {
      const stats = reportByStaff.get(row.userId);
      if (stats) {
        stats.pendingDeductions = Number(row._sum.calculatedAmountSAR ?? 0);
      }
    });

    return {
      workDays,
      report: Array.from(reportByStaff.values())
    };
  }
};
async function resolveTeacherCircle(scope: ScopeContext, circleId?: number) {
  if (!circleId) {
    const firstCircle = await prisma.circle.findFirst({
      where: { 
        teacherId: scope.userId,
        isActive: true
      },
      select: { id: true, centerId: true, latitude: true, longitude: true, allowedRadiusMeters: true, name: true, locationText: true }
    });

    if (!firstCircle) {
      throw new AppError("لم يتم العثور على حلقات مسندة إليك", 404, undefined, "NOT_FOUND");
    }
    return firstCircle;
  }

  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
    select: { id: true, centerId: true, latitude: true, longitude: true, allowedRadiusMeters: true, name: true, locationText: true }
  });

  if (!circle) {
    throw new AppError("الحلقة المطلوبة غير موجودة", 404, undefined, "NOT_FOUND");
  }

  // If teacher, check ownership. If CenterAdmin+/Supervisor, scope verification is handled by middleware.
  if (scope.role === Role.TEACHER) {
    const isOwner = await prisma.circle.findFirst({
      where: { id: circleId, teacherId: scope.userId }
    });
    if (!isOwner) {
      throw new AppError("ليس لديك صلاحية الوصول لهذه الحلقة", 403, undefined, "FORBIDDEN");
    }
  }

  return circle;
}

async function resolveCenterAdminAttendanceCenter(scope: ScopeContext, centerId?: number) {
  if (scope.role !== Role.CENTER_ADMIN) {
    throw new AppError("Forbidden", 403, undefined, "FORBIDDEN");
  }

  const resolvedCenterId = centerId ?? scope.centerIds[0];
  const directCenterAccess = [
    { centerAdminUserId: scope.userId },
    { userCenterAccesses: { some: { userId: scope.userId } } }
  ];
  const scopedCenterAccess = scope.centerIds.length ? [{ id: { in: scope.centerIds } }] : [];

  const center = await prisma.center.findFirst({
    where: {
      organizationId: scope.organizationId,
      isActive: true,
      ...(resolvedCenterId
        ? {
            id: resolvedCenterId,
            OR: [...directCenterAccess, ...scopedCenterAccess]
          }
        : {
            OR: [...directCenterAccess, ...scopedCenterAccess]
          })
    },
    select: {
      id: true,
      name: true,
      locationText: true,
      latitude: true,
      longitude: true,
      allowedRadiusMeters: true,
      timezone: true
    }
  });

  if (!center) {
    throw new AppError("No assigned center found for attendance", 404, undefined, "NOT_FOUND");
  }

  return {
    id: 0,
    centerId: center.id,
    latitude: center.latitude,
    longitude: center.longitude,
    allowedRadiusMeters: center.allowedRadiusMeters,
    name: center.name,
    locationText: center.locationText ?? center.name,
    timezone: center.timezone
  };
}

async function resolveSelfAttendanceTarget(
  scope: ScopeContext,
  input: { centerId?: number; circleId?: number }
) {
  if (scope.role === Role.CENTER_ADMIN) {
    return resolveCenterAdminAttendanceCenter(scope, input.centerId);
  }

  return resolveTeacherCircle(scope, input.circleId);
}
