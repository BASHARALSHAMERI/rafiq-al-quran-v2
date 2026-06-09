import { Router } from "express";
import { Role } from "@prisma/client";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { validateBody, validateQuery } from "../../shared/middleware/validate.middleware";
import { financeDeductionController } from "./finance-deduction.controller";
import {
  upsertRuleSchema,
  generateDeductionsSchema,
  reviewEventSchema,
  listEventsQuerySchema
} from "./finance-deduction.validation";

const financeDeductionRouter = Router();

financeDeductionRouter.use(authGuard, attachScope);

financeDeductionRouter.get(
  "/rules",
  requireRoles([Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.FINANCE_MANAGER, Role.AUDITOR]),
  financeDeductionController.listRules
);

financeDeductionRouter.post(
  "/rules",
  requireRoles([Role.SUPER_ADMIN]),
  validateBody(upsertRuleSchema),
  financeDeductionController.upsertRule
);

financeDeductionRouter.get(
  "/deductions",
  requireRoles([Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.FINANCE_MANAGER, Role.AUDITOR]),
  validateQuery(listEventsQuerySchema),
  financeDeductionController.listEvents
);

financeDeductionRouter.post(
  "/deductions/generate",
  requireRoles([Role.SUPER_ADMIN]),
  validateBody(generateDeductionsSchema),
  financeDeductionController.generateDeductions
);

financeDeductionRouter.patch(
  "/deductions/:id/review",
  requireRoles([Role.SUPER_ADMIN, Role.FINANCE_MANAGER]),
  validateBody(reviewEventSchema),
  financeDeductionController.reviewEvent
);

export default financeDeductionRouter;
