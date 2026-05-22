import { z } from "zod";
import { StaffRoleType, Weekday, CircleScheduleMode, PrayerName, GeoEnforcement } from "@prisma/client";

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
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fromTime"], message: "fromTime is required for CLOCK mode" });
      }
    }
    if (slot.mode === "PRAYER") {
      if (!slot.fromPrayer) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fromPrayer"], message: "fromPrayer is required for PRAYER mode" });
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
    slots: z.array(slotSchema).min(1).max(7)
  })
  .superRefine((value, ctx) => {
    if (value.staffRole === StaffRoleType.TEACHER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["staffRole"],
        message: "Teacher schedules must be managed from the circle schedule."
      });
    }
  })
  .strict();

export const updateAssignmentSchema = z
  .object({
    effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    slots: z.array(slotSchema).min(1).max(7).optional()
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
    message: "endDate must be on or after startDate",
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
    timezone: z.string().max(50).optional()
  })
  .strict();

// ==========================================
// Inferred Types
// ==========================================
export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentDto = z.infer<typeof updateAssignmentSchema>;
export type ListAssignmentsQueryDto = z.infer<typeof listAssignmentsQuerySchema>;
export type UpdatePolicyDto = z.infer<typeof updatePolicySchema>;
