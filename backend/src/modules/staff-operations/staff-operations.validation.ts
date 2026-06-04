import { AttendanceStatus, ExcuseRequestStatus, LeaveType, LeaveRequestStatus } from "@prisma/client";
import { z } from "zod";

const positiveId = z.coerce.number().int().positive();
const todayDateStr = () => new Date().toISOString().slice(0, 10);
const latitudeSchema = z.coerce.number().min(-90).max(90);
const longitudeSchema = z.coerce.number().min(-180).max(180);

const isValidCalendarDate = (value: string) => {
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
};

const dateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة التاريخ غير صحيحة (YYYY-MM-DD)")
  .refine((value) => isValidCalendarDate(value), "التاريخ يجب أن يكون صحيحاً")
  .refine((value) => value <= todayDateStr(), "التاريخ يجب أن يكون صحيحاً وليس في المستقبل");

const flexibleDateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة التاريخ غير صحيحة (YYYY-MM-DD)")
  .refine((value) => isValidCalendarDate(value), "التاريخ يجب أن يكون صحيحاً");

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50)
});

// ==========================================
// Attendance Schemas
// ==========================================
export const staffAttendanceRecordSchema = z
  .object({
    userId: positiveId,
    centerId: positiveId,
    status: z.nativeEnum(AttendanceStatus),
    note: z.string().max(500).optional().nullable()
  })
  .strict();

export const markStaffAttendanceBodySchema = z
  .object({
    date: dateStr,
    records: z.array(staffAttendanceRecordSchema).min(1).max(500)
  })
  .strict();

export const listAttendanceQuerySchema = z
  .object({
    date: dateStr.optional(),
    page: paginationQuerySchema.shape.page,
    limit: paginationQuerySchema.shape.limit
  })
  .strict();

export const selfAttendanceQuerySchema = z
  .object({
    centerId: positiveId.optional(),
    circleId: positiveId.optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional()
  })
  .strict();

export const selfAttendanceActionBodySchema = z
  .object({
    centerId: positiveId.optional(),
    circleId: positiveId.optional(),
    latitude: latitudeSchema.optional().nullable(),
    longitude: longitudeSchema.optional().nullable()
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasLatitude = value.latitude !== undefined && value.latitude !== null;
    const hasLongitude = value.longitude !== undefined && value.longitude !== null;

    if (hasLatitude != hasLongitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasLatitude ? "longitude" : "latitude"],
        message: "خط العرض وخط الطول يجب إدخالهما معاً"
      });
    }
  });

// ==========================================
// Excuses Schemas
// ==========================================
export const listExcusesQuerySchema = z
  .object({
    status: z.nativeEnum(ExcuseRequestStatus).optional(),
    page: paginationQuerySchema.shape.page,
    limit: paginationQuerySchema.shape.limit,
    startDate: dateStr.optional(),
    endDate: dateStr.optional()
  })
  .strict()
  .refine(
    (value) =>
      !value.startDate || !value.endDate || value.startDate <= value.endDate,
    {
      message: "تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية",
      path: ["endDate"]
    }
  );

export const requestExcuseBodySchema = z
  .object({
    centerId: positiveId,
    date: dateStr,
    reason: z.string().trim().min(5).max(1000)
  })
  .strict();

export const updateExcuseStatusBodySchema = z
  .object({
    status: z.nativeEnum(ExcuseRequestStatus),
    note: z.string().trim().max(500).optional().nullable()
  })
  .strict();

export const excuseIdParamSchema = z
  .object({
    id: positiveId
  })
  .strict();

// ==========================================
// Leaves Schemas
// ==========================================
export const listLeavesQuerySchema = z
  .object({
    status: z.nativeEnum(LeaveRequestStatus).optional(),
    page: paginationQuerySchema.shape.page,
    limit: paginationQuerySchema.shape.limit,
    startDate: flexibleDateStr.optional(),
    endDate: flexibleDateStr.optional()
  })
  .strict();

export const requestLeaveBodySchema = z
  .object({
    centerId: positiveId,
    leaveType: z.nativeEnum(LeaveType),
    startDate: flexibleDateStr,
    endDate: flexibleDateStr,
    reason: z.string().trim().min(5).max(1000)
  })
  .strict()
  .refine(
    (value) => value.startDate <= value.endDate,
    {
      message: "تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية",
      path: ["endDate"]
    }
  );

export const updateLeaveStatusBodySchema = z
  .object({
    status: z.nativeEnum(LeaveRequestStatus),
    note: z.string().trim().max(500).optional().nullable()
  })
  .strict();

export const leaveIdParamSchema = z
  .object({
    id: positiveId
  })
  .strict();

// ==========================================
// Supervisor Visits Schemas
// ==========================================
export const listVisitsQuerySchema = z
  .object({
    page: paginationQuerySchema.shape.page,
    limit: paginationQuerySchema.shape.limit,
    startDate: dateStr.optional(),
    endDate: dateStr.optional()
  })
  .strict()
  .refine(
    (value) =>
      !value.startDate || !value.endDate || value.startDate <= value.endDate,
    {
      message: "تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية",
      path: ["endDate"]
    }
  );

// ==========================================
// Monthly Report Schemas
// ==========================================
export const monthlyReportQuerySchema = z
  .object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100)
  })
  .strict();

// ==========================================
// Prayer Times Schemas
// ==========================================
export const prayerTimesQuerySchema = z
  .object({
    date: flexibleDateStr.optional()
  })
  .strict();

export const centerIdParamSchema = z
  .object({
    centerId: positiveId
  })
  .strict();

// ==========================================
// DTO Types inferred from Zod Schemas
// ==========================================
export type StaffAttendanceRecordDto = z.infer<typeof staffAttendanceRecordSchema>;
export type MarkStaffAttendanceDto = z.infer<typeof markStaffAttendanceBodySchema>;
export type ListAttendanceQueryDto = z.infer<typeof listAttendanceQuerySchema>;
export type SelfAttendanceQueryDto = z.infer<typeof selfAttendanceQuerySchema>;
export type SelfAttendanceActionDto = z.infer<typeof selfAttendanceActionBodySchema>;
export type ListExcusesQueryDto = z.infer<typeof listExcusesQuerySchema>;
export type RequestExcuseDto = z.infer<typeof requestExcuseBodySchema>;
export type UpdateExcuseStatusDto = z.infer<typeof updateExcuseStatusBodySchema>;
export type ListVisitsQueryDto = z.infer<typeof listVisitsQuerySchema>;
export type MonthlyReportQueryDto = z.infer<typeof monthlyReportQuerySchema>;
export type ListLeavesQueryDto = z.infer<typeof listLeavesQuerySchema>;
export type RequestLeaveDto = z.infer<typeof requestLeaveBodySchema>;
export type UpdateLeaveStatusDto = z.infer<typeof updateLeaveStatusBodySchema>;
export type PrayerTimesQueryDto = z.infer<typeof prayerTimesQuerySchema>;
export type CenterIdParamDto = z.infer<typeof centerIdParamSchema>;
