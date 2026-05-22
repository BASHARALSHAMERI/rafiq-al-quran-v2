import { FollowUpType, RemoteRecitationBookingStatus } from "@prisma/client";
import { z } from "zod";

const isoDateString = z.string().trim().min(1);
const optionalText = z.string().trim().max(500).optional().nullable();

export const remoteRecitationCircleQuerySchema = z
  .object({
    circleId: z.coerce.number().int().positive()
  })
  .strict();

export const remoteRecitationSlotIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive()
  })
  .strict();

export const remoteRecitationBookingIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive()
  })
  .strict();

export const remoteRecitationDeleteSlotQuerySchema = z
  .object({
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const listRemoteRecitationSlotsQuerySchema = z
  .object({
    circleId: z.coerce.number().int().positive().optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20)
  })
  .strict();

export const upsertRemoteRecitationSettingsBodySchema = z
  .object({
    circleId: z.coerce.number().int().positive(),
    isEnabled: z.boolean().optional(),
    slotDurationMinutes: z.coerce.number().int().min(15).max(180).optional(),
    bookingLeadHours: z.coerce.number().int().min(0).max(168).optional(),
    cancellationWindowHours: z.coerce.number().int().min(0).max(168).optional(),
    maxAdvanceDays: z.coerce.number().int().min(1).max(90).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 1, {
    message: "At least one settings field is required"
  });

export const createRemoteRecitationSlotBodySchema = z
  .object({
    circleId: z.coerce.number().int().positive(),
    startsAt: isoDateString,
    endsAt: isoDateString,
    joinUrl: z.string().trim().min(1).max(500),
    note: optionalText
  })
  .strict();

export const updateRemoteRecitationSlotBodySchema = z
  .object({
    startsAt: isoDateString.optional(),
    endsAt: isoDateString.optional(),
    joinUrl: z.string().trim().min(1).max(500).optional(),
    note: optionalText,
    isActive: z.boolean().optional(),
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one slot field is required"
  });

export const listRemoteRecitationBookingsQuerySchema = z
  .object({
    circleId: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(RemoteRecitationBookingStatus).optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20)
  })
  .strict();

export const createRemoteRecitationBookingBodySchema = z
  .object({
    slotId: z.coerce.number().int().positive()
  })
  .strict();

export const remoteRecitationBookingDecisionBodySchema = z
  .object({
    note: optionalText,
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const remoteRecitationBookingCancelBodySchema = z
  .object({
    reason: optionalText,
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const completeRemoteRecitationBookingBodySchema = z
  .object({
    type: z.nativeEnum(FollowUpType),
    recordDate: z.string().trim().optional(),
    surah: z.string().trim().max(120).optional().nullable(),
    fromSurah: z.coerce.number().int().min(1).max(114).optional().nullable(),
    fromAyah: z.coerce.number().int().positive().optional().nullable(),
    toSurah: z.coerce.number().int().min(1).max(114).optional().nullable(),
    toAyah: z.coerce.number().int().positive().optional().nullable(),
    rating: z.coerce.number().int().min(1).max(100).optional().nullable(),
    matnId: z.coerce.number().int().positive().optional().nullable(),
    matnName: z.string().trim().max(120).optional().nullable(),
    matnStatus: z.string().trim().max(50).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict();
