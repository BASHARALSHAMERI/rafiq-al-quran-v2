import { z } from "zod";
import { StaffRoleType, Weekday, CircleScheduleMode, PrayerName, GeoEnforcement, TimeFormat } from "@prisma/client";

/**
 * Phase 3 — Staff Schedule Zod Validation Schemas
 */

const positiveId = z.coerce.number().int().positive();

const slotSchema = z
  .object({
    dayOfWeek: z.nativeEnum(Weekday),
    mode: z.nativeEnum(CircleScheduleMode),
    fromTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    toTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    fromPrayer: z.nativeEnum(PrayerName).optional().nullable(),
    toPrayer: z.nativeEnum(PrayerName).optional().nullable(),
    fromPrayerOffsetMinutes: z.coerce.number().int().min(-120).max(120).optional().nullable(),
    toPrayerOffsetMinutes: z.coerce.number().int().min(-120).max(120).optional().nullable(),
    defaultDurationMinutes: z.coerce.number().int().min(15).max(480).optional().nullable()
  })
  .superRefine((slot, ctx) => {
    if (slot.mode === "CLOCK") {
      if (!slot.fromTime) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fromTime"], message: "وقت البداية مطلوب لنظام الساعة" });
      }
    }
    if (slot.mode === "PRAYER") {
      if (!slot.fromPrayer) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fromPrayer"], message: "وقت الأذان مطلوب لنظام الصلاة" });
      }
    }
  });

export const createAssignmentSchema = z
  .object({
    userId: positiveId,
    staffRole: z.nativeEnum(StaffRoleType),
    centerId: positiveId,
    circleId: positiveId.optional().nullable(),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
    longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
    allowedRadiusMeters: z.coerce.number().int().positive().optional().nullable(),
    locationText: z.string().max(255).optional().nullable(),
    slots: z.array(slotSchema).min(1).max(7)
  })
  .superRefine((value, ctx) => {
    if (value.staffRole === StaffRoleType.SUPERVISOR) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["staffRole"],
        message: "جداول المشرفين لا تُدار من هنا"
      });
    }
    const hasLat = value.latitude !== undefined && value.latitude !== null;
    const hasLng = value.longitude !== undefined && value.longitude !== null;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasLat ? "longitude" : "latitude"],
        message: "خط العرض وخط الطول يجب إدخالهما معاً"
      });
    }
  })
  .strict();

export const updateAssignmentSchema = z
  .object({
    effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
    longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
    allowedRadiusMeters: z.coerce.number().int().positive().optional().nullable(),
    locationText: z.string().max(255).optional().nullable(),
    slots: z.array(slotSchema).min(1).max(7).optional()
  })
  .superRefine((value, ctx) => {
    const hasLat = value.latitude !== undefined && value.latitude !== null;
    const hasLng = value.longitude !== undefined && value.longitude !== null;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasLat ? "longitude" : "latitude"],
        message: "خط العرض وخط الطول يجب إدخالهما معاً"
      });
    }
  })
  .strict();

export const listAssignmentsQuerySchema = z
  .object({
    centerId: positiveId.optional(),
    staffRole: z.nativeEnum(StaffRoleType).optional(),
    isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
    userId: positiveId.optional()
  })
  .strict();

export const assignmentIdParamSchema = z
  .object({
    id: positiveId
  })
  .strict();

// ==========================================
// Attendance Policy Schemas
// ==========================================

const holidayPeriodSchema = z
  .object({
    reason: z.string().trim().min(1).max(160),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية",
    path: ["endDate"]
  });

export const updatePolicySchema = z
  .object({
    gracePeriodMinutes: z.coerce.number().int().min(0).max(60).optional(),
    autoAbsenceDelayMinutes: z.coerce.number().int().min(0).max(180).optional(),
    weekendDays: z.array(z.nativeEnum(Weekday)).optional(),
    holidays: z.array(z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), holidayPeriodSchema])).optional(),
    geoEnforcement: z
      .union([z.nativeEnum(GeoEnforcement), z.enum(["REQUIRED", "OPTIONAL"])])
      .optional(),
    defaultShiftDurationMinutes: z.coerce.number().int().min(30).max(720).optional(),
    earlyDepartureThresholdMinutes: z.coerce.number().int().min(0).max(60).optional(),
    prayerApiSource: z.string().max(100).optional(),
    timezone: z.string().max(50).optional(),
    timeFormat: z.nativeEnum(TimeFormat).optional()
  })
  .strict();

// ==========================================
// Inferred Types
// ==========================================
export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentDto = z.infer<typeof updateAssignmentSchema>;
export type ListAssignmentsQueryDto = z.infer<typeof listAssignmentsQuerySchema>;
export type UpdatePolicyDto = z.infer<typeof updatePolicySchema>;
