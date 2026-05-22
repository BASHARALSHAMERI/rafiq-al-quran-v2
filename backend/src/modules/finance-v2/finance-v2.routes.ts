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
import { financeV2Controller } from "./finance-v2.controller";
import { expensesController } from "./controllers/expenses.controller";
import { assetsController } from "./controllers/assets.controller";
import {
  cashflowReportQuerySchema,
  cancelInvoiceV2BodySchema,
  createFundTransferBodySchema,
  createDonationBodySchema,
  createDonorBodySchema,
  createInvoiceV2BodySchema,
  createPaymentV2BodySchema,
  createPayrollBatchBodySchema,
  createPayrollProfileBodySchema,
  createRewardBatchBodySchema,
  createRewardProfileBodySchema,
  createStudentFeeProfileBodySchema,
  createVoucherBodySchema,
  financeV2EntityIdParamSchema,
  invoiceAgingReportQuerySchema,
  listAccountMovementsQuerySchema,
  listAccountsQuerySchema,
  listDonationsQuerySchema,
  listDonorsQuerySchema,
  listFundTransfersQuerySchema,
  listInvoicesV2QuerySchema,
  listPayrollBatchesQuerySchema,
  listPayrollProfilesQuerySchema,
  listRewardBatchesQuerySchema,
  listRewardProfilesQuerySchema,
  listStudentFeeProfilesQuerySchema,
  listVouchersQuerySchema,
  patchPolicyBodySchema,
  failPayrollItemBodySchema,
  failRewardItemBodySchema,
  payPayrollBatchBodySchema,
  payRewardBatchBodySchema,
  payrollReportQuerySchema,
  policyEffectiveQuerySchema,
  reportsDashboardQuerySchema,
  rewardsReportQuerySchema,
  transitionCommentBodySchema,
  receiveDonationBodySchema,
  updateFinanceAccountLedgerBodySchema,
  updatePayrollProfileBodySchema,
  updateDonorBodySchema,
  updateStudentFeeProfileBodySchema,
  vouchersReportQuerySchema,
  listSalaryGradesQuerySchema,
  createSalaryGradeBodySchema,
  updateSalaryGradeBodySchema,
  createCurrencyBodySchema,
  updateCurrencyBodySchema,
  listExchangeRatesQuerySchema,
  latestExchangeRateQuerySchema,
  createExchangeRateBodySchema
} from "./finance-v2.validation";

const financeV2Router = Router();

financeV2Router.use(authGuard, attachScope);

financeV2Router.get(
  "/finance/v2/policies/effective",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(policyEffectiveQuerySchema),
  financeV2Controller.getEffectivePolicy
);

financeV2Router.patch(
  "/finance/v2/policies/organization",
  requireRoles([Role.SUPER_ADMIN]),
  validateBody(patchPolicyBodySchema),
  financeV2Controller.patchOrganizationPolicy
);

financeV2Router.patch(
  "/finance/v2/policies/centers/:id",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(patchPolicyBodySchema),
  financeV2Controller.patchCenterPolicy
);

financeV2Router.get(
  "/finance/v2/student-fee-profiles",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(listStudentFeeProfilesQuerySchema),
  financeV2Controller.listStudentFeeProfiles
);

financeV2Router.post(
  "/finance/v2/student-fee-profiles",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createStudentFeeProfileBodySchema),
  financeV2Controller.createStudentFeeProfile
);

financeV2Router.patch(
  "/finance/v2/student-fee-profiles/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(updateStudentFeeProfileBodySchema),
  financeV2Controller.updateStudentFeeProfile
);

financeV2Router.get(
  "/finance/v2/invoices",
  requireRoles([
    Role.SUPER_ADMIN,
    Role.CENTER_ADMIN,
    Role.SUPERVISOR,
    Role.PARENT,
    Role.STUDENT
  ]),
  validateQuery(listInvoicesV2QuerySchema),
  financeV2Controller.listInvoices
);

financeV2Router.post(
  "/finance/v2/invoices",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createInvoiceV2BodySchema),
  financeV2Controller.createInvoice
);

