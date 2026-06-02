import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody, validateQuery, validateParams } from "../../shared/middleware/validate.middleware";
import { verifyScope } from "../../shared/middleware/verify-scope.middleware";
import { staffOperationsController } from "./staff-operations.controller";
import { supervisorController } from "./supervisor.controller";
import { z } from "zod";
import {
  listAttendanceQuerySchema,
  listExcusesQuerySchema,
  listVisitsQuerySchema,
  markStaffAttendanceBodySchema,
  monthlyReportQuerySchema,
  selfAttendanceActionBodySchema,
  selfAttendanceQuerySchema,
  requestExcuseBodySchema,
  updateExcuseStatusBodySchema,
  excuseIdParamSchema,
  listLeavesQuerySchema,
  requestLeaveBodySchema,
  updateLeaveStatusBodySchema,
  leaveIdParamSchema
} from "./staff-operations.validation";

const staffOpsRouter = Router();

const staffRoles = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER,
  Role.TREASURER,
  Role.AUDITOR
];

const selfAttendanceRoles = [
  Role.CENTER_ADMIN,
  Role.TEACHER,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER,
  Role.TREASURER,
  Role.AUDITOR
];

staffOpsRouter.use(authGuard, attachScope, requireRoles(staffRoles));

// 1. Staff Attendance Tabs
staffOpsRouter.get(
  "/",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(listAttendanceQuerySchema),
  staffOperationsController.listAttendance
);

staffOpsRouter.post(
  "/",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(markStaffAttendanceBodySchema),
  staffOperationsController.markAttendance
);

staffOpsRouter.get(
  "/self",
  requireRoles(selfAttendanceRoles),
  validateQuery(selfAttendanceQuerySchema),
  staffOperationsController.getSelfAttendance
);

staffOpsRouter.post(
  "/self/check-in",
  requireRoles(selfAttendanceRoles),
  validateBody(selfAttendanceActionBodySchema),
  staffOperationsController.checkInSelf
);

staffOpsRouter.post(
  "/self/check-out",
  requireRoles(selfAttendanceRoles),
  validateBody(selfAttendanceActionBodySchema),
  staffOperationsController.checkOutSelf
);

// 2. Staff Excuses
staffOpsRouter.get(
  "/excuses",
  requireRoles(staffRoles),
  validateQuery(listExcusesQuerySchema),
  staffOperationsController.listExcuses
);

staffOpsRouter.post(
  "/excuses",
  requireRoles(selfAttendanceRoles),
  validateBody(requestExcuseBodySchema),
  verifyScope("center", "body", "centerId"),
  staffOperationsController.requestExcuse
);

staffOpsRouter.patch(
  "/excuses/:id/status",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(excuseIdParamSchema),
  validateBody(updateExcuseStatusBodySchema),
  staffOperationsController.updateExcuseStatus
);

// 3. Staff Leaves
staffOpsRouter.get(
  "/leaves",
  requireRoles(staffRoles),
  validateQuery(listLeavesQuerySchema),
  staffOperationsController.listLeaves
);

staffOpsRouter.post(
  "/leaves",
  requireRoles(selfAttendanceRoles),
  validateBody(requestLeaveBodySchema),
  verifyScope("center", "body", "centerId"),
  staffOperationsController.requestLeave
);

staffOpsRouter.patch(
  "/leaves/:id/status",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(leaveIdParamSchema),
  validateBody(updateLeaveStatusBodySchema),
  staffOperationsController.updateLeaveStatus
);

// 4. Supervisor Visits
staffOpsRouter.get(
  "/visits",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(listVisitsQuerySchema),
  staffOperationsController.listVisits
);

const createVisitBodySchema = z.object({
  centerId: z.coerce.number().int().positive(),
  circleId: z.coerce.number().int().positive().optional().nullable(),
  planItemId: z.coerce.number().int().positive().optional().nullable(),
  startLatitude: z.number().min(-90).max(90).optional().nullable(),
  startLongitude: z.number().min(-180).max(180).optional().nullable(),
  observations: z.string().max(1000).optional().nullable()
}).strict();

const endVisitBodySchema = z.object({
  endLatitude: z.number().min(-90).max(90).optional().nullable(),
  endLongitude: z.number().min(-180).max(180).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  observations: z.string().max(1000).optional().nullable(),
  checklist: z.array(z.any()).optional()
}).strict();

const visitIdParamSchema = z.object({ id: z.coerce.number().int().positive() }).strict();

staffOpsRouter.post(
  "/visits",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateBody(createVisitBodySchema),
  staffOperationsController.createVisitLog
);

staffOpsRouter.patch(
  "/visits/:id/end",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateParams(visitIdParamSchema),
  validateBody(endVisitBodySchema),
  staffOperationsController.endVisitLog
);

// 5. Monthly Reports
staffOpsRouter.get(
  "/reports/monthly",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(monthlyReportQuerySchema),
  staffOperationsController.getMonthlyReport
);

staffOpsRouter.get(
  "/reports/export",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(monthlyReportQuerySchema),
  staffOperationsController.exportMonthlyReport
);

// 6. Supervisor Visit-Based Dashboard
const supervisorDashboardQuerySchema = z.object({
  supervisorId: z.coerce.number().optional(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100)
});

const supervisorTargetsBodySchema = z.object({
  monthlyHoursTarget: z.number().int().min(1).max(400).optional(),
  monthlyVisitsTarget: z.number().int().min(1).max(200).optional()
});

staffOpsRouter.get(
  "/supervisor/dashboard",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(supervisorDashboardQuerySchema),
  supervisorController.getDashboard
);

staffOpsRouter.get(
  "/supervisor/list",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  supervisorController.listSupervisors
);

staffOpsRouter.patch(
  "/supervisor/:userId/targets",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(supervisorTargetsBodySchema),
  supervisorController.upsertTargets
);

export default staffOpsRouter;
