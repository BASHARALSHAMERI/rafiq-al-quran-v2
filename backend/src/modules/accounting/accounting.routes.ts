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
const accountingAdminRoles = [Role.SUPER_ADMIN, Role.FINANCE_MANAGER];
const accountingReadRoles = [
  Role.SUPER_ADMIN,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER,
  Role.TREASURER,
  Role.AUDITOR,
  Role.SUPERVISOR
];
const accountingDraftWriteRoles = [
  Role.SUPER_ADMIN,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER
];

accountingRouter.use(authGuard, attachScope);

accountingRouter.get(
  "/accounting/accounts",
  requireRoles(accountingReadRoles),
  validateQuery(listAccountsQuerySchema),
  accountingController.getAccounts
);

accountingRouter.post(
  "/accounting/accounts",
  requireRoles(accountingAdminRoles),
  validateBody(createAccountingAccountBodySchema),
  accountingController.createAccount
);

accountingRouter.patch(
  "/accounting/accounts/:id",
  requireRoles(accountingAdminRoles),
  validateParams(accountingEntityIdParamSchema),
  validateBody(updateAccountingAccountBodySchema),
  accountingController.updateAccount
);

accountingRouter.get(
  "/accounting/journal-entries",
  requireRoles(accountingReadRoles),
  validateQuery(listJournalEntriesQuerySchema),
  accountingController.listJournalEntries
);

accountingRouter.post(
  "/accounting/journal-entries",
  requireRoles(accountingDraftWriteRoles),
  validateBody(createJournalEntryBodySchema),
  accountingController.createJournalEntry
);

accountingRouter.post(
  "/accounting/journal-entries/:id/post",
  requireRoles(accountingAdminRoles),
  validateParams(accountingEntityIdParamSchema),
  accountingController.postJournalEntry
);

accountingRouter.post(
  "/accounting/fiscal-periods/:id/close",
  requireRoles(accountingAdminRoles),
  validateParams(accountingEntityIdParamSchema),
  accountingController.closeFiscalPeriod
);

accountingRouter.get(
  "/accounting/ledger",
  requireRoles(accountingReadRoles),
  validateQuery(ledgerQuerySchema),
  accountingController.getLedger
);

accountingRouter.get(
  "/accounting/trial-balance",
  requireRoles(accountingReadRoles),
  validateQuery(trialBalanceQuerySchema),
  accountingController.getTrialBalance
);

export default accountingRouter;
