import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { supervisorNotesService } from "./supervisor-notes.service";
import type { CreateSupervisorNoteInput, ListSupervisorNotesInput } from "./supervisor-notes.service";
import type { SupervisorNoteStatus } from "@prisma/client";

export const supervisorNotesController = {
  list: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const query = res.locals.validatedQuery as ListSupervisorNotesInput;
      const data = await supervisorNotesService.list(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  create: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const input = req.body as CreateSupervisorNoteInput;
      const data = await supervisorNotesService.create(req.scope, input);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateStatus: (async (req, res, next) => {
    try {
      if (!req.scope) throw new AppError("Scope not resolved", 500);
      const { id } = res.locals.validatedParams as { id: number };
      const { status } = req.body as { status: SupervisorNoteStatus };
      const data = await supervisorNotesService.updateStatus(req.scope, id, status);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,
};