financeV2Router.post(
  "/finance/v2/invoices/:id/cancel",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(cancelInvoiceV2BodySchema),
  financeV2Controller.cancelInvoice
);

financeV2Router.get(
  "/finance/v2/invoices/:id/payments",
  requireRoles([
    Role.SUPER_ADMIN,
    Role.CENTER_ADMIN,
    Role.SUPERVISOR,
    Role.PARENT,
    Role.STUDENT
  ]),
  validateParams(financeV2EntityIdParamSchema),
  financeV2Controller.listInvoicePayments
);

financeV2Router.post(
  "/finance/v2/payments",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createPaymentV2BodySchema),
  financeV2Controller.createPayment
);

financeV2Router.get(
  "/finance/v2/vouchers",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(listVouchersQuerySchema),
  financeV2Controller.listVouchers
);

financeV2Router.post(
  "/finance/v2/vouchers",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createVoucherBodySchema),
  financeV2Controller.createVoucher
);

financeV2Router.post(
  "/finance/v2/vouchers/:id/submit",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.submitVoucher
);

financeV2Router.post(
  "/finance/v2/vouchers/:id/approve",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.approveVoucher
);

financeV2Router.post(
  "/finance/v2/vouchers/:id/reject",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.rejectVoucher
);

financeV2Router.post(
  "/finance/v2/vouchers/:id/post",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.postVoucher
);

financeV2Router.post(
  "/finance/v2/vouchers/:id/void-request",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.requestVoucherVoid
);

financeV2Router.post(
  "/finance/v2/vouchers/:id/void-approve",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.approveVoucherVoid
);

financeV2Router.get(
  "/finance/donors",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(listDonorsQuerySchema),
  financeV2Controller.listDonors
);

financeV2Router.post(
  "/finance/donors",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createDonorBodySchema),
  financeV2Controller.createDonor
);

financeV2Router.get(
  "/finance/donors/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  financeV2Controller.getDonor
);

financeV2Router.patch(
  "/finance/donors/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(updateDonorBodySchema),
  financeV2Controller.updateDonor
);

financeV2Router.get(
  "/finance/donations",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(listDonationsQuerySchema),
  financeV2Controller.listDonations
);

financeV2Router.post(
  "/finance/donations",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createDonationBodySchema),
  financeV2Controller.createDonation
);

financeV2Router.post(
  "/finance/donations/:id/receive",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(receiveDonationBodySchema),
  financeV2Controller.receiveDonation
);

financeV2Router.get(
  "/finance/v2/accounts",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(listAccountsQuerySchema),
  financeV2Controller.listAccounts
);

financeV2Router.get(
  "/finance/v2/accounts/:id/movements",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateParams(financeV2EntityIdParamSchema),
  validateQuery(listAccountMovementsQuerySchema),
  financeV2Controller.listAccountMovements
);

financeV2Router.patch(
  "/finance/v2/accounts/:id/ledger-account",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(updateFinanceAccountLedgerBodySchema),
  financeV2Controller.updateAccountLedgerAccount
);

financeV2Router.get(
  "/finance/v2/fund-transfers",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(listFundTransfersQuerySchema),
  financeV2Controller.listFundTransfers
);

financeV2Router.post(
  "/finance/v2/fund-transfers",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createFundTransferBodySchema),
  financeV2Controller.createFundTransfer
);

financeV2Router.post(
  "/finance/v2/fund-transfers/:id/submit",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.submitFundTransfer
);

financeV2Router.post(
  "/finance/v2/fund-transfers/:id/approve",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.approveFundTransfer
);

financeV2Router.post(
  "/finance/v2/fund-transfers/:id/post",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.postFundTransfer
);

financeV2Router.get(
  "/finance/v2/payroll/profiles",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(listPayrollProfilesQuerySchema),
  financeV2Controller.listPayrollProfiles
);

financeV2Router.post(
  "/finance/v2/payroll/profiles",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createPayrollProfileBodySchema),
  financeV2Controller.createPayrollProfile
);

financeV2Router.patch(
  "/finance/v2/payroll/profiles/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(updatePayrollProfileBodySchema),
  financeV2Controller.updatePayrollProfile
);

