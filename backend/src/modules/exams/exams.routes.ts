import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import {
  validateBody,
  validateParams,
  validateQuery
} from "../../shared/middleware/validate.middleware";
import { verifyScope } from "../../shared/middleware/verify-scope.middleware";
import { examsController } from "./exams.controller";
import {
  attemptIdParamSchema,
  attemptQuestionParamSchema,
  centerApproveNominationBodySchema,
  centerReviewNominationBodySchema,
  createAttemptQuestionBodySchema,
  createExamBodySchema,
  createNominationRequestBodySchema,
  createQuestionBankItemBodySchema,
  emptyBodySchema,
  evaluateAttemptBodySchema,
  examIdParamSchema,
  generateAttemptQuestionsBodySchema,
  generateQuestionBankBodySchema,
  listAttemptsQuerySchema,
  listExamsQuerySchema,
  listNominationRequestsQuerySchema,
  listQuestionBankQuerySchema,
  nominationIdParamSchema,
  questionBankIdParamSchema,
  reopenAttemptForQuestionAdjustmentBodySchema,
  supervisorReviewNominationBodySchema,
  postponeAttemptBodySchema,
  updateAttemptCommitteeBodySchema,
  updateExamBodySchema,
  updateQuestionBankItemBodySchema
} from "./exams.validation";

const examsRouter = Router();

examsRouter.use(authGuard, attachScope);

examsRouter.get(
  "/exams",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateQuery(listExamsQuerySchema),
  verifyScope("center", "query", "centerId"),
  verifyScope("circle", "query", "circleId"),
  examsController.listExams
);

examsRouter.post(
  "/exams",
  requireRoles([Role.SUPER_ADMIN]),
  validateBody(createExamBodySchema),
  examsController.createExam
);

examsRouter.patch(
  "/exams/:id",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(examIdParamSchema),
  validateBody(updateExamBodySchema),
  examsController.updateExam
);

examsRouter.delete(
  "/exams/:id",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(examIdParamSchema),
  examsController.deleteExam
);

examsRouter.post(
  "/exams/:id/publish",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(examIdParamSchema),
  examsController.publishExam
);

examsRouter.get(
  "/question-bank",
  requireRoles([Role.SUPER_ADMIN]),
  validateQuery(listQuestionBankQuerySchema),
  examsController.listQuestionBank
);

examsRouter.post(
  "/question-bank",
  requireRoles([Role.SUPER_ADMIN]),
  validateBody(createQuestionBankItemBodySchema),
  examsController.createQuestionBankItem
);

examsRouter.patch(
  "/question-bank/:id",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(questionBankIdParamSchema),
  validateBody(updateQuestionBankItemBodySchema),
  examsController.updateQuestionBankItem
);

examsRouter.post(
  "/question-bank/generate",
  requireRoles([Role.SUPER_ADMIN]),
  validateBody(generateQuestionBankBodySchema),
  examsController.generateQuestionBankItems
);

examsRouter.delete(
  "/question-bank/:id",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(questionBankIdParamSchema),
  examsController.deleteQuestionBankItem
);

examsRouter.get(
  "/exam-nominations",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateQuery(listNominationRequestsQuerySchema),
  verifyScope("center", "query", "centerId"),
  verifyScope("circle", "query", "circleId"),
  examsController.listNominationRequests
);

examsRouter.post(
  "/exam-nominations",
  requireRoles([Role.TEACHER, Role.CENTER_ADMIN]),
  validateBody(createNominationRequestBodySchema),
  verifyScope("circle", "body", "circleId"),
  examsController.createNominationRequest
);

examsRouter.post(
  "/exam-nominations/:id/supervisor-review",
  requireRoles([Role.SUPERVISOR]),
  validateParams(nominationIdParamSchema),
  validateBody(supervisorReviewNominationBodySchema),
  examsController.supervisorReviewNominationRequest
);

examsRouter.post(
  "/exam-nominations/:id/center-review",
  requireRoles([Role.CENTER_ADMIN]),
  validateParams(nominationIdParamSchema),
  validateBody(centerReviewNominationBodySchema),
  examsController.centerReviewNominationRequest
);

