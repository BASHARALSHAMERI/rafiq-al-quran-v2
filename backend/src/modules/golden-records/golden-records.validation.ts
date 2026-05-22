import {
  GoldenRecordType,
  GraduationCandidateStatus,
  RiwayaType
} from "@prisma/client";
import { z } from "zod";

const positiveId = z.coerce.number().int().positive();
const yearSchema = z.coerce.number().int().min(2000).max(2100);
const dateStringSchema = z.string().trim().min(1);
const optionalTrimmedString = (max: number) => z.string().trim().max(max).optional().nullable();

export const goldenRecordIdParamSchema = z
  .object({
    id: positiveId
  })
  .strict();

export const listCandidatesQuerySchema = z
  .object({
    centerId: positiveId.optional(),
    circleId: positiveId.optional(),
    search: z.string().trim().min(1).max(120).optional(),
    year: yearSchema.optional(),
    status: z
      .enum([
        GraduationCandidateStatus.NOMINATED,
        GraduationCandidateStatus.APPROVED,
        GraduationCandidateStatus.REJECTED,
        GraduationCandidateStatus.DEFERRED
      ])
      .optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(10)
  })
  .strict();

export const createCandidateBodySchema = z
  .object({
    studentId: positiveId,
    memorizationCompletionDate: dateStringSchema,
    khatmaTestDate: dateStringSchema,
    notes: optionalTrimmedString(1000)
  })
  .strict();

export const updateCandidateBodySchema = z
  .object({
    memorizationCompletionDate: dateStringSchema.optional(),
    khatmaTestDate: dateStringSchema.optional(),
    notes: optionalTrimmedString(1000),
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const candidateApproveBodySchema = z
  .object({
    statusNote: optionalTrimmedString(1000),
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const candidateDecisionBodySchema = z
  .object({
    statusNote: z.string().trim().min(3).max(1000),
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const candidateExamAttemptLinkBodySchema = z
  .object({
    examAttemptId: positiveId,
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const listGoldenRecordsQuerySchema = z
  .object({
    centerId: positiveId.optional(),
    circleId: positiveId.optional(),
    search: z.string().trim().min(1).max(120).optional(),
    year: yearSchema.optional(),
    type: z.nativeEnum(GoldenRecordType).optional(),
    riwaya: z.nativeEnum(RiwayaType).optional(),
    status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(10)
  })
  .strict();

export const createGoldenRecordBodySchema = z
  .object({
    candidateId: positiveId.optional(),
    studentId: positiveId,
    centerId: positiveId,
    type: z.nativeEnum(GoldenRecordType),
    riwaya: z.nativeEnum(RiwayaType).optional().nullable(),
    grade: z.string().trim().min(1).max(40).optional(),
    average: z.coerce.number().min(0).max(100).optional(),
    appreciation: z.string().trim().min(1).max(60).optional(),
    examDate: dateStringSchema.optional(),
    notes: optionalTrimmedString(1000)
  })
  .strict();

export const updateGoldenRecordBodySchema = z
  .object({
    examId: positiveId.optional().nullable(),
    examAttemptId: positiveId.optional().nullable(),
    circleId: positiveId.optional().nullable(),
    type: z.nativeEnum(GoldenRecordType).optional(),
    riwaya: z.nativeEnum(RiwayaType).optional().nullable(),
    grade: z.string().trim().min(1).max(40).optional(),
    average: z.coerce.number().min(0).max(100).optional(),
    appreciation: z.string().trim().min(1).max(60).optional(),
    examDate: dateStringSchema.optional(),
    notes: optionalTrimmedString(1000),
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const submitGoldenRecordBodySchema = z
  .object({
    statusNote: optionalTrimmedString(1000),
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const rejectGoldenRecordBodySchema = z
  .object({
    statusNote: z.string().trim().min(3).max(1000),
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const listGoldenRecordStatsQuerySchema = z
  .object({
    centerId: positiveId.optional(),
    year: yearSchema.optional()
  })
  .strict();
