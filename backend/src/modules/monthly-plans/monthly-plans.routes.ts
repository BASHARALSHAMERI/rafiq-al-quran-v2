import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody, validateQuery } from "../../shared/middleware/validate.middleware";
import { monthlyPlansController } from "./monthly-plans.controller";
import {
  generateMonthlyPlansSchema,
  listMonthlyPlansSchema,
  updateMonthlyPlanSchema,
  updateReviewSettingsSchema
} from "./monthly-plans.validation";

const monthlyPlansRouter = Router();
const monthlyPlanRoles: Role[] = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER
];

monthlyPlansRouter.use(
  authGuard,
  attachScope,
  requireRoles(monthlyPlanRoles)
);

// إعدادات المراجعة
monthlyPlansRouter.get("/monthly-plans/review-settings", monthlyPlansController.getReviewSettings);
monthlyPlansRouter.put(
  "/monthly-plans/review-settings",
  validateBody(updateReviewSettingsSchema),
  monthlyPlansController.updateReviewSettings
);

// القائمة والتوليد
monthlyPlansRouter.get(
  "/monthly-plans",
  validateQuery(listMonthlyPlansSchema),
  monthlyPlansController.list
);

monthlyPlansRouter.post(
  "/monthly-plans/generate",
  validateBody(generateMonthlyPlansSchema),
  monthlyPlansController.generate
);

monthlyPlansRouter.post("/monthly-plans/approve-all", monthlyPlansController.approveAll);

// تفاصيل الخطة
monthlyPlansRouter.get("/monthly-plans/:id", monthlyPlansController.getById);
monthlyPlansRouter.put(
  "/monthly-plans/:id",
  validateBody(updateMonthlyPlanSchema),
  monthlyPlansController.update
);
monthlyPlansRouter.post("/monthly-plans/:id/approve", monthlyPlansController.approve);

export default monthlyPlansRouter;
