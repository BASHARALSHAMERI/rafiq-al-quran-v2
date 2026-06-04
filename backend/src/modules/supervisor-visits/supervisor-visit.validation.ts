import { z } from "zod";
import { VisitPlanStatus, VisitPriority } from "@prisma/client";

const positiveId = z.coerce.number().int().positive();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة التاريخ غير صحيحة، الصيغة المطلوبة: YYYY-MM-DD");

const visitPlanStatusInputSchema = z.enum([
  VisitPlanStatus.VISIT_PLAN_DRAFT,
  VisitPlanStatus.VISIT_PLAN_ACTIVE,
  VisitPlanStatus.VISIT_PLAN_COMPLETED,
  "DRAFT",
  "ACTIVE",
  "COMPLETED"
]);

export const createPlanSchema = z
  .object({
    supervisorId: positiveId,
    centerId: positiveId,
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020).max(2100)
  })
  .strict();

export const updatePlanStatusSchema = z
  .object({
    status: visitPlanStatusInputSchema
  })
  .strict();

export const listPlansQuerySchema = z
  .object({
    supervisorId: positiveId.optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    status: visitPlanStatusInputSchema.optional()
  })
  .strict();

export const addPlanItemSchema = z
  .object({
    centerId: positiveId,
    circleId: positiveId.optional(),
    plannedDate: dateStr,
    plannedTimeWindow: z.string().max(20).optional(),
    priority: z.nativeEnum(VisitPriority).optional(),
    notes: z.string().max(500).optional()
  })
  .strict();

export const updatePlanItemSchema = z
  .object({
    centerId: positiveId.optional(),
    circleId: positiveId.optional().nullable(),
    plannedDate: dateStr.optional(),
    plannedTimeWindow: z.string().max(20).optional(),
    priority: z.nativeEnum(VisitPriority).optional(),
    notes: z.string().max(500).optional()
  })
  .strict();

export const startVisitSchema = z
  .object({
    centerId: positiveId,
    circleId: positiveId.optional(),
    planItemId: positiveId.optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional()
  })
  .strict();

export const endVisitSchema = z
  .object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    checklist: z.union([z.record(z.string(), z.any()), z.array(z.any())]).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    observations: z.string().optional()
  })
  .strict();

export const listVisitLogsQuerySchema = z
  .object({
    supervisorId: positiveId.optional(),
    startDate: dateStr.optional(),
    endDate: dateStr.optional()
  })
  .strict();
