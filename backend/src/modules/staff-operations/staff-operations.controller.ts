import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { staffOperationsService } from "./staff-operations.service";
import { prayerTimeService } from "./prayer-time.service";
import { attendancePolicyService } from "./attendance-policy.service";

export const staffOperationsController = {
  listAttendance: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as {
        date?: string;
        page: number;
        limit: number;
      };
      const records = await staffOperationsService.listAttendance(req.scope, query);
      res.json({ ok: true, data: records });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  markAttendance: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { records, date } = req.body;
      const result = await staffOperationsService.markAttendance(req.scope, records, date);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getSelfAttendance: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as {
        centerId?: number;
        circleId?: number;
        month?: number;
        year?: number;
      };
      const result = await staffOperationsService.getSelfAttendance(req.scope, query);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  checkInSelf: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody as {
        centerId?: number;
        circleId?: number;
        latitude?: number | null;
        longitude?: number | null;
      };
      const result = await staffOperationsService.checkInSelf(req.scope, body);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      console.error("[StaffOpsCtrl] checkInSelf error:", error);
      next(error);
    }
  }) as RequestHandler,

  checkOutSelf: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody as {
        centerId?: number;
        circleId?: number;
        latitude?: number | null;
        longitude?: number | null;
      };
      const result = await staffOperationsService.checkOutSelf(req.scope, body);
      res.status(200).json({ ok: true, data: result });
    } catch (error) {
      console.error("[StaffOpsCtrl] checkOutSelf error:", error);
      next(error);
    }
  }) as RequestHandler,

  listExcuses: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as {
        status?: any;
        startDate?: string;
        endDate?: string;
        page: number;
        limit: number;
      };
      const excuses = await staffOperationsService.listExcuses(req.scope, query);
      res.json({ ok: true, data: excuses });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  requestExcuse: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody as any;
      const result = await staffOperationsService.requestExcuse(req.scope, body);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      console.error("[StaffOpsCtrl] requestExcuse error:", error);
      next(error);
    }
  }) as RequestHandler,

  updateExcuseStatus: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const excuseId = parseInt(req.params.id as string, 10);
      const { status, note } = req.body;
      const result = await staffOperationsService.updateExcuseStatus(req.scope, excuseId, status, note);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listVisits: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as {
        startDate?: string;
        endDate?: string;
        page: number;
        limit: number;
      };
      const visits = await staffOperationsService.listVisits(req.scope, query);
      res.json({ ok: true, data: visits });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getMonthlyReport: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as {
        month: number;
        year: number;
      };
      const report = await staffOperationsService.getMonthlyReport(req.scope, query.month, query.year);
      res.json({ ok: true, data: report });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listLeaves: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as any;
      const leaves = await staffOperationsService.listLeaves(req.scope, query);
      res.json({ ok: true, data: leaves });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  requestLeave: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody as any;
      const result = await staffOperationsService.requestLeave(req.scope, body);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateLeaveStatus: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const leaveId = parseInt(req.params.id as string, 10);
      const { status, note } = req.body;
      const result = await staffOperationsService.updateLeaveStatus(req.scope, leaveId, status, note);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createVisitLog: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody as any;
      const result = await staffOperationsService.createVisitLog(req.scope, body);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  endVisitLog: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const visitId = parseInt(req.params.id as string, 10);
      const body = res.locals.validatedBody as any;
      const result = await staffOperationsService.endVisitLog(req.scope, visitId, body);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  exportMonthlyReport: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { month, year } = res.locals.validatedQuery as { month: number; year: number };
      const { workDays, report } = await staffOperationsService.getMonthlyReport(req.scope, month, year);

      const roleLabel = (role: string) => {
        const map: Record<string, string> = {
          TEACHER: "معلم", CENTER_ADMIN: "مدير مركز", SUPERVISOR: "مشرف",
          ACCOUNTANT: "محاسب", FINANCE_MANAGER: "مدير مالي",
          TREASURER: "أمين صندوق", AUDITOR: "مدقق حسابات"
        };
        return map[role] ?? role;
      };

      const headers = [
        "م", "اسم الموظف", "الدور الوظيفي",
        "أيام الحضور", "أيام الغياب", "أيام التأخر",
        "أيام الإجازة", "أيام الأعذار",
        "ساعات الدوام الفعلية", "الساعات المتوقعة",
        "الزيارات الإشرافية", "الاستقطاعات المعلقة (ريال)",
        `أيام العمل المقررة: ${workDays}`
      ];

      const rows = (report as any[]).map((s, i) => [
        i + 1,
        s.fullName,
        roleLabel(s.role),
        s.presentDays,
        s.absentDays,
        s.lateDays,
        s.onLeaveDays,
        s.excusedDays,
        s.workingHours.toFixed(1),
        s.expectedHours.toFixed(1),
        s.visitsCount ?? 0,
        s.pendingDeductions.toFixed(2),
        ""
      ]);

      const escape = (v: string | number) => {
        const str = String(v);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      };

      const BOM = "\uFEFF";
      const csvLines = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
      const csv = BOM + csvLines;

      const filename = `attendance-report-${year}-${String(month).padStart(2, "0")}.csv`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getPrayerTimes: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { centerId } = res.locals.validatedParams as { centerId: number };
      const { date } = res.locals.validatedQuery as { date?: string };
      const targetDate = date ? new Date(date + "T00:00:00Z") : new Date();
      const policy = await attendancePolicyService.getPolicy(req.scope.organizationId);
      const times = await prayerTimeService.getPrayerTimes(centerId, targetDate, policy.prayerApiSource);
      res.json({ ok: true, data: times });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,
};
