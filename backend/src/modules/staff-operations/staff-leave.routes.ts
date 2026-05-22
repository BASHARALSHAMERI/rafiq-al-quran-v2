import { Router } from "express";
import { Role } from "@prisma/client";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { validateBody, validateQuery } from "../../shared/middleware/validate.middleware";
import { staffLeaveController } from "./staff-leave.controller";
import {
  submitLeaveRequestSchema,
  leaveResponseSchema,
  listLeaveRequestsQuerySchema
} from "./staff-leave.validation";

const staffLeaveRouter = Router();

staffLeaveRouter.use(authGuard, attachScope);

staffLeaveRouter.post(
  "/",
  validateBody(submitLeaveRequestSchema),
  staffLeaveController.submitLeaveRequest
);

staffLeaveRouter.get(
  "/",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateQuery(listLeaveRequestsQuerySchema),
  staffLeaveController.listLeaveRequests
);

staffLeaveRouter.patch(
  "/:id/approve",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(leaveResponseSchema),
  staffLeaveController.approveLeave
);

staffLeaveRouter.patch(
  "/:id/reject",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(leaveResponseSchema),
  staffLeaveController.rejectLeave
);

staffLeaveRouter.patch(
  "/:id/cancel",
  staffLeaveController.cancelLeave
);

export default staffLeaveRouter;
