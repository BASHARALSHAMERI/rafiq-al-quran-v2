import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { verifyScope } from "../../shared/middleware/verify-scope.middleware";
import { validateBody, validateParams, validateQuery } from "../../shared/middleware/validate.middleware";
import { reportsController } from "./reports.controller";
import {
  attendanceReportQuerySchema,
  examsReportQuerySchema,
  exportReportBodySchema,
  financeReportQuerySchema,
  followUpReportQuerySchema,
  reportExportIdParamSchema,
  studentReportIdParamSchema,
  studentMonthlyExportBodySchema,
  studentMonthlyExportParamSchema,
  studentMonthlyReportQuerySchema,
  supervisorDashboardQuerySchema,
  summaryCenterCircleQuerySchema,
  summaryCenterQuerySchema,
  teacherMonthlyExportBodySchema,
  teacherMonthlyHalqaQuerySchema
} from "./reports.validation";

const reportsRouter = Router();
const reportsFinanceRoles = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER,
  Role.TREASURER,
  Role.AUDITOR
];
const reportsExportRoles = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER,
  Role.PARENT,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER,
  Role.TREASURER,
  Role.AUDITOR
];

reportsRouter.use(authGuard, attachScope);

reportsRouter.get(
  "/reports/catalog",
  requireRoles(reportsExportRoles),
  reportsController.catalog
);

reportsRouter.get(
  "/reports/supervisor/dashboard",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(supervisorDashboardQuerySchema),
  reportsController.supervisorDashboard
);

reportsRouter.get(
  "/reports/teacher/halqa-monthly",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateQuery(teacherMonthlyHalqaQuerySchema),
  reportsController.teacherMonthlyHalqa
);

reportsRouter.get(
  "/reports/attendance",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.PARENT]),
  validateQuery(attendanceReportQuerySchema),
  reportsController.attendance
);

reportsRouter.get(
  "/reports/follow-up",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.PARENT]),
  validateQuery(followUpReportQuerySchema),
  reportsController.followUp
);

reportsRouter.get(
  "/reports/exams",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.PARENT]),
  validateQuery(examsReportQuerySchema),
  reportsController.exams
);

reportsRouter.get(
  "/reports/finance",
  requireRoles(reportsFinanceRoles),
  validateQuery(financeReportQuerySchema),
  reportsController.finance
);

reportsRouter.get(
  "/reports/student/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.PARENT, Role.STUDENT]),
  validateParams(studentReportIdParamSchema),
  validateQuery(studentMonthlyReportQuerySchema),
  reportsController.student
);

reportsRouter.post(
  "/reports/teacher/halqa-monthly/export",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateBody(teacherMonthlyExportBodySchema),
  reportsController.exportTeacherMonthlyHalqa
);

reportsRouter.post(
  "/reports/student/:id/monthly/export",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.PARENT, Role.STUDENT]),
  validateParams(studentMonthlyExportParamSchema),
  validateBody(studentMonthlyExportBodySchema),
  reportsController.exportStudentMonthly
);

reportsRouter.post(
  "/reports/export",
  requireRoles(reportsExportRoles),
  validateBody(exportReportBodySchema),
  reportsController.export
);

reportsRouter.get(
  "/reports/exports/:id/download",
  requireRoles(reportsExportRoles),
  validateParams(reportExportIdParamSchema),
  reportsController.download
);


// REPORTS-1: Administrative summary endpoints
reportsRouter.get(
  "/reports/summary/centers",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  reportsController.centersSummary
);

reportsRouter.get(
  "/reports/summary/circles",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(summaryCenterQuerySchema),
  verifyScope("center", "query", "centerId"),
  reportsController.circlesSummary
);

reportsRouter.get(
  "/reports/summary/students",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(summaryCenterCircleQuerySchema),
  verifyScope("center", "query", "centerId"),
  verifyScope("circle", "query", "circleId"),
  reportsController.studentsSummary
);

reportsRouter.get(
  "/reports/summary/golden-records",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(summaryCenterQuerySchema),
  verifyScope("center", "query", "centerId"),
  reportsController.goldenRecordsSummary
);

export default reportsRouter;






