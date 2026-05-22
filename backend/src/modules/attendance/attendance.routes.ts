import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody, validateQuery } from "../../shared/middleware/validate.middleware";
import { verifyScope } from "../../shared/middleware/verify-scope.middleware";
import { attendanceController } from "./attendance.controller";
import { attendanceBulkBodySchema, attendanceQuerySchema } from "./attendance.validation";

const attendanceRouter = Router();

attendanceRouter.use(
  authGuard,
  attachScope,
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER])
);

attendanceRouter.get(
  "/attendance",
  validateQuery(attendanceQuerySchema),
  verifyScope("circle", "query", "circleId"),
  attendanceController.listForDate
);

// واجهة المعلم — طلاب الحلقة مع حالة الحضور
attendanceRouter.get(
  "/attendance/students",
  validateQuery(attendanceQuerySchema),
  verifyScope("circle", "query", "circleId"),
  attendanceController.getCircleStudents
);

attendanceRouter.post(
  "/attendance/bulk",
  validateBody(attendanceBulkBodySchema),
  verifyScope("circle", "body", "circleId"),
  attendanceController.submitBulk
);

export default attendanceRouter;
