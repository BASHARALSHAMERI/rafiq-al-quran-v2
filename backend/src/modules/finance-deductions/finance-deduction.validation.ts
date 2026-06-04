import { z } from "zod";
import { DeductionTriggerType, DeductionCalcType, DeductionEventStatus } from "@prisma/client";

const positiveId = z.coerce.number().int().positive();

const deductionCalcTypeInputSchema = z.enum([
  DeductionCalcType.FIXED,
  DeductionCalcType.PER_DAY,
  DeductionCalcType.PER_OCCURRENCE
]);

const deductionEventActionSchema = z.enum([
  "APPROVED",
  "REJECTED",
  "WAIVED",
  DeductionEventStatus.DEDUCTION_APPROVED,
  DeductionEventStatus.DEDUCTION_REJECTED,
  DeductionEventStatus.DEDUCTION_WAIVED
]);

const deductionEventStatusQuerySchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "WAIVED",
  DeductionEventStatus.DEDUCTION_PENDING,
  DeductionEventStatus.DEDUCTION_APPROVED,
  DeductionEventStatus.DEDUCTION_REJECTED,
  DeductionEventStatus.DEDUCTION_WAIVED
]);

export const upsertRuleSchema = z
  .object({
    triggerType: z.nativeEnum(DeductionTriggerType),
    thresholdCount: z.number().int().min(1).optional().nullable(),
    deductionAmountSAR: z.number().min(0),
    deductionType: deductionCalcTypeInputSchema,
    isActive: z.boolean().default(true),
    description: z.string().max(500).optional().nullable()
  })
  .strict();

export const generateDeductionsSchema = z
  .object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020).max(2100)
  })
  .strict();

export const reviewEventSchema = z
  .object({
    action: deductionEventActionSchema.optional(),
    status: deductionEventActionSchema.optional(),
    reviewNote: z.string().max(500).optional(),
    note: z.string().max(500).optional()
  })
  .refine((value) => Boolean(value.action || value.status), {
    message: "الإجراء أو الحالة مطلوب",
    path: ["action"]
  })
  .strict();

export const listEventsQuerySchema = z
  .object({
    centerId: positiveId.optional(),
    userId: positiveId.optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    status: deductionEventStatusQuerySchema.optional(),
    triggerType: z.nativeEnum(DeductionTriggerType).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50)
  })
  .strict();
