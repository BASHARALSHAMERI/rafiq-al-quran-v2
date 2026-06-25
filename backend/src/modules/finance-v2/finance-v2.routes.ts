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
import { disableConditionalCache } from "./finance-v2.cache";
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
  donationReportQuerySchema,
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
  receiptsReportQuerySchema,
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
const financeReadRoles = [
  Role.SUPER_ADMIN,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER,
  Role.TREASURER,
  Role.AUDITOR,
  Role.SUPERVISOR
];
const financeBillingReadRoles = [
  Role.SUPER_ADMIN,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER,
  Role.TREASURER,
  Role.AUDITOR,
  Role.SUPERVISOR,
  Role.PARENT,
  Role.STUDENT
];
const financeAdminReadRoles = [
  Role.SUPER_ADMIN,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER,
  Role.TREASURER,
  Role.AUDITOR
];
const financeDraftWriteRoles = [
  Role.SUPER_ADMIN,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER
];
const financeCashWriteRoles = [
  Role.SUPER_ADMIN,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER,
  Role.TREASURER
];
const financeApprovalRoles = [Role.SUPER_ADMIN, Role.FINANCE_MANAGER];
const financeSettingsWriteRoles = [Role.SUPER_ADMIN, Role.FINANCE_MANAGER];

financeV2Router.use(authGuard, attachScope);

financeV2Router.get(
  "/finance/v2/policies/effective",
  requireRoles(financeReadRoles),
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
  requireRoles(financeReadRoles),
  validateQuery(listStudentFeeProfilesQuerySchema),
  financeV2Controller.listStudentFeeProfiles
);

financeV2Router.post(
  "/finance/v2/student-fee-profiles",
  requireRoles(financeSettingsWriteRoles),
  validateBody(createStudentFeeProfileBodySchema),
  financeV2Controller.createStudentFeeProfile
);

