import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { staffScheduleService } from "./staff-schedule.service";
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  ListAssignmentsQueryDto
} from "./staff-schedule.validation";

export const staffScheduleController = {
  listAssignments: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as ListAssignmentsQueryDto;
      const data = await staffScheduleService.listAssignments(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getAssignment: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { id } = req.params;
      const data = await staffScheduleService.getAssignment(req.scope, Number(id));
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createManualAssignment: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const body = res.locals.validatedBody as CreateAssignmentDto;
      const input = {
        ...body,
        effectiveFrom: new Date(body.effectiveFrom),
        effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : null
      };
      const data = await staffScheduleService.createManualAssignment(req.scope, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateAssignment: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { id } = req.params;
      const body = res.locals.validatedBody as UpdateAssignmentDto;
      const input = {
        ...body,
        effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : undefined
      };
      const data = await staffScheduleService.updateAssignment(req.scope, Number(id), input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  deactivateAssignment: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { id } = req.params;
      const data = await staffScheduleService.deactivateAssignment(req.scope, Number(id));
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
