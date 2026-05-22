import { Role } from "@prisma/client";
import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { requireRoles } from "../../shared/middleware/rbac.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateBody, validateParams, validateQuery } from "../../shared/middleware/validate.middleware";
import { accountingController } from "./accounting.controller";
import {
  accountingEntityIdParamSchema,
  createAccountingAccountBodySchema,
  createJournalEntryBodySchema,
  ledgerQuerySchema,
  listAccountsQuerySchema,
  listJournalEntriesQuerySchema,
  trialBalanceQuerySchema,
  updateAccountingAccountBodySchema
} from "./accounting.validation";

const accountingRouter = Router();
const accountingRoles = [Role.SUPER_ADMIN, Role.CENTER_ADMIN];

accountingRouter.use(authGuard, attachScope);

accountingRouter.get(
  "/accounting/accounts",
  requireRoles(accountingRoles),
  validateQuery(listAccountsQuerySchema),
  accountingController.getAccounts
);

accountingRouter.post(
  "/accounting/accounts",
  requireRoles(accountingRoles),
  validateBody(createAccountingAccountBodySchema),
  accountingController.createAccount
);

accountingRouter.patch(
  "/accounting/accounts/:id",
  requireRoles(accountingRoles),
  validateParams(accountingEntityIdParamSchema),
  validateBody(updateAccountingAccountBodySchema),
  accountingController.updateAccount
);

accountingRouter.get(
  "/accounting/journal-entries",
  requireRoles(accountingRoles),
  validateQuery(listJournalEntriesQuerySchema),
  accountingController.listJournalEntries
);

accountingRouter.post(
  "/accounting/journal-entries",
  requireRoles(accountingRoles),
  validateBody(createJournalEntryBodySchema),
  accountingController.createJournalEntry
);

accountingRouter.post(
  "/accounting/journal-entries/:id/post",
  requireRoles(accountingRoles),
  validateParams(accountingEntityIdParamSchema),
  accountingController.postJournalEntry
);

accountingRouter.get(
  "/accounting/ledger",
  requireRoles(accountingRoles),
  validateQuery(ledgerQuerySchema),
  accountingController.getLedger
);

accountingRouter.get(
  "/accounting/trial-balance",
  requireRoles(accountingRoles),
  validateQuery(trialBalanceQuerySchema),
  accountingController.getTrialBalance
);

export default accountingRouter;
