import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { buildAttachmentContentDisposition } from "../../shared/utils/files";
import { reportsService } from "./reports.service";

export const reportsController = {
  catalog: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const data = await reportsService.catalog(req.scope);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  attendance: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as import("./reports.domain").ReportFilterInput;
      const data = await reportsService.attendance(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  supervisorDashboard: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as import("./reports.domain").ReportFilterInput;
      const data = await reportsService.supervisorDashboard(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  teacherMonthlyHalqa: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as {
        circleId?: number;
        month?: number;
        year?: number;
      };
      const data = await reportsService.teacherMonthlyHalqa(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  followUp: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as import("./reports.domain").ReportFilterInput;
      const data = await reportsService.followUp(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  exams: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as import("./reports.domain").ReportFilterInput;
      const data = await reportsService.exams(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  finance: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as import("./reports.domain").ReportFilterInput;
      const data = await reportsService.finance(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  student: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const query = res.locals.validatedQuery as { month?: number; year?: number };
      const data = await reportsService.student(req.scope, params.id, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  export: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const result = await reportsService.export(req.scope, req.body);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  exportTeacherMonthlyHalqa: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const body = res.locals.validatedBody as {
        circleId?: number;
        month?: number;
        year?: number;
        format: import("@prisma/client").ReportFileKind;
      };
      const result = await reportsService.exportTeacherMonthlyHalqa(req.scope, body);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  exportStudentMonthly: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const body = res.locals.validatedBody as {
        month?: number;
        year?: number;
        format: import("@prisma/client").ReportFileKind;
      };
      const result = await reportsService.exportStudentMonthly(req.scope, params.id, body);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,


  /** REPORTS-1: Centers summary */
  centersSummary: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const data = await reportsService.centersSummary(req.scope);
      res.json({ ok: true, data });
    } catch (error) { next(error); }
  }) as RequestHandler,

  /** REPORTS-1: Circles summary */
  circlesSummary: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = req.query as { centerId?: string };
      const data = await reportsService.circlesSummary(req.scope, {
        centerId: query.centerId ? Number(query.centerId) : undefined
      });
      res.json({ ok: true, data });
    } catch (error) { next(error); }
  }) as RequestHandler,

  /** REPORTS-1: Students summary */
  studentsSummary: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = req.query as { centerId?: string; circleId?: string; activeOnly?: string };
      const data = await reportsService.studentsSummary(req.scope, {
        centerId: query.centerId ? Number(query.centerId) : undefined,
        circleId: query.circleId ? Number(query.circleId) : undefined,
        activeOnly: query.activeOnly === "true" ? true : query.activeOnly === "false" ? false : undefined
      });
      res.json({ ok: true, data });
    } catch (error) { next(error); }
  }) as RequestHandler,

  /** REPORTS-1: Golden Records summary */
  goldenRecordsSummary: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = req.query as { centerId?: string };
      const data = await reportsService.goldenRecordsSummary(req.scope, {
        centerId: query.centerId ? Number(query.centerId) : undefined
      });
      res.json({ ok: true, data });
    } catch (error) { next(error); }
  }) as RequestHandler,

  download: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const { file, absolutePath } = await reportsService.getDownloadableExport(req.scope, params.id);

      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Disposition", buildAttachmentContentDisposition(file.name));
      res.sendFile(absolutePath);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};