financeV2Router.get(
  "/finance/v2/payroll/batches",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(listPayrollBatchesQuerySchema),
  financeV2Controller.listPayrollBatches
);

financeV2Router.post(
  "/finance/v2/payroll/batches",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createPayrollBatchBodySchema),
  financeV2Controller.createPayrollBatch
);

financeV2Router.post(
  "/finance/v2/payroll/batches/:id/submit",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.submitPayrollBatch
);

financeV2Router.post(
  "/finance/v2/payroll/batches/:id/approve",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.approvePayrollBatch
);

financeV2Router.post(
  "/finance/v2/payroll/batches/:id/reject",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.rejectPayrollBatch
);

financeV2Router.post(
  "/finance/v2/payroll/batches/:id/pay",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(payPayrollBatchBodySchema),
  financeV2Controller.payPayrollBatch
);

financeV2Router.post(
  "/finance/v2/payroll/items/:id/fail",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(failPayrollItemBodySchema),
  financeV2Controller.failPayrollItem
);

financeV2Router.get(
  "/finance/v2/reward/profiles",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(listRewardProfilesQuerySchema),
  financeV2Controller.listRewardProfiles
);

financeV2Router.post(
  "/finance/v2/reward/profiles",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createRewardProfileBodySchema),
  financeV2Controller.createRewardProfile
);

financeV2Router.get(
  "/finance/v2/reward/batches",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(listRewardBatchesQuerySchema),
  financeV2Controller.listRewardBatches
);

financeV2Router.post(
  "/finance/v2/reward/batches",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createRewardBatchBodySchema),
  financeV2Controller.createRewardBatch
);

financeV2Router.post(
  "/finance/v2/reward/batches/:id/submit",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.submitRewardBatch
);

financeV2Router.post(
  "/finance/v2/reward/batches/:id/approve",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.approveRewardBatch
);

financeV2Router.post(
  "/finance/v2/reward/batches/:id/reject",
  requireRoles([Role.SUPER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.rejectRewardBatch
);

financeV2Router.post(
  "/finance/v2/reward/batches/:id/pay",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(payRewardBatchBodySchema),
  financeV2Controller.payRewardBatch
);

financeV2Router.post(
  "/finance/v2/reward/items/:id/fail",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(failRewardItemBodySchema),
  financeV2Controller.failRewardItem
);

financeV2Router.get(
  "/finance/v2/approvals/pending",
  requireRoles([Role.SUPER_ADMIN]),
  financeV2Controller.listPendingApprovals
);

financeV2Router.get(
  "/finance/v2/reports/dashboard",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(reportsDashboardQuerySchema),
  financeV2Controller.reportDashboard
);

financeV2Router.get(
  "/finance/v2/reports/cashflow",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(cashflowReportQuerySchema),
  financeV2Controller.reportCashflow
);

financeV2Router.get(
  "/finance/v2/reports/payroll",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(payrollReportQuerySchema),
  financeV2Controller.reportPayroll
);

financeV2Router.get(
  "/finance/v2/reports/rewards",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(rewardsReportQuerySchema),
  financeV2Controller.reportRewards
);

financeV2Router.get(
  "/finance/v2/reports/vouchers",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(vouchersReportQuerySchema),
  financeV2Controller.reportVouchers
);

financeV2Router.get(
  "/finance/v2/reports/invoice-aging",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(invoiceAgingReportQuerySchema),
  financeV2Controller.reportInvoiceAging
);

financeV2Router.get(
  "/finance/v2/reports/financial-position",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(invoiceAgingReportQuerySchema),
  financeV2Controller.reportFinancialPosition
);

financeV2Router.get(
  "/finance/v2/reports/statement-of-activities",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(reportsDashboardQuerySchema),
  financeV2Controller.reportStatementOfActivities
);

// FA-CENTER-FINANCIAL-TRACKING-1: ملخص تمويل وتكلفة المراكز
financeV2Router.get(
  "/finance/v2/reports/center-funding",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(reportsDashboardQuerySchema),
  financeV2Controller.reportCenterFundingSummary
);

// FA-UX-4: Currencies
financeV2Router.get(
  "/finance/v2/currencies",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  financeV2Controller.listCurrencies
);

financeV2Router.get(
  "/finance/v2/currencies/predefined",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  financeV2Controller.getAvailablePredefinedCurrencies
);

financeV2Router.post(
  "/finance/v2/currencies",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createCurrencyBodySchema),
  financeV2Controller.createCurrency
);

financeV2Router.patch(
  "/finance/v2/currencies/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(updateCurrencyBodySchema),
  financeV2Controller.updateCurrency
);

financeV2Router.get(
  "/finance/v2/currencies/base",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  financeV2Controller.getBaseCurrency
);

// FA-UX-4: Exchange Rates
financeV2Router.get(
  "/finance/v2/exchange-rates",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(listExchangeRatesQuerySchema),
  financeV2Controller.listExchangeRates
);

financeV2Router.get(
  "/finance/v2/exchange-rates/latest",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateQuery(latestExchangeRateQuerySchema),
  financeV2Controller.getLatestExchangeRate
);

financeV2Router.post(
  "/finance/v2/exchange-rates",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createExchangeRateBodySchema),
  financeV2Controller.createExchangeRate
);

