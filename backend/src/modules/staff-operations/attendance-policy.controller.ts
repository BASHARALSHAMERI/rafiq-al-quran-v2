import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { attendancePolicyService } from "./attendance-policy.service";
import { UpdatePolicyDto } from "./staff-schedule.validation";

export const attendancePolicyController = {
  getPolicy: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const data = await attendancePolicyService.getPolicy(req.scope.organizationId);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updatePolicy: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody as UpdatePolicyDto;
      const data = await attendancePolicyService.updatePolicy(req.scope, body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
