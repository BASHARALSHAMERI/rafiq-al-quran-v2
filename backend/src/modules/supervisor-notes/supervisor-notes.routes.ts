import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../shared/middleware/validate.middleware";
import { verifyScope } from "../../shared/middleware/verify-scope.middleware";
import { supervisorNotesController } from "./supervisor-notes.controller";
import {
  createSupervisorNoteBodySchema,
  listSupervisorNotesQuerySchema,
  supervisorNoteIdParamSchema,
  updateSupervisorNoteStatusBodySchema,
} from "./supervisor-notes.validation";

const supervisorNotesRouter = Router();

supervisorNotesRouter.use(authGuard, attachScope);

supervisorNotesRouter.get(
  "/supervisor-notes",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(listSupervisorNotesQuerySchema),
  verifyScope("center", "query", "centerId"),
  verifyScope("circle", "query", "circleId"),
  supervisorNotesController.list
);

supervisorNotesRouter.post(
  "/supervisor-notes",
  requireRoles([Role.SUPERVISOR, Role.CENTER_ADMIN, Role.SUPER_ADMIN]),
  validateBody(createSupervisorNoteBodySchema),
  verifyScope("circle", "body", "circleId"),
  supervisorNotesController.create
);

supervisorNotesRouter.patch(
  "/supervisor-notes/:id/status",
  requireRoles([Role.SUPERVISOR, Role.CENTER_ADMIN, Role.SUPER_ADMIN]),
  validateParams(supervisorNoteIdParamSchema),
  validateBody(updateSupervisorNoteStatusBodySchema),
  supervisorNotesController.updateStatus
);

export default supervisorNotesRouter;
