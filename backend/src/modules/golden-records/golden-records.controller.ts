import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { certificatesService } from "../certificates/certificates.service";
import { goldenRecordsService } from "./golden-records.service";

export const goldenRecordsController = {
  listCandidates: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as import("./golden-records.service").ListCandidatesQuery;
      const data = await goldenRecordsService.listCandidates(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createCandidate: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const input = req.body as import("./golden-records.service").CreateCandidateInput;
      const data = await goldenRecordsService.createCandidate(req.scope, input);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateCandidate: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const input = req.body as import("./golden-records.service").UpdateCandidateInput;
      const data = await goldenRecordsService.updateCandidate(req.scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approveCandidate: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const input = req.body as { statusNote?: string | null; lockVersion?: number };
      const data = await goldenRecordsService.approveCandidate(req.scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  rejectCandidate: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const input = req.body as { statusNote: string; lockVersion?: number };
      const data = await goldenRecordsService.rejectCandidate(req.scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  deferCandidate: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const input = req.body as { statusNote: string; lockVersion?: number };
      const data = await goldenRecordsService.deferCandidate(req.scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  linkCandidateExamAttempt: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const input = req.body as { examAttemptId: number; lockVersion?: number };
      const data = await goldenRecordsService.linkCandidateExamAttempt(req.scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listGoldenRecords: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as import("./golden-records.service").ListGoldenRecordsQuery;
      const data = await goldenRecordsService.listGoldenRecords(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getGoldenRecordCertificate: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const data = await certificatesService.getGoldenRecordCertificate(req.scope, params.id);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createGoldenRecord: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const input = req.body as import("./golden-records.service").CreateGoldenRecordInput;
      const data = await goldenRecordsService.createGoldenRecord(req.scope, input);
      res.status(201).json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateGoldenRecord: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const input = req.body as import("./golden-records.service").UpdateGoldenRecordInput;
      const data = await goldenRecordsService.updateGoldenRecord(req.scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  submitGoldenRecord: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const input = req.body as { statusNote?: string | null; lockVersion?: number };
      const data = await goldenRecordsService.submitGoldenRecord(req.scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approveGoldenRecord: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const input = req.body as { statusNote?: string | null; lockVersion?: number };
      const data = await goldenRecordsService.approveGoldenRecord(req.scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  rejectGoldenRecord: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const input = req.body as { statusNote: string; lockVersion?: number };
      const data = await goldenRecordsService.rejectGoldenRecord(req.scope, params.id, input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  goldenRecordStats: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const query = res.locals.validatedQuery as import("./golden-records.service").GoldenRecordStatsQuery;
      const data = await goldenRecordsService.getStats(req.scope, query);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
