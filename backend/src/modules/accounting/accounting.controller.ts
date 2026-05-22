import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { accountingService } from "./accounting.service";

const requireScope = (req: Parameters<RequestHandler>[0]) => {
  if (!req.scope) {
    throw new AppError("Scope not resolved", 500);
  }
  return req.scope;
};

export const accountingController = {
  getAccounts: (async (req, res, next) => {
    try {
      const data = await accountingService.getChartOfAccounts(
        requireScope(req),
        res.locals.validatedQuery
      );
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createAccount: (async (req, res, next) => {
    try {
      const data = await accountingService.createAccount(requireScope(req), req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateAccount: (async (req, res, next) => {
    try {
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.updateAccount(requireScope(req), params.id, req.body);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listJournalEntries: (async (req, res, next) => {
    try {
      const data = await accountingService.listJournalEntries(
        requireScope(req),
        res.locals.validatedQuery
      );
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createJournalEntry: (async (req, res, next) => {
    try {
      const data = await accountingService.createJournalEntry(requireScope(req), req.body);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  postJournalEntry: (async (req, res, next) => {
    try {
      const params = res.locals.validatedParams as { id: number };
      const data = await accountingService.postJournalEntry(requireScope(req), params.id);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getLedger: (async (req, res, next) => {
    try {
      const data = await accountingService.getLedger(requireScope(req), res.locals.validatedQuery);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getTrialBalance: (async (req, res, next) => {
    try {
      const data = await accountingService.getTrialBalance(
        requireScope(req),
        res.locals.validatedQuery
      );
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
