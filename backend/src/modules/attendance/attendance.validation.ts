import { AttendanceStatus } from "@prisma/client";
import { z } from "zod";

export const attendanceQuerySchema = z
  .object({
    circleId: z.coerce.number().int().positive(),
    date: z.string().trim().min(1)
  })
  .strict();

const attendanceRecordSchema = z
  .object({
    studentId: z.coerce.number().int().positive(),
    status: z.nativeEnum(AttendanceStatus),
    note: z.string().trim().max(500).optional().nullable(),
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const attendanceBulkBodySchema = z
  .object({
    circleId: z.coerce.number().int().positive(),
    date: z.string().trim().min(1),
    records: z.array(attendanceRecordSchema).min(1).max(500)
  })
  .strict();

// ==========================================
// DTO Types inferred from Zod Schemas
// ==========================================
export type AttendanceQueryDto = z.infer<typeof attendanceQuerySchema>;
export type AttendanceRecordDto = z.infer<typeof attendanceRecordSchema>;
export type AttendanceBulkBodyDto = z.infer<typeof attendanceBulkBodySchema>;