financeV2Router.patch(
  "/finance/v2/student-fee-profiles/:id",
  requireRoles(financeSettingsWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(updateStudentFeeProfileBodySchema),
  financeV2Controller.updateStudentFeeProfile
);

financeV2Router.get(
  "/finance/v2/invoices",
  requireRoles(financeBillingReadRoles),
  validateQuery(listInvoicesV2QuerySchema),
  financeV2Controller.listInvoices
);

financeV2Router.post(
  "/finance/v2/invoices",
  requireRoles(financeDraftWriteRoles),
  validateBody(createInvoiceV2BodySchema),
  financeV2Controller.createInvoice
);

financeV2Router.post(
  "/finance/v2/invoices/:id/cancel",
  requireRoles(financeApprovalRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(cancelInvoiceV2BodySchema),
  financeV2Controller.cancelInvoice
);

financeV2Router.get(
  "/finance/v2/invoices/:id/payments",
  requireRoles(financeBillingReadRoles),
  validateParams(financeV2EntityIdParamSchema),
  financeV2Controller.listInvoicePayments
);

financeV2Router.post(
  "/finance/v2/payments",
  requireRoles(financeCashWriteRoles),
  validateBody(createPaymentV2BodySchema),
  financeV2Controller.createPayment
);

financeV2Router.get(
  "/finance/v2/vouchers",
  requireRoles(financeReadRoles),
  validateQuery(listVouchersQuerySchema),
  financeV2Controller.listVouchers
);

financeV2Router.post(
  "/finance/v2/vouchers",
  requireRoles(financeDraftWriteRoles),
  validateBody(createVoucherBodySchema),
  financeV2Controller.createVoucher
);

financeV2Router.post(
  "/finance/v2/vouchers/:id/submit",
  requireRoles(financeDraftWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.submitVoucher
);

financeV2Router.post(
  "/finance/v2/vouchers/:id/approve",
  requireRoles(financeApprovalRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.approveVoucher
);

financeV2Router.post(
  "/finance/v2/vouchers/:id/reject",
  requireRoles(financeApprovalRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.rejectVoucher
);

financeV2Router.post(
  "/finance/v2/vouchers/:id/post",
  requireRoles(financeCashWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.postVoucher
);

financeV2Router.post(
  "/finance/v2/vouchers/:id/void-request",
  requireRoles(financeDraftWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.requestVoucherVoid
);

financeV2Router.post(
  "/finance/v2/vouchers/:id/void-approve",
  requireRoles(financeApprovalRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.approveVoucherVoid
);

financeV2Router.get(
  "/finance/donors",
  requireRoles(financeAdminReadRoles),
  validateQuery(listDonorsQuerySchema),
  financeV2Controller.listDonors
);

financeV2Router.post(
  "/finance/donors",
  requireRoles(financeDraftWriteRoles),
  validateBody(createDonorBodySchema),
  financeV2Controller.createDonor
);

financeV2Router.get(
  "/finance/donors/:id",
  requireRoles(financeAdminReadRoles),
  validateParams(financeV2EntityIdParamSchema),
  financeV2Controller.getDonor
);

financeV2Router.patch(
  "/finance/donors/:id",
  requireRoles(financeDraftWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(updateDonorBodySchema),
  financeV2Controller.updateDonor
);

financeV2Router.get(
  "/finance/donations",
  requireRoles(financeAdminReadRoles),
  validateQuery(listDonationsQuerySchema),
  financeV2Controller.listDonations
);

financeV2Router.post(
  "/finance/donations",
  requireRoles(financeDraftWriteRoles),
  validateBody(createDonationBodySchema),
  financeV2Controller.createDonation
);

financeV2Router.post(
  "/finance/donations/:id/receive",
  requireRoles(financeCashWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(receiveDonationBodySchema),
  financeV2Controller.receiveDonation
);

financeV2Router.get(
  "/finance/v2/accounts",
  requireRoles(financeReadRoles),
  validateQuery(listAccountsQuerySchema),
  financeV2Controller.listAccounts
);

financeV2Router.get(
  "/finance/v2/accounts/:id/movements",
  requireRoles(financeReadRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateQuery(listAccountMovementsQuerySchema),
  financeV2Controller.listAccountMovements
);

financeV2Router.patch(
  "/finance/v2/accounts/:id/ledger-account",
  requireRoles(financeSettingsWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(updateFinanceAccountLedgerBodySchema),
  financeV2Controller.updateAccountLedgerAccount
);

financeV2Router.get(
  "/finance/v2/fund-transfers",
  requireRoles(financeReadRoles),
  validateQuery(listFundTransfersQuerySchema),
  financeV2Controller.listFundTransfers
);

financeV2Router.post(
  "/finance/v2/fund-transfers",
  requireRoles(financeDraftWriteRoles),
  validateBody(createFundTransferBodySchema),
  financeV2Controller.createFundTransfer
);

financeV2Router.post(
  "/finance/v2/fund-transfers/:id/submit",
  requireRoles(financeDraftWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.submitFundTransfer
);

financeV2Router.post(
  "/finance/v2/fund-transfers/:id/approve",
  requireRoles(financeApprovalRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.approveFundTransfer
);

financeV2Router.post(
  "/finance/v2/fund-transfers/:id/post",
  requireRoles([Role.SUPER_ADMIN, Role.FINANCE_MANAGER, Role.TREASURER]),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.postFundTransfer
);

financeV2Router.get(
  "/finance/v2/payroll/profiles",
  requireRoles(financeReadRoles),
  validateQuery(listPayrollProfilesQuerySchema),
  financeV2Controller.listPayrollProfiles
);

financeV2Router.post(
  "/finance/v2/payroll/profiles",
  requireRoles(financeSettingsWriteRoles),
  validateBody(createPayrollProfileBodySchema),
  financeV2Controller.createPayrollProfile
);

financeV2Router.patch(
  "/finance/v2/payroll/profiles/:id",
  requireRoles(financeSettingsWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(updatePayrollProfileBodySchema),
  financeV2Controller.updatePayrollProfile
);

financeV2Router.get(
  "/finance/v2/payroll/batches",
  requireRoles(financeReadRoles),
  validateQuery(listPayrollBatchesQuerySchema),
  financeV2Controller.listPayrollBatches
);

financeV2Router.post(
  "/finance/v2/payroll/batches",
  requireRoles(financeDraftWriteRoles),
  validateBody(createPayrollBatchBodySchema),
  financeV2Controller.createPayrollBatch
);

financeV2Router.post(
  "/finance/v2/payroll/batches/:id/submit",
  requireRoles(financeDraftWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.submitPayrollBatch
);

financeV2Router.post(
  "/finance/v2/payroll/batches/:id/approve",
  requireRoles(financeApprovalRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.approvePayrollBatch
);

financeV2Router.post(
  "/finance/v2/payroll/batches/:id/reject",
  requireRoles(financeApprovalRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.rejectPayrollBatch
);

financeV2Router.post(
  "/finance/v2/payroll/batches/:id/pay",
  requireRoles(financeCashWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(payPayrollBatchBodySchema),
  financeV2Controller.payPayrollBatch
);

financeV2Router.post(
  "/finance/v2/payroll/items/:id/fail",
  requireRoles(financeCashWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(failPayrollItemBodySchema),
  financeV2Controller.failPayrollItem
);

financeV2Router.get(
  "/finance/v2/reward/profiles",
  requireRoles(financeReadRoles),
  validateQuery(listRewardProfilesQuerySchema),
  financeV2Controller.listRewardProfiles
);

financeV2Router.post(
  "/finance/v2/reward/profiles",
  requireRoles(financeSettingsWriteRoles),
  validateBody(createRewardProfileBodySchema),
  financeV2Controller.createRewardProfile
);

financeV2Router.get(
  "/finance/v2/reward/batches",
  requireRoles(financeReadRoles),
  validateQuery(listRewardBatchesQuerySchema),
  financeV2Controller.listRewardBatches
);

financeV2Router.post(
  "/finance/v2/reward/batches",
  requireRoles(financeDraftWriteRoles),
  validateBody(createRewardBatchBodySchema),
  financeV2Controller.createRewardBatch
);

financeV2Router.post(
  "/finance/v2/reward/batches/:id/submit",
  requireRoles(financeDraftWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.submitRewardBatch
);

financeV2Router.post(
  "/finance/v2/reward/batches/:id/approve",
  requireRoles(financeApprovalRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.approveRewardBatch
);

financeV2Router.post(
  "/finance/v2/reward/batches/:id/reject",
  requireRoles(financeApprovalRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(transitionCommentBodySchema),
  financeV2Controller.rejectRewardBatch
);

financeV2Router.post(
  "/finance/v2/reward/batches/:id/pay",
  requireRoles(financeCashWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(payRewardBatchBodySchema),
  financeV2Controller.payRewardBatch
);

financeV2Router.post(
  "/finance/v2/reward/items/:id/fail",
  requireRoles(financeCashWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(failRewardItemBodySchema),
  financeV2Controller.failRewardItem
);

financeV2Router.get(
  "/finance/v2/approvals/pending",
  requireRoles(financeApprovalRoles),
  financeV2Controller.listPendingApprovals
);

financeV2Router.get(
  "/finance/v2/reports/dashboard",
  requireRoles(financeReadRoles),
  validateQuery(reportsDashboardQuerySchema),
  financeV2Controller.reportDashboard
);

financeV2Router.get(
  "/finance/v2/reports/cashflow",
  requireRoles(financeReadRoles),
  validateQuery(cashflowReportQuerySchema),
  financeV2Controller.reportCashflow
);

financeV2Router.get(
  "/finance/v2/reports/payroll",
  requireRoles(financeReadRoles),
  validateQuery(payrollReportQuerySchema),
  financeV2Controller.reportPayroll
);

financeV2Router.get(
  "/finance/v2/reports/rewards",
  requireRoles(financeReadRoles),
  validateQuery(rewardsReportQuerySchema),
  financeV2Controller.reportRewards
);

financeV2Router.get(
  "/finance/v2/reports/vouchers",
  requireRoles(financeReadRoles),
  validateQuery(vouchersReportQuerySchema),
  financeV2Controller.reportVouchers
);

financeV2Router.get(
  "/finance/v2/reports/receipts",
  requireRoles(financeReadRoles),
  validateQuery(receiptsReportQuerySchema),
  financeV2Controller.reportReceipts
);

financeV2Router.get(
  "/finance/v2/reports/invoice-aging",
  requireRoles(financeReadRoles),
  validateQuery(invoiceAgingReportQuerySchema),
  financeV2Controller.reportInvoiceAging
);

financeV2Router.get(
  "/finance/v2/reports/financial-position",
  requireRoles(financeReadRoles),
  validateQuery(invoiceAgingReportQuerySchema),
  financeV2Controller.reportFinancialPosition
);

financeV2Router.get(
  "/finance/v2/reports/statement-of-activities",
  requireRoles(financeReadRoles),
  validateQuery(reportsDashboardQuerySchema),
  financeV2Controller.reportStatementOfActivities
);

// FA-CENTER-FINANCIAL-TRACKING-1: ملخص تمويل وتكلفة المراكز
financeV2Router.get(
  "/finance/v2/reports/center-funding",
  requireRoles(financeReadRoles),
  disableConditionalCache,
  validateQuery(reportsDashboardQuerySchema),
  financeV2Controller.reportCenterFundingSummary
);

// ─── Donation Report ───
const donationReportRoles: Role[] = [
  Role.SUPER_ADMIN,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER,
  Role.AUDITOR
];
financeV2Router.get(
  "/finance/v2/reports/donations",
  requireRoles(donationReportRoles),
  validateQuery(donationReportQuerySchema),
  financeV2Controller.getDonationReport
);

// FA-UX-4: Currencies
financeV2Router.get(
  "/finance/v2/currencies",
  requireRoles(financeAdminReadRoles),
  financeV2Controller.listCurrencies
);

financeV2Router.get(
  "/finance/v2/currencies/predefined",
  requireRoles(financeAdminReadRoles),
  financeV2Controller.getAvailablePredefinedCurrencies
);

financeV2Router.post(
  "/finance/v2/currencies",
  requireRoles(financeSettingsWriteRoles),
  validateBody(createCurrencyBodySchema),
  financeV2Controller.createCurrency
);

financeV2Router.patch(
  "/finance/v2/currencies/:id",
  requireRoles(financeSettingsWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(updateCurrencyBodySchema),
  financeV2Controller.updateCurrency
);

financeV2Router.get(
  "/finance/v2/currencies/base",
  requireRoles(financeAdminReadRoles),
  financeV2Controller.getBaseCurrency
);

// FA-UX-4: Exchange Rates
financeV2Router.get(
  "/finance/v2/exchange-rates",
  requireRoles(financeAdminReadRoles),
  validateQuery(listExchangeRatesQuerySchema),
  financeV2Controller.listExchangeRates
);

financeV2Router.get(
  "/finance/v2/exchange-rates/latest",
  requireRoles(financeAdminReadRoles),
  validateQuery(latestExchangeRateQuerySchema),
  financeV2Controller.getLatestExchangeRate
);

financeV2Router.post(
  "/finance/v2/exchange-rates",
  requireRoles(financeSettingsWriteRoles),
  validateBody(createExchangeRateBodySchema),
  financeV2Controller.createExchangeRate
);

// ERP-PAY-1: Salary Scales
financeV2Router.get(
  "/finance/v2/salary-grades",
  requireRoles(financeAdminReadRoles),
  validateQuery(listSalaryGradesQuerySchema),
  financeV2Controller.listSalaryGrades
);

financeV2Router.post(
  "/finance/v2/salary-grades",
  requireRoles(financeSettingsWriteRoles),
  validateBody(createSalaryGradeBodySchema),
  financeV2Controller.createSalaryGrade
);

financeV2Router.patch(
  "/finance/v2/salary-grades/:id",
  requireRoles(financeSettingsWriteRoles),
  validateParams(financeV2EntityIdParamSchema),
  validateBody(updateSalaryGradeBodySchema),
  financeV2Controller.updateSalaryGrade
);

// HR-PAYROLL-UX-COMPLETE: eligible employees for payroll profile creation
financeV2Router.get(
  "/finance/v2/payroll/eligible-employees",
  requireRoles(financeReadRoles),
  financeV2Controller.getEligibleEmployees
);

// FA-EXPENSES-AP-1: Expenses and Accounts Payable

financeV2Router.get(
  "/finance/v2/suppliers",
  requireRoles(financeReadRoles),
  expensesController.listSuppliers
);

financeV2Router.post(
  "/finance/v2/suppliers",
  requireRoles(financeDraftWriteRoles),
  expensesController.createSupplier
);

financeV2Router.get(
  "/finance/v2/expense-categories",
  requireRoles(financeReadRoles),
  expensesController.listExpenseCategories
);

financeV2Router.post(
  "/finance/v2/expense-categories",
  requireRoles(financeSettingsWriteRoles),
  expensesController.createExpenseCategory
);

financeV2Router.get(
  "/finance/v2/expenses",
  requireRoles(financeReadRoles),
  expensesController.listExpenseInvoices
);

financeV2Router.post(
  "/finance/v2/expenses",
  requireRoles(financeDraftWriteRoles),
  expensesController.createExpenseInvoice
);

financeV2Router.post(
  "/finance/v2/expenses/:id/approve",
  requireRoles(financeApprovalRoles),
  expensesController.approveExpenseInvoice
);

financeV2Router.post(
  "/finance/v2/expenses/:id/pay",
  requireRoles(financeCashWriteRoles),
  expensesController.payExpenseInvoice
);

// FA-ASSETS-1: Fixed assets and custody register
financeV2Router.get(
  "/finance/v2/asset-categories",
  requireRoles(financeReadRoles),
  assetsController.listAssetCategories
);

financeV2Router.post(
  "/finance/v2/asset-categories",
  requireRoles(financeSettingsWriteRoles),
  assetsController.createAssetCategory
);

financeV2Router.get(
  "/finance/v2/assets",
  requireRoles(financeReadRoles),
  assetsController.listFixedAssets
);

financeV2Router.post(
  "/finance/v2/assets",
  requireRoles(financeDraftWriteRoles),
  assetsController.createFixedAsset
);

financeV2Router.get(
  "/finance/v2/asset-custody",
  requireRoles(financeReadRoles),
  assetsController.listCustodyLogs
);

financeV2Router.post(
  "/finance/v2/assets/:id/custody",
  requireRoles(financeDraftWriteRoles),
  assetsController.assignCustody
);

financeV2Router.post(
  "/finance/v2/assets/:id/post-acquisition",
  requireRoles(financeCashWriteRoles),
  assetsController.postAssetAcquisition
);

financeV2Router.post(
  "/finance/v2/assets/:id/post-depreciation",
  requireRoles(financeCashWriteRoles),
  assetsController.postAssetDepreciation
);

financeV2Router.post(
  "/finance/v2/assets/:id/acquire",
  requireRoles(financeCashWriteRoles),
  assetsController.postAssetAcquisition
);

financeV2Router.post(
  "/finance/v2/assets/:id/depreciate",
  requireRoles(financeCashWriteRoles),
  assetsController.postAssetDepreciation
);

export default financeV2Router;
