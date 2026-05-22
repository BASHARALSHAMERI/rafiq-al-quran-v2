import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody } from "../../shared/middleware/validate.middleware";
import { attendancePolicyController } from "./attendance-policy.controller";
import { updatePolicySchema } from "./staff-schedule.validation";

const attendancePolicyRouter = Router();

attendancePolicyRouter.use(authGuard, attachScope);

attendancePolicyRouter.get(
  "/",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  attendancePolicyController.getPolicy
);

attendancePolicyRouter.put(
  "/",
  requireRoles([Role.SUPER_ADMIN]),
  validateBody(updatePolicySchema),
  attendancePolicyController.updatePolicy
);

export default attendancePolicyRouter;
