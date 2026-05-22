import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody, validateParams, validateQuery } from "../../shared/middleware/validate.middleware";
import { staffScheduleController } from "./staff-schedule.controller";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  listAssignmentsQuerySchema,
  assignmentIdParamSchema
} from "./staff-schedule.validation";

const staffScheduleRouter = Router();

staffScheduleRouter.use(
  authGuard,
  attachScope,
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN])
);

staffScheduleRouter.get(
  "/",
  validateQuery(listAssignmentsQuerySchema),
  staffScheduleController.listAssignments
);

staffScheduleRouter.post(
  "/",
  validateBody(createAssignmentSchema),
  staffScheduleController.createManualAssignment
);

staffScheduleRouter.get(
  "/:id",
  validateParams(assignmentIdParamSchema),
  staffScheduleController.getAssignment
);

staffScheduleRouter.put(
  "/:id",
  validateParams(assignmentIdParamSchema),
  validateBody(updateAssignmentSchema),
  staffScheduleController.updateAssignment
);

staffScheduleRouter.delete(
  "/:id",
  validateParams(assignmentIdParamSchema),
  staffScheduleController.deactivateAssignment
);

export default staffScheduleRouter;
