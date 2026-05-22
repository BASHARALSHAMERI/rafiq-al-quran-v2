import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody, validateParams, validateQuery } from "../../shared/middleware/validate.middleware";
import { verifyScope } from "../../shared/middleware/verify-scope.middleware";
import { goldenRecordsController } from "./golden-records.controller";
import {
  candidateApproveBodySchema,
  candidateDecisionBodySchema,
  candidateExamAttemptLinkBodySchema,
  createCandidateBodySchema,
  createGoldenRecordBodySchema,
  goldenRecordIdParamSchema,
  listCandidatesQuerySchema,
  listGoldenRecordsQuerySchema,
  listGoldenRecordStatsQuerySchema,
  rejectGoldenRecordBodySchema,
  submitGoldenRecordBodySchema,
  updateCandidateBodySchema,
  updateGoldenRecordBodySchema
} from "./golden-records.validation";

const goldenRecordsRouter = Router();

goldenRecordsRouter.use(
  authGuard,
  attachScope,
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN])
);

goldenRecordsRouter.get(
  "/candidates",
  validateQuery(listCandidatesQuerySchema),
  verifyScope("center", "query", "centerId"),
  verifyScope("circle", "query", "circleId"),
  goldenRecordsController.listCandidates
);

goldenRecordsRouter.post(
  "/candidates",
  requireRoles([Role.CENTER_ADMIN]),
  validateBody(createCandidateBodySchema),
  goldenRecordsController.createCandidate
);

goldenRecordsRouter.patch(
  "/candidates/:id",
  requireRoles([Role.CENTER_ADMIN]),
  validateParams(goldenRecordIdParamSchema),
  validateBody(updateCandidateBodySchema),
  goldenRecordsController.updateCandidate
);

goldenRecordsRouter.post(
  "/candidates/:id/approve",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(goldenRecordIdParamSchema),
  validateBody(candidateApproveBodySchema),
  goldenRecordsController.approveCandidate
);

goldenRecordsRouter.post(
  "/candidates/:id/reject",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(goldenRecordIdParamSchema),
  validateBody(candidateDecisionBodySchema),
  goldenRecordsController.rejectCandidate
);

goldenRecordsRouter.post(
  "/candidates/:id/defer",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(goldenRecordIdParamSchema),
  validateBody(candidateDecisionBodySchema),
  goldenRecordsController.deferCandidate
);

goldenRecordsRouter.post(
  "/candidates/:id/link-exam-attempt",
  requireRoles([Role.CENTER_ADMIN]),
  validateParams(goldenRecordIdParamSchema),
  validateBody(candidateExamAttemptLinkBodySchema),
  goldenRecordsController.linkCandidateExamAttempt
);

goldenRecordsRouter.get(
  "/golden-records/stats",
  validateQuery(listGoldenRecordStatsQuerySchema),
  verifyScope("center", "query", "centerId"),
  goldenRecordsController.goldenRecordStats
);

goldenRecordsRouter.get(
  "/golden-records",
  validateQuery(listGoldenRecordsQuerySchema),
  verifyScope("center", "query", "centerId"),
  verifyScope("circle", "query", "circleId"),
  goldenRecordsController.listGoldenRecords
);

goldenRecordsRouter.get(
  "/golden-records/:id/certificate",
  validateParams(goldenRecordIdParamSchema),
  goldenRecordsController.getGoldenRecordCertificate
);

goldenRecordsRouter.post(
  "/golden-records",
  validateBody(createGoldenRecordBodySchema),
  verifyScope("center", "body", "centerId"),
  verifyScope("circle", "body", "circleId"),
  goldenRecordsController.createGoldenRecord
);

goldenRecordsRouter.patch(
  "/golden-records/:id",
  validateParams(goldenRecordIdParamSchema),
  validateBody(updateGoldenRecordBodySchema),
  verifyScope("circle", "body", "circleId"),
  goldenRecordsController.updateGoldenRecord
);

goldenRecordsRouter.post(
  "/golden-records/:id/submit",
  validateParams(goldenRecordIdParamSchema),
  validateBody(submitGoldenRecordBodySchema),
  goldenRecordsController.submitGoldenRecord
);

goldenRecordsRouter.post(
  "/golden-records/:id/approve",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(goldenRecordIdParamSchema),
  validateBody(submitGoldenRecordBodySchema),
  goldenRecordsController.approveGoldenRecord
);

goldenRecordsRouter.post(
  "/golden-records/:id/reject",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(goldenRecordIdParamSchema),
  validateBody(rejectGoldenRecordBodySchema),
  goldenRecordsController.rejectGoldenRecord
);

export default goldenRecordsRouter;