// ERP-PAY-1: Salary Scales
financeV2Router.get(
  "/finance/v2/salary-grades",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  validateQuery(listSalaryGradesQuerySchema),
  financeV2Controller.listSalaryGrades
);

financeV2Router.post(
  "/finance/v2/salary-grades",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateBody(createSalaryGradeBodySchema),
  financeV2Controller.createSalaryGrade
);

financeV2Router.patch(
  "/finance/v2/salary-grades/:id",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(updateSalaryGradeBodySchema),
  financeV2Controller.updateSalaryGrade
);

// HR-PAYROLL-UX-COMPLETE: eligible employees for payroll profile creation
financeV2Router.get(
  "/finance/v2/payroll/eligible-employees",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  financeV2Controller.getEligibleEmployees
);

// FA-EXPENSES-AP-1: Expenses and Accounts Payable

financeV2Router.get(
  "/finance/v2/suppliers",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  expensesController.listSuppliers
);

financeV2Router.post(
  "/finance/v2/suppliers",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  expensesController.createSupplier
);

financeV2Router.get(
  "/finance/v2/expense-categories",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  expensesController.listExpenseCategories
);

financeV2Router.post(
  "/finance/v2/expense-categories",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  expensesController.createExpenseCategory
);

financeV2Router.get(
  "/finance/v2/expenses",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  expensesController.listExpenseInvoices
);

financeV2Router.post(
  "/finance/v2/expenses",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  expensesController.createExpenseInvoice
);

financeV2Router.post(
  "/finance/v2/expenses/:id/approve",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  expensesController.approveExpenseInvoice
);

financeV2Router.post(
  "/finance/v2/expenses/:id/pay",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  expensesController.payExpenseInvoice
);

// FA-ASSETS-1: Fixed assets and custody register
financeV2Router.get(
  "/finance/v2/asset-categories",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  assetsController.listAssetCategories
);

financeV2Router.post(
  "/finance/v2/asset-categories",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  assetsController.createAssetCategory
);

financeV2Router.get(
  "/finance/v2/assets",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  assetsController.listFixedAssets
);

financeV2Router.post(
  "/finance/v2/assets",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  assetsController.createFixedAsset
);

financeV2Router.get(
  "/finance/v2/asset-custody",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR]),
  assetsController.listCustodyLogs
);

financeV2Router.post(
  "/finance/v2/assets/:id/custody",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  assetsController.assignCustody
);

financeV2Router.post(
  "/finance/v2/assets/:id/post-acquisition",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  assetsController.postAssetAcquisition
);

financeV2Router.post(
  "/finance/v2/assets/:id/post-depreciation",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  assetsController.postAssetDepreciation
);

financeV2Router.post(
  "/finance/v2/assets/:id/acquire",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  assetsController.postAssetAcquisition
);

financeV2Router.post(
  "/finance/v2/assets/:id/depreciate",
  requireRoles([Role.SUPER_ADMIN, Role.CENTER_ADMIN]),
  assetsController.postAssetDepreciation
);

export default financeV2Router;
