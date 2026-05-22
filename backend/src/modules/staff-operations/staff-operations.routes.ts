import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody, validateQuery, validateParams } from "../../shared/middleware/validate.middleware";
import { verifyScope } from "../../shared/middleware/verify-scope.middleware";
import { staffOperationsController } from "./staff-operations.controller";
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

staffOpsRouter.use(
  authGuard,
  attachScope,
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER])
);

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
  requireRoles([Role.CENTER_ADMIN, Role.TEACHER]),
  validateQuery(selfAttendanceQuerySchema),
  staffOperationsController.getSelfAttendance
);

staffOpsRouter.post(
  "/self/check-in",
  requireRoles([Role.CENTER_ADMIN, Role.TEACHER]),
  validateBody(selfAttendanceActionBodySchema),
  staffOperationsController.checkInSelf
);

staffOpsRouter.post(
  "/self/check-out",
  requireRoles([Role.CENTER_ADMIN, Role.TEACHER]),
  validateBody(selfAttendanceActionBodySchema),
  staffOperationsController.checkOutSelf
);

// 2. Staff Excuses
staffOpsRouter.get(
  "/excuses",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.TEACHER]),
  validateQuery(listExcusesQuerySchema),
  staffOperationsController.listExcuses
);

staffOpsRouter.post(
  "/excuses",
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
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.TEACHER]),
  validateQuery(listLeavesQuerySchema),
  staffOperationsController.listLeaves
);

staffOpsRouter.post(
  "/leaves",
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
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(listVisitsQuerySchema),
  staffOperationsController.listVisits
);

// 5. Monthly Reports
staffOpsRouter.get(
  "/reports/monthly",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(monthlyReportQuerySchema),
  staffOperationsController.getMonthlyReport
);

export default staffOpsRouter;
