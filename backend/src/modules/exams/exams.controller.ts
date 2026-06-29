import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error";
import { certificatesService } from "../certificates/certificates.service";
import { examsService } from "./exams.service";
import { examsWorkflowService } from "./exams.workflow.service";

export const examsController = {
  listExams: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const exams = await examsService.listExams(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data: exams });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createExam: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const exam = await examsService.createExam(req.scope, req.body);
      res.status(201).json({ ok: true, data: exam });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateExam: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const exam = await examsService.updateExam(req.scope, params.id, req.body);
      res.json({ ok: true, data: exam });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  deleteExam: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const exam = await examsService.deleteExam(req.scope, params.id);
      res.json({ ok: true, data: exam });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  publishExam: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const exam = await examsService.publishExam(req.scope, params.id);
      res.json({ ok: true, data: exam });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listQuestionBank: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const items = await examsService.listQuestionBank(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data: items });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createQuestionBankItem: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const item = await examsService.createQuestionBankItem(req.scope, req.body);
      res.status(201).json({ ok: true, data: item });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateQuestionBankItem: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const item = await examsService.updateQuestionBankItem(req.scope, params.id, req.body);
      res.json({ ok: true, data: item });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  generateQuestionBankItems: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const items = await examsService.generateQuestionBankItems(req.scope, req.body);
      res.status(201).json({ ok: true, data: items });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  deleteQuestionBankItem: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const item = await examsService.deleteQuestionBankItem(req.scope, params.id);
      res.json({ ok: true, data: item });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listNominationRequests: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const nominations = await examsWorkflowService.listNominationRequests(
        req.scope,
        res.locals.validatedQuery
      );
      res.json({ ok: true, data: nominations });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createNominationRequest: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const nomination = await examsWorkflowService.createNominationRequest(req.scope, req.body);
      res.status(201).json({ ok: true, data: nomination });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  supervisorReviewNominationRequest: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const nomination = await examsWorkflowService.supervisorReviewNominationRequest(
        req.scope,
        params.id,
        req.body
      );
      res.json({ ok: true, data: nomination });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  centerReviewNominationRequest: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const nomination = await examsWorkflowService.centerReviewNominationRequest(
        req.scope,
        params.id,
        req.body
      );
      res.json({ ok: true, data: nomination });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  centerApproveNominationRequest: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const result = await examsWorkflowService.centerApproveNominationRequest(
        req.scope,
        params.id,
        req.body
      );
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listAllAttempts: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const attempts = await examsWorkflowService.listAllAttempts(req.scope, res.locals.validatedQuery);
      res.json({ ok: true, data: attempts });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  listExamAttempts: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempts = await examsWorkflowService.listExamAttempts(req.scope, params.id);
      res.json({ ok: true, data: attempts });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getAttemptCertificate: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const data = await certificatesService.getExamAttemptCertificate(req.scope, params.id);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createExamAttempt: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempt = await examsService.createExamAttempt(req.scope, params.id, req.body);
      res.status(201).json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateAttemptCommittee: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempt = await examsWorkflowService.updateAttemptCommittee(req.scope, params.id, req.body);
      res.json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  postponeAttempt: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempt = await examsService.postponeAttempt(req.scope, params.id, req.body);
      res.json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  markAttemptAsAbsent: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempt = await examsService.markAttemptAsAbsent(req.scope, params.id);
      res.json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  generateAttemptQuestions: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempt = await examsWorkflowService.generateAttemptQuestions(req.scope, params.id, req.body);
      res.json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  createAttemptQuestion: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempt = await examsWorkflowService.createAttemptQuestion(req.scope, params.id, req.body);
      res.status(201).json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  deleteAttemptQuestion: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number; questionId: number };
      const attempt = await examsWorkflowService.deleteAttemptQuestion(
        req.scope,
        params.id,
        params.questionId
      );
      res.json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  evaluateAttempt: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempt = await examsWorkflowService.evaluateAttempt(req.scope, params.id, req.body);
      res.json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  scoreAttempt: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempt = await examsService.scoreAttempt(req.scope, params.id, req.body);
      res.json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  finalizeAttemptEvaluation: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempt = await examsWorkflowService.finalizeAttemptEvaluation(req.scope, params.id);
      res.json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  approveAttempt: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempt = await examsWorkflowService.approveAttempt(req.scope, params.id);
      res.json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  publishAttempt: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempt = await examsWorkflowService.publishAttempt(req.scope, params.id);
      res.json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  shareAttemptResult: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const result = await examsService.shareAttemptResult(req.scope, params.id);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  reopenAttemptForQuestionAdjustment: (async (req, res, next) => {
    try {
      if (!req.scope) {
        throw new AppError("Scope not resolved", 500);
      }

      const params = res.locals.validatedParams as { id: number };
      const attempt = await examsWorkflowService.reopenAttemptForQuestionAdjustment(
        req.scope,
        params.id,
        req.body
      );
      res.json({ ok: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
