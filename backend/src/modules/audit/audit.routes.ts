import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateQuery } from "../../shared/middleware/validate.middleware";
import { auditController } from "./audit.controller";
import { listAuditQuerySchema } from "./audit.validation";

const auditRouter = Router();

auditRouter.use(authGuard, attachScope);

auditRouter.get(
  "/audit",
  requireRoles([Role.SUPER_ADMIN]),
  validateQuery(listAuditQuerySchema),
  auditController.list
);

auditRouter.get(
  "/audit/catalog",
  requireRoles([Role.SUPER_ADMIN]),
  auditController.catalog
);

export default auditRouter;
