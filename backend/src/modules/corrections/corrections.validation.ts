import { CorrectionRequestStatus, CorrectionTargetType } from "@prisma/client";
import { z } from "zod";

const positiveId = z.coerce.number().int().positive();

export const correctionRequestIdParamSchema = z
  .object({
    id: positiveId
  })
  .strict();

export const listCorrectionsQuerySchema = z
  .object({
    status: z.nativeEnum(CorrectionRequestStatus).optional(),
    targetType: z.nativeEnum(CorrectionTargetType).optional(),
    centerId: positiveId.optional(),
    circleId: positiveId.optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20)
  })
  .strict();

export const createCorrectionBodySchema = z
  .object({
    targetType: z.nativeEnum(CorrectionTargetType),
    targetId: positiveId,
    reason: z.string().trim().min(3).max(4000),
    proposedChanges: z.record(z.string(), z.unknown())
  })
  .strict();

export const approveCorrectionBodySchema = z
  .object({
    applyChanges: z.boolean().default(true),
    reviewNote: z.string().trim().max(500).optional()
  })
  .strict();

export const rejectCorrectionBodySchema = z
  .object({
    reviewNote: z.string().trim().min(3).max(500)
  })
  .strict();
