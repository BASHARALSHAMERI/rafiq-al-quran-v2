import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody, validateParams, validateQuery } from "../../shared/middleware/validate.middleware";
import { correctionsController } from "./corrections.controller";
import {
  approveCorrectionBodySchema,
  correctionRequestIdParamSchema,
  createCorrectionBodySchema,
  listCorrectionsQuerySchema,
  rejectCorrectionBodySchema
} from "./corrections.validation";

const correctionsRouter = Router();

correctionsRouter.use(authGuard, attachScope);

correctionsRouter.get(
  "/corrections",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateQuery(listCorrectionsQuerySchema),
  correctionsController.list
);

correctionsRouter.post(
  "/corrections",
  requireRoles([Role.TEACHER, Role.SUPERVISOR]),
  validateBody(createCorrectionBodySchema),
  correctionsController.create
);

correctionsRouter.post(
  "/corrections/:id/approve",
  requireRoles([Role.SUPERVISOR]),
  validateParams(correctionRequestIdParamSchema),
  validateBody(approveCorrectionBodySchema),
  correctionsController.approve
);

correctionsRouter.post(
  "/corrections/:id/reject",
  requireRoles([Role.SUPERVISOR]),
  validateParams(correctionRequestIdParamSchema),
  validateBody(rejectCorrectionBodySchema),
  correctionsController.reject
);

export default correctionsRouter;

