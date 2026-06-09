import { ExamStatus, InvoiceStatus, ReportFileKind, ReportType, Role } from "@prisma/client";
import { z } from "zod";

const optionalId = z.coerce.number().int().positive().optional();

const baseDateRangeSchema = z
  .object({
    from: z.string().trim().min(1),
    to: z.string().trim().min(1),
    centerId: optionalId,
    circleId: optionalId
  })
  .strict();

export const reportExportIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive()
  })
  .strict();

export const studentReportIdParamSchema = reportExportIdParamSchema;
export const studentMonthlyExportParamSchema = reportExportIdParamSchema;

export const supervisorDashboardQuerySchema = baseDateRangeSchema;
export const teacherMonthlyHalqaQuerySchema = z
  .object({
    circleId: optionalId,
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional()
  })
  .strict();

export const studentMonthlyReportQuerySchema = z
  .object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional()
  })
  .strict();

export const attendanceReportQuerySchema = baseDateRangeSchema;

export const followUpReportQuerySchema = baseDateRangeSchema
  .extend({
    actorRole: z.nativeEnum(Role).optional()
  })
  .strict();

export const examsReportQuerySchema = baseDateRangeSchema
  .extend({
    examStatus: z.nativeEnum(ExamStatus).optional()
  })
  .strict();

export const financeReportQuerySchema = z
  .object({
    from: z.string().trim().min(1),
    to: z.string().trim().min(1),
    centerId: optionalId,
    status: z.nativeEnum(InvoiceStatus).optional()
  })
  .strict();

export const exportReportBodySchema = z
  .object({
    reportType: z.nativeEnum(ReportType),
    format: z.nativeEnum(ReportFileKind),
    filters: z
      .object({
        from: z.string().trim().min(1),
        to: z.string().trim().min(1),
        centerId: optionalId,
        circleId: optionalId,
        actorRole: z.nativeEnum(Role).optional(),
        examStatus: z.nativeEnum(ExamStatus).optional(),
        status: z.nativeEnum(InvoiceStatus).optional(),
        search: z.string().trim().max(120).optional()
      })
      .strict()
  })
  .strict();

export const teacherMonthlyExportBodySchema = z
  .object({
    circleId: optionalId,
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    format: z.nativeEnum(ReportFileKind)
  })
  .strict();

export const studentMonthlyExportBodySchema = z
  .object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    format: z.nativeEnum(ReportFileKind)
  })
  .strict();

export const summaryCenterQuerySchema = z
  .object({
    centerId: optionalId
  })
  .strict();

export const summaryCenterCircleQuerySchema = z
  .object({
    centerId: optionalId,
    circleId: optionalId,
    activeOnly: z.coerce.boolean().optional()
  })
  .strict();
