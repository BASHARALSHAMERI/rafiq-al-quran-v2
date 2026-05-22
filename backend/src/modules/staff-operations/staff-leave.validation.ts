import { z } from "zod";
import { LeaveType, LeaveRequestStatus } from "@prisma/client";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD");
const positiveId = z.coerce.number().int().positive();

export const submitLeaveRequestSchema = z
  .object({
    centerId: positiveId,
    leaveType: z.nativeEnum(LeaveType),
    startDate: dateStr,
    endDate: dateStr,
    reason: z.string().min(5).max(1000),
    attachmentUrl: z.string().url().max(500).optional().nullable()
  })
  .strict();

export const leaveResponseSchema = z
  .object({
    responseNote: z.string().max(500).optional()
  })
  .strict();

export const listLeaveRequestsQuerySchema = z
  .object({
    centerId: positiveId.optional(),
    userId: positiveId.optional(),
    status: z.nativeEnum(LeaveRequestStatus).optional(),
    startDate: dateStr.optional(),
    endDate: dateStr.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50)
  })
  .strict();