examsRouter.post(
  "/exam-nominations/:id/center-approve",
  requireRoles([Role.CENTER_ADMIN]),
  validateParams(nominationIdParamSchema),
  validateBody(centerApproveNominationBodySchema),
  examsController.centerApproveNominationRequest
);

examsRouter.get(
  "/attempts",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.STUDENT, Role.PARENT]),
  validateQuery(listAttemptsQuerySchema),
  verifyScope("center", "query", "centerId"),
  verifyScope("circle", "query", "circleId"),
  examsController.listAllAttempts
);

examsRouter.get(
  "/exams/:id/attempts",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateParams(examIdParamSchema),
  examsController.listExamAttempts
);

examsRouter.get(
  "/attempts/:id/certificate",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.STUDENT, Role.PARENT]),
  validateParams(attemptIdParamSchema),
  examsController.getAttemptCertificate
);

examsRouter.patch(
  "/attempts/:id/committee",
  requireRoles([Role.CENTER_ADMIN]),
  validateParams(attemptIdParamSchema),
  validateBody(updateAttemptCommitteeBodySchema),
  examsController.updateAttemptCommittee
);

examsRouter.post(
  "/attempts/:id/questions/generate",
  requireRoles([Role.CENTER_ADMIN, Role.TEACHER, Role.SUPERVISOR]),
  validateParams(attemptIdParamSchema),
  validateBody(generateAttemptQuestionsBodySchema),
  examsController.generateAttemptQuestions
);

examsRouter.post(
  "/attempts/:id/questions",
  requireRoles([Role.TEACHER, Role.SUPERVISOR, Role.CENTER_ADMIN]),
  validateParams(attemptIdParamSchema),
  validateBody(createAttemptQuestionBodySchema),
  examsController.createAttemptQuestion
);

examsRouter.delete(
  "/attempts/:id/questions/:questionId",
  requireRoles([Role.TEACHER, Role.SUPERVISOR, Role.CENTER_ADMIN]),
  validateParams(attemptQuestionParamSchema),
  examsController.deleteAttemptQuestion
);

examsRouter.post(
  "/attempts/:id/evaluate",
  requireRoles([Role.TEACHER, Role.SUPERVISOR, Role.CENTER_ADMIN]),
  validateParams(attemptIdParamSchema),
  validateBody(evaluateAttemptBodySchema),
  examsController.evaluateAttempt
);

examsRouter.post(
  "/attempts/:id/finalize-evaluation",
  requireRoles([Role.TEACHER, Role.SUPERVISOR, Role.CENTER_ADMIN]),
  validateParams(attemptIdParamSchema),
  validateBody(emptyBodySchema),
  examsController.finalizeAttemptEvaluation
);

examsRouter.post(
  "/attempts/:id/approve",
  requireRoles([Role.CENTER_ADMIN]),
  validateParams(attemptIdParamSchema),
  validateBody(emptyBodySchema),
  examsController.approveAttempt
);

examsRouter.post(
  "/attempts/:id/publish",
  requireRoles([Role.CENTER_ADMIN]),
  validateParams(attemptIdParamSchema),
  validateBody(emptyBodySchema),
  examsController.publishAttempt
);

examsRouter.post(
  "/attempts/:id/reopen-for-question-adjustment",
  requireRoles([Role.CENTER_ADMIN]),
  validateParams(attemptIdParamSchema),
  validateBody(reopenAttemptForQuestionAdjustmentBodySchema),
  examsController.reopenAttemptForQuestionAdjustment
);

examsRouter.post(
  "/attempts/:id/postpone",
  requireRoles([Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateParams(attemptIdParamSchema),
  validateBody(postponeAttemptBodySchema),
  examsController.postponeAttempt
);

examsRouter.post(
  "/attempts/:id/absent",
  requireRoles([Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER]),
  validateParams(attemptIdParamSchema),
  examsController.markAttemptAsAbsent
);

export default examsRouter;
