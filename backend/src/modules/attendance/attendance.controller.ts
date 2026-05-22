import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { attendanceService } from "./attendance.service";

export const attendanceController = {
  listForDate: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as {
        circleId: number;
        date: string;
      };

      const data = await attendanceService.listForDate(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getCircleStudents: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as {
        circleId: number;
        date: string;
      };

      const data = await attendanceService.getCircleStudentsWithAttendance(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  submitBulk: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const payload = req.body as {
        circleId: number;
        date: string;
        records: Array<{
          studentId: number;
          status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
          note?: string | null;
          lockVersion?: number;
        }>;
      };

      const data = await attendanceService.submitBulk(req.scope, payload);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
