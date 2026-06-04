import { FollowUpRecordStatus, FollowUpType } from "@prisma/client";
import { z } from "zod";

export const followUpIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive()
  })
  .strict();

export const listFollowUpsQuerySchema = z
  .object({
    centerId: z.coerce.number().int().positive().optional(),
    circleId: z.coerce.number().int().positive().optional(),
    studentId: z.coerce.number().int().positive().optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
    status: z.nativeEnum(FollowUpRecordStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20)
  })
  .strict();

export const createFollowUpBodySchema = z
  .object({
    studentId: z.coerce.number().int().positive(),
    circleId: z.coerce.number().int().positive(),
    recordDate: z.string().trim().min(1),
    type: z.nativeEnum(FollowUpType),
    status: z.nativeEnum(FollowUpRecordStatus).optional(),
    surah: z.string().trim().max(120).optional().nullable(),
    fromSurah: z.coerce.number().int().min(1).max(114).optional().nullable(),
    fromAyah: z.coerce.number().int().positive().optional().nullable(),
    toSurah: z.coerce.number().int().min(1).max(114).optional().nullable(),
    toAyah: z.coerce.number().int().positive().optional().nullable(),
    pagesCount: z.coerce.number().positive().max(30).optional().nullable(),
    rating: z.coerce.number().int().min(1).max(100).optional().nullable(),
    matnId: z.coerce.number().int().positive().optional().nullable(),
    matnName: z.string().trim().max(120).optional().nullable(),
    matnStatus: z.string().trim().max(50).optional().nullable(),
    matnFromRef: z.string().trim().max(80).optional().nullable(),
    matnToRef: z.string().trim().max(80).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable()
  })
  .strict();

export const updateFollowUpBodySchema = z
  .object({
    recordDate: z.string().trim().min(1).optional(),
    type: z.nativeEnum(FollowUpType).optional(),
    surah: z.string().trim().max(120).optional().nullable(),
    fromSurah: z.coerce.number().int().min(1).max(114).optional().nullable(),
    fromAyah: z.coerce.number().int().positive().optional().nullable(),
    toSurah: z.coerce.number().int().min(1).max(114).optional().nullable(),
    toAyah: z.coerce.number().int().positive().optional().nullable(),
    pagesCount: z.coerce.number().positive().max(30).optional().nullable(),
    rating: z.coerce.number().int().min(1).max(100).optional().nullable(),
    matnId: z.coerce.number().int().positive().optional().nullable(),
    matnName: z.string().trim().max(120).optional().nullable(),
    matnStatus: z.string().trim().max(50).optional().nullable(),
    matnFromRef: z.string().trim().max(80).optional().nullable(),
    matnToRef: z.string().trim().max(80).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حقل واحد على الأقل مطلوب"
  });
