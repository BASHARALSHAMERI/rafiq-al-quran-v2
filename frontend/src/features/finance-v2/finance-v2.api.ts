import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type {
  CreateFundTransferV2Payload,
  CreateFinanceDonationV2Payload,
  CreateFinanceDonorV2Payload,
  CreateFinanceVoucherV2Payload,
  CreateRewardBatchV2Payload,
  CreateRewardProfileV2Payload,
  CreatePayrollBatchV2Payload,
  CreatePayrollProfileV2Payload,
  CreateFinanceInvoiceV2Payload,
  CreateFinancePaymentV2Payload,
  FinanceFundTransferV2,
  FinanceAccountV2,
  FinanceDonationV2,
  FinanceDonationsV2Query,
  FinanceDonorV2,
  FinanceDonorsV2Query,
  FinanceInvoiceV2,
  FinanceInvoicesV2Query,
  FinancePaymentV2,
  FinanceReportCashflowV2,
  FinanceReportDashboardV2,
  FinanceReportInvoiceAgingV2,
  FinanceReportPayrollV2,
  FinanceReportRewardsV2,
  FinanceReportVouchersV2,
  FinanceReportCenterFundingV2,
  FinanceVoucherV2,
  PaginatedRows,
  PayrollItemV2,
  PayrollBatchV2,
  PayrollProfileV2,
  PendingApprovalsV2,
  ReceiveFinanceDonationV2Payload,
  RewardItemV2,
  RewardBatchV2,
  RewardProfileV2,
  // FA-UX-4: Currencies
  CurrencyV2,
  PredefinedCurrencyV2,
  CreateCurrencyV2Payload,
  ExchangeRateV2,
  CreateExchangeRateV2Payload,
  SalaryGradeV2,
  CreateSalaryGradeV2Payload,
  UpdateSalaryGradeV2Payload,
  EligibleEmployeeV2,
  UpdatePayrollProfileV2Payload,
  AssetCategoryV2,
  FixedAssetV2,
  AssetCustodyLogV2,
  CreateAssetCategoryV2Payload,
  CreateFixedAssetV2Payload,
  AssignAssetCustodyV2Payload,
  FinanceReportFinancialPositionV2,
  FinanceReportStatementOfActivitiesV2,
  FinancialPositionItemV2
} from "./types";

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeInvoice = (invoice: FinanceInvoiceV2): FinanceInvoiceV2 => ({
  ...invoice,
  id: Number(invoice.id),
  studentId: Number(invoice.studentId),
  centerId: Number(invoice.centerId),
  month: Number(invoice.month),
  year: Number(invoice.year),
  amount: toNumber(invoice.amount),
  totalPaid: toNumber(invoice.totalPaid),
  remainingAmount: toNumber(invoice.remainingAmount),
  paymentsCount: Number(invoice.paymentsCount ?? 0)
});

const normalizePayment = (payment: FinancePaymentV2): FinancePaymentV2 => ({
  ...payment,
  id: Number(payment.id),
  invoiceId: Number(payment.invoiceId),
  amount: toNumber(payment.amount),
  voucherId: payment.voucherId === null || payment.voucherId === undefined ? null : Number(payment.voucherId),
  receivedById: Number(payment.receivedById)
});

import type { SupplierV2, ExpenseCategoryV2, ExpenseInvoiceV2 } from './types';
const normalizeVoucher = (voucher: FinanceVoucherV2): FinanceVoucherV2 => ({
  ...voucher,
  id: Number(voucher.id),
  accountId:
    voucher.accountId === null || voucher.accountId === undefined
      ? undefined
      : Number(voucher.accountId),
  centerId: voucher.centerId === null || voucher.centerId === undefined ? null : Number(voucher.centerId),
  amount: toNumber(voucher.amount),
  // FA-UX-4B: keep nullables as null when missing so UI can detect foreign-currency vouchers reliably.
  originalAmount:
    voucher.originalAmount === null || voucher.originalAmount === undefined
      ? null
      : toNumber(voucher.originalAmount),
  originalCurrencyCode:
    typeof voucher.originalCurrencyCode === "string" && voucher.originalCurrencyCode
      ? voucher.originalCurrencyCode
      : null,
  exchangeRateToBase:
    voucher.exchangeRateToBase === null || voucher.exchangeRateToBase === undefined
      ? null
      : toNumber(voucher.exchangeRateToBase)
});

const normalizeAccount = (account: FinanceAccountV2): FinanceAccountV2 => ({
  ...account,
  id: Number(account.id),
  centerId: account.centerId === null || account.centerId === undefined ? null : Number(account.centerId),
  accountingAccountId:
    account.accountingAccountId === null || account.accountingAccountId === undefined
      ? null
      : Number(account.accountingAccountId),
  openingBalance: toNumber(account.openingBalance),
  currentBalance: toNumber(account.currentBalance)
});

const normalizeDonor = (donor: FinanceDonorV2): FinanceDonorV2 => ({
  ...donor,
  id: Number(donor.id),
  organizationId: Number(donor.organizationId),
  centerId: donor.centerId === null || donor.centerId === undefined ? null : Number(donor.centerId),
  isActive: Boolean(donor.isActive),
  donations: (donor.donations ?? []).map((donation) => ({
    ...donation,
    id: Number(donation.id),
    amount: toNumber(donation.amount)
  }))
});

const normalizeDonation = (donation: FinanceDonationV2): FinanceDonationV2 => ({
  ...donation,
  id: Number(donation.id),
  organizationId: Number(donation.organizationId),
  centerId: donation.centerId === null || donation.centerId === undefined ? null : Number(donation.centerId),
  donorId: Number(donation.donorId),
  amount: toNumber(donation.amount),
  // FA-UX-4B: optional currency fields used for display/print only.
  originalAmount:
    donation.originalAmount === null || donation.originalAmount === undefined
      ? null
      : toNumber(donation.originalAmount),
  originalCurrencyCode:
    typeof donation.originalCurrencyCode === "string" && donation.originalCurrencyCode
      ? donation.originalCurrencyCode
      : null,
  exchangeRateToBase:
    donation.exchangeRateToBase === null || donation.exchangeRateToBase === undefined
      ? null
      : toNumber(donation.exchangeRateToBase),
  voucherId: donation.voucherId === null || donation.voucherId === undefined ? null : Number(donation.voucherId),
  isPledge: Boolean(donation.isPledge)
});

const normalizePayrollBatch = (batch: PayrollBatchV2): PayrollBatchV2 => ({
  ...batch,
  id: Number(batch.id),
  centerId: batch.centerId === null || batch.centerId === undefined ? null : Number(batch.centerId),
  periodYear: Number(batch.periodYear),
  periodMonth: Number(batch.periodMonth),
  totalItems: Number(batch.totalItems),
  totalNetAmount: toNumber(batch.totalNetAmount),
  items: Array.isArray(batch.items)
    ? batch.items.map((item) => normalizePayrollItem(item))
    : []
});

const normalizePayrollItem = (item: PayrollItemV2): PayrollItemV2 => ({
  ...item,
  id: Number(item.id),
  beneficiaryUserId: Number(item.beneficiaryUserId),
  baseAmount: toNumber(item.baseAmount),
  bonusAmount: toNumber(item.bonusAmount),
  deductionAmount: toNumber(item.deductionAmount),
  deductionEventIds: Array.isArray(item.deductionEventIds) ? item.deductionEventIds.map(Number) : null,
  netAmount: toNumber(item.netAmount),
  paymentMethod: item.paymentMethod ?? null,
  paymentReference: item.paymentReference ?? null,
  failureReason: item.failureReason ?? null,
  voucherId: item.voucherId === null || item.voucherId === undefined ? null : Number(item.voucherId),
  voucher: item.voucher ?? null
});

const normalizePayrollProfile = (profile: PayrollProfileV2): PayrollProfileV2 => ({
  ...profile,
  id: Number(profile.id),
  centerId: profile.centerId === null || profile.centerId === undefined ? null : Number(profile.centerId),
  userId: Number(profile.userId),
  monthlyBaseAmount: toNumber(profile.monthlyBaseAmount),
  salaryCurrencyCode: profile.salaryCurrencyCode || "YER",
  bankAccountNumber:
    typeof profile.bankAccountNumber === "string" ? profile.bankAccountNumber : null,
  bankName: typeof profile.bankName === "string" ? profile.bankName : null,
  iban: typeof profile.iban === "string" ? profile.iban : null
});

const normalizeRewardBatch = (batch: RewardBatchV2): RewardBatchV2 => ({
  ...batch,
  id: Number(batch.id),
  centerId: batch.centerId === null || batch.centerId === undefined ? null : Number(batch.centerId),
  periodYear: Number(batch.periodYear),
  periodMonth: batch.periodMonth === null || batch.periodMonth === undefined ? null : Number(batch.periodMonth),
  periodQuarter:
    batch.periodQuarter === null || batch.periodQuarter === undefined ? null : Number(batch.periodQuarter),
  totalItems: Number(batch.totalItems),
  totalAmount: toNumber(batch.totalAmount),
  items: Array.isArray(batch.items) ? batch.items.map((item) => normalizeRewardItem(item)) : []
});

const normalizeRewardItem = (item: RewardItemV2): RewardItemV2 => ({
  ...item,
  id: Number(item.id),
  beneficiaryUserId: Number(item.beneficiaryUserId),
  centerId: Number(item.centerId),
  circleId: item.circleId === null || item.circleId === undefined ? null : Number(item.circleId),
  amount: toNumber(item.amount),
  rankInCircle:
    item.rankInCircle === null || item.rankInCircle === undefined ? null : Number(item.rankInCircle),
  rewardType: item.rewardType ?? null,
  paymentMethod: item.paymentMethod ?? null,
  paymentReference: item.paymentReference ?? null,
  failureReason: item.failureReason ?? null,
  voucherId: item.voucherId === null || item.voucherId === undefined ? null : Number(item.voucherId),
  voucher: item.voucher ?? null
});

const normalizeRewardProfile = (profile: RewardProfileV2): RewardProfileV2 => ({
  ...profile,
  id: Number(profile.id),
  centerId: profile.centerId === null || profile.centerId === undefined ? null : Number(profile.centerId),
  beneficiaryUserId: Number(profile.beneficiaryUserId),
  defaultAmount: toNumber(profile.defaultAmount)
});

const normalizeFundTransfer = (transfer: FinanceFundTransferV2): FinanceFundTransferV2 => ({
  ...transfer,
  id: Number(transfer.id),
  fromAccountId: Number(transfer.fromAccountId),
  toAccountId: Number(transfer.toAccountId),
  fromCenterId:
    transfer.fromCenterId === null || transfer.fromCenterId === undefined
      ? null
      : Number(transfer.fromCenterId),
  toCenterId:
    transfer.toCenterId === null || transfer.toCenterId === undefined ? null : Number(transfer.toCenterId),
  amount: toNumber(transfer.amount),
  requestedById: Number(transfer.requestedById),
  approvedById:
    transfer.approvedById === null || transfer.approvedById === undefined
      ? null
      : Number(transfer.approvedById),
  voucherOutId:
    transfer.voucherOutId === null || transfer.voucherOutId === undefined
      ? null
      : Number(transfer.voucherOutId),
  voucherInId:
    transfer.voucherInId === null || transfer.voucherInId === undefined
      ? null
      : Number(transfer.voucherInId)
});

const normalizeDashboardReport = (report: FinanceReportDashboardV2): FinanceReportDashboardV2 => ({
  ...report,
  kpis: {
    totalInvoicesCount: Number(report.kpis.totalInvoicesCount ?? 0),
    totalInvoiced: toNumber(report.kpis.totalInvoiced),
    totalCollected: toNumber(report.kpis.totalCollected),
    outstanding: toNumber(report.kpis.outstanding),
    collectionRate: toNumber(report.kpis.collectionRate),
    totalCashBalance: toNumber(report.kpis.totalCashBalance)
  }
});

const normalizeCashflowReport = (report: FinanceReportCashflowV2): FinanceReportCashflowV2 => ({
  ...report,
  openingBalance: toNumber(report.openingBalance),
  totalIn: toNumber(report.totalIn),
  totalOut: toNumber(report.totalOut),
  closingBalance: toNumber(report.closingBalance),
  rows: (report.rows ?? []).map((row) => ({
    ...row,
    id: Number(row.id),
    accountId: Number(row.accountId),
    voucherId: Number(row.voucherId),
    amount: toNumber(row.amount),
    balanceBefore: toNumber(row.balanceBefore),
    balanceAfter: toNumber(row.balanceAfter)
  }))
});

const normalizePayrollReport = (report: FinanceReportPayrollV2): FinanceReportPayrollV2 => ({
  ...report,
  rows: (report.rows ?? []).map((row) => normalizePayrollBatch(row)),
  kpis: {
    totalBatches: Number(report.kpis.totalBatches ?? 0),
    approvedPayroll: toNumber(report.kpis.approvedPayroll),
    paidPayroll: toNumber(report.kpis.paidPayroll),
    executionRate: toNumber(report.kpis.executionRate)
  }
});

const normalizeRewardsReport = (report: FinanceReportRewardsV2): FinanceReportRewardsV2 => ({
  ...report,
  rows: (report.rows ?? []).map((row) => normalizeRewardBatch(row)),
  kpis: {
    totalBatches: Number(report.kpis.totalBatches ?? 0),
    approvedRewards: toNumber(report.kpis.approvedRewards),
    paidRewards: toNumber(report.kpis.paidRewards),
    executionRate: toNumber(report.kpis.executionRate)
  }
});

const normalizeVouchersReport = (report: FinanceReportVouchersV2): FinanceReportVouchersV2 => ({
  ...report,
  rows: (report.rows ?? []).map((row) => normalizeVoucher(row)),
  kpis: {
    totalVouchers: Number(report.kpis.totalVouchers ?? 0),
    receipts: toNumber(report.kpis.receipts),
    disbursements: toNumber(report.kpis.disbursements)
  }
});

const normalizeAgingReport = (report: FinanceReportInvoiceAgingV2): FinanceReportInvoiceAgingV2 => ({
  ...report,
  rows: (report.rows ?? []).map((row) => ({
    ...normalizeInvoice(row),
    daysPastDue: Number(row.daysPastDue ?? 0),
    bucket: row.bucket
  })),
  kpis: {
    totalOutstanding: toNumber(report.kpis.totalOutstanding),
    bucket0to30: toNumber(report.kpis.bucket0to30),
    bucket31to60: toNumber(report.kpis.bucket31to60),
    bucket61Plus: toNumber(report.kpis.bucket61Plus)
  }
});

// FA-CENTER-FINANCIAL-TRACKING-1: shape actually returned by GET /finance/v2/reports/center-funding
type CenterFundingApiRow = {
  centerId: number | string;
  centerName: string;
  funding?: {
    studentFees?: number | string;
    donations?: number | string;
    otherRevenue?: number | string;
    totalFunding?: number | string;
  };
  cost?: {
    payrollExpense?: number | string;
    operatingExpense?: number | string;
    educationalExpense?: number | string;
    centerExpense?: number | string;
    otherExpense?: number | string;
    totalCost?: number | string;
  };
  fundingGap?: number | string;
};

type CenterFundingApiResponse = {
  range?: { from?: string; to?: string } | null;
  rows?: CenterFundingApiRow[];
  totals?: {
    totalFunding?: number | string;
    totalCost?: number | string;
    fundingGap?: number | string;
  };
};

const normalizeCenterFundingReport = (report: CenterFundingApiResponse): FinanceReportCenterFundingV2 => ({
  rows: (report.rows ?? []).map((row) => ({
    centerId: Number(row.centerId),
    centerName: row.centerName,
    studentFees: toNumber(row.funding?.studentFees),
    donations: toNumber(row.funding?.donations),
    totalFunding: toNumber(row.funding?.totalFunding),
    payrollCosts: toNumber(row.cost?.payrollExpense),
    operatingCosts: toNumber(row.cost?.operatingExpense),
    educationalCosts: toNumber(row.cost?.educationalExpense),
    totalCosts: toNumber(row.cost?.totalCost),
    fundingGap: toNumber(row.fundingGap)
  })),
  kpis: {
    totalFunding: toNumber(report.totals?.totalFunding),
    totalCosts: toNumber(report.totals?.totalCost),
    netFundingGap: toNumber(report.totals?.fundingGap)
  }
});

const normalizeFinancialPositionItem = (item: FinancialPositionItemV2): FinancialPositionItemV2 => ({
  ...item,
  accountId: Number(item.accountId),
  balance: toNumber(item.balance)
});

const normalizeFinancialPositionReport = (report: FinanceReportFinancialPositionV2): FinanceReportFinancialPositionV2 => ({
  ...report,
  assets: {
    ...report.assets,
    current: (report.assets.current ?? []).map(normalizeFinancialPositionItem),
    fixed: (report.assets.fixed ?? []).map(normalizeFinancialPositionItem),
    totalCurrent: toNumber(report.assets.totalCurrent),
    totalFixed: toNumber(report.assets.totalFixed),
    totalAssets: toNumber(report.assets.totalAssets)
  },
  liabilities: {
    ...report.liabilities,
    rows: (report.liabilities.rows ?? []).map(normalizeFinancialPositionItem),
    totalLiabilities: toNumber(report.liabilities.totalLiabilities)
  },
  netAssets: {
    ...report.netAssets,
    unrestricted: (report.netAssets.unrestricted ?? []).map(normalizeFinancialPositionItem),
    restricted: (report.netAssets.restricted ?? []).map(normalizeFinancialPositionItem),
    totalUnrestricted: toNumber(report.netAssets.totalUnrestricted),
    totalRestricted: toNumber(report.netAssets.totalRestricted),
    totalNetAssets: toNumber(report.netAssets.totalNetAssets)
  },
  isBalanced: Boolean(report.isBalanced)
});

const normalizeStatementOfActivitiesReport = (report: FinanceReportStatementOfActivitiesV2): FinanceReportStatementOfActivitiesV2 => ({
  ...report,
  revenue: {
    ...report.revenue,
    studentContributions: (report.revenue.studentContributions ?? []).map(normalizeFinancialPositionItem),
    donations: (report.revenue.donations ?? []).map(normalizeFinancialPositionItem),
    other: (report.revenue.other ?? []).map(normalizeFinancialPositionItem),
    totalRevenue: toNumber(report.revenue.totalRevenue)
  },
  expenses: {
    ...report.expenses,
    payroll: (report.expenses.payroll ?? []).map(normalizeFinancialPositionItem),
    operating: (report.expenses.operating ?? []).map(normalizeFinancialPositionItem),
    educational: (report.expenses.educational ?? []).map(normalizeFinancialPositionItem),
    centers: (report.expenses.centers ?? []).map(normalizeFinancialPositionItem),
    depreciation: (report.expenses.depreciation ?? []).map(normalizeFinancialPositionItem),
    other: (report.expenses.other ?? []).map(normalizeFinancialPositionItem),
    totalExpenses: toNumber(report.expenses.totalExpenses)
  },
  surplusOrDeficit: toNumber(report.surplusOrDeficit)
});

const normalizeAssetCategory = (category: AssetCategoryV2): AssetCategoryV2 => ({
  ...category,
  id: Number(category.id),
  assetAccountId:
    category.assetAccountId === null || category.assetAccountId === undefined
      ? null
      : Number(category.assetAccountId),
  depreciationExpenseAccountId:
    category.depreciationExpenseAccountId === null || category.depreciationExpenseAccountId === undefined
      ? null
      : Number(category.depreciationExpenseAccountId),
  accumulatedDepreciationAccountId:
    category.accumulatedDepreciationAccountId === null ||
    category.accumulatedDepreciationAccountId === undefined
      ? null
      : Number(category.accumulatedDepreciationAccountId),
  usefulLifeMonths:
    category.usefulLifeMonths === null || category.usefulLifeMonths === undefined
      ? null
      : Number(category.usefulLifeMonths),
  isActive: Boolean(category.isActive)
});

const normalizeFixedAsset = (asset: FixedAssetV2): FixedAssetV2 => ({
  ...asset,
  id: Number(asset.id),
  centerId: asset.centerId === null || asset.centerId === undefined ? null : Number(asset.centerId),
  categoryId: Number(asset.categoryId),
  purchaseCost: toNumber(asset.purchaseCost),
  currentValue: asset.currentValue === null || asset.currentValue === undefined ? null : toNumber(asset.currentValue),
  usefulLifeMonths:
    asset.usefulLifeMonths === null || asset.usefulLifeMonths === undefined
      ? null
      : Number(asset.usefulLifeMonths),
  custodianUserId:
    asset.custodianUserId === null || asset.custodianUserId === undefined
      ? null
      : Number(asset.custodianUserId),
  supplierId: asset.supplierId === null || asset.supplierId === undefined ? null : Number(asset.supplierId),
  expenseInvoiceId:
    asset.expenseInvoiceId === null || asset.expenseInvoiceId === undefined
      ? null
      : Number(asset.expenseInvoiceId),
  acquisitionJournalEntryId:
    asset.acquisitionJournalEntryId === null || asset.acquisitionJournalEntryId === undefined
      ? null
      : Number(asset.acquisitionJournalEntryId),
  category: asset.category ? normalizeAssetCategory(asset.category) : undefined,
  acquisitionJournalEntry: asset.acquisitionJournalEntry
    ? { ...asset.acquisitionJournalEntry, id: Number(asset.acquisitionJournalEntry.id) }
    : null,
  depreciationEntries: (asset.depreciationEntries ?? []).map((entry) => ({
    ...entry,
    id: Number(entry.id),
    periodYear: Number(entry.periodYear),
    periodMonth: Number(entry.periodMonth),
    amount: toNumber(entry.amount),
    journalEntryId:
      entry.journalEntryId === null || entry.journalEntryId === undefined ? null : Number(entry.journalEntryId)
  })),
  expenseInvoice: asset.expenseInvoice
    ? { ...asset.expenseInvoice, id: Number(asset.expenseInvoice.id), amount: toNumber(asset.expenseInvoice.amount) }
    : null
});

const normalizeAssetCustodyLog = (log: AssetCustodyLogV2): AssetCustodyLogV2 => ({
  ...log,
  id: Number(log.id),
  assetId: Number(log.assetId),
  fromUserId: log.fromUserId === null || log.fromUserId === undefined ? null : Number(log.fromUserId),
  toUserId: log.toUserId === null || log.toUserId === undefined ? null : Number(log.toUserId),
  centerId: log.centerId === null || log.centerId === undefined ? null : Number(log.centerId),
  createdById: log.createdById === null || log.createdById === undefined ? null : Number(log.createdById)
});

export const financeV2Api = {
  async listAssetCategories(): Promise<AssetCategoryV2[]> {
    const response = await apiClient.get<ApiResponse<AssetCategoryV2[]>>("/finance/v2/asset-categories");
    return response.data.data.map((category) => normalizeAssetCategory(category));
  },

  async createAssetCategory(payload: CreateAssetCategoryV2Payload): Promise<AssetCategoryV2> {
    const response = await apiClient.post<ApiResponse<AssetCategoryV2>>("/finance/v2/asset-categories", payload);
    return normalizeAssetCategory(response.data.data);
  },

  async listFixedAssets(params: {
    centerId?: number;
    categoryId?: number;
    status?: string;
  } = {}): Promise<FixedAssetV2[]> {
    const response = await apiClient.get<ApiResponse<FixedAssetV2[]>>("/finance/v2/assets", { params });
    return response.data.data.map((asset) => normalizeFixedAsset(asset));
  },

  async createFixedAsset(payload: CreateFixedAssetV2Payload): Promise<FixedAssetV2> {
    const response = await apiClient.post<ApiResponse<FixedAssetV2>>("/finance/v2/assets", payload);
    return normalizeFixedAsset(response.data.data);
  },

  async listAssetCustodyLogs(assetId?: number): Promise<AssetCustodyLogV2[]> {
    const response = await apiClient.get<ApiResponse<AssetCustodyLogV2[]>>("/finance/v2/asset-custody", {
      params: assetId ? { assetId } : undefined
    });
    return response.data.data.map((log) => normalizeAssetCustodyLog(log));
  },

  async assignAssetCustody(assetId: number, payload: AssignAssetCustodyV2Payload): Promise<AssetCustodyLogV2> {
    const response = await apiClient.post<ApiResponse<AssetCustodyLogV2>>(
      `/finance/v2/assets/${assetId}/custody`,
      payload
    );
    return normalizeAssetCustodyLog(response.data.data);
  },

  async postAssetAcquisition(assetId: number, payload: { financeAccountId: number }): Promise<FixedAssetV2> {
    const response = await apiClient.post<ApiResponse<FixedAssetV2>>(
      `/finance/v2/assets/${assetId}/post-acquisition`,
      payload
    );
    return normalizeFixedAsset(response.data.data);
  },

  async postAssetDepreciation(assetId: number, payload: { periodYear: number; periodMonth: number }): Promise<FixedAssetV2> {
    const response = await apiClient.post<ApiResponse<FixedAssetV2>>(
      `/finance/v2/assets/${assetId}/post-depreciation`,
      payload
    );
    return normalizeFixedAsset(response.data.data);
  },

  async listSuppliers(): Promise<SupplierV2[]> {
    const response = await apiClient.get<ApiResponse<SupplierV2[]>>("/finance/v2/suppliers");
    return response.data.data;
  },

  async createSupplier(payload: { name: string; phone?: string; address?: string; notes?: string }): Promise<SupplierV2> {
    const response = await apiClient.post<ApiResponse<SupplierV2>>("/finance/v2/suppliers", payload);
    return response.data.data;
  },

  async listExpenseCategories(): Promise<ExpenseCategoryV2[]> {
    const response = await apiClient.get<ApiResponse<ExpenseCategoryV2[]>>("/finance/v2/expense-categories");
    return response.data.data;
  },

  async createExpenseCategory(payload: { name: string; type?: string; accountingAccountId?: number }): Promise<ExpenseCategoryV2> {
    const response = await apiClient.post<ApiResponse<ExpenseCategoryV2>>("/finance/v2/expense-categories", payload);
    return response.data.data;
  },

  async listExpenseInvoices(params: { centerId?: number; supplierId?: number; status?: string }): Promise<ExpenseInvoiceV2[]> {
    const response = await apiClient.get<ApiResponse<ExpenseInvoiceV2[]>>("/finance/v2/expenses", { params });
    return response.data.data.map((inv: ExpenseInvoiceV2) => ({ ...inv, amount: Number(inv.amount) }));
  },

  async createExpenseInvoice(payload: { centerId?: number; supplierId?: number; categoryId: number; invoiceNo?: string; invoiceDate: string; dueDate?: string; description: string; amount: number; }): Promise<ExpenseInvoiceV2> {
    const response = await apiClient.post<ApiResponse<ExpenseInvoiceV2>>("/finance/v2/expenses", payload);
    const inv = response.data.data;
    return { ...inv, amount: Number(inv.amount) };
  },

  async approveExpenseInvoice(id: number): Promise<ExpenseInvoiceV2> {
    const response = await apiClient.post<ApiResponse<ExpenseInvoiceV2>>(`/finance/v2/expenses/${id}/approve`);
    const inv = response.data.data;
    return { ...inv, amount: Number(inv.amount) };
  },

  async payExpenseInvoice(id: number, payload: { amount: number; financeAccountId: number; notes?: string }): Promise<void> {
    await apiClient.post<ApiResponse<void>>(`/finance/v2/expenses/${id}/pay`, payload);
  },

  async getInvoices(params: FinanceInvoicesV2Query): Promise<PaginatedRows<FinanceInvoiceV2>> {
    const response = await apiClient.get<ApiResponse<PaginatedRows<FinanceInvoiceV2>>>(
      "/finance/v2/invoices",
      { params }
    );

    return {
      ...response.data.data,
      rows: response.data.data.rows.map((row) => normalizeInvoice(row))
    };
  },

  async createInvoice(payload: CreateFinanceInvoiceV2Payload): Promise<FinanceInvoiceV2> {
    const response = await apiClient.post<ApiResponse<FinanceInvoiceV2>>(
      "/finance/v2/invoices",
      payload
    );
    return normalizeInvoice(response.data.data);
  },

  async getInvoicePayments(invoiceId: number): Promise<FinancePaymentV2[]> {
    const response = await apiClient.get<ApiResponse<FinancePaymentV2[]>>(
      `/finance/v2/invoices/${invoiceId}/payments`
    );
    return response.data.data.map((row) => normalizePayment(row));
  },

  async getDonors(params: FinanceDonorsV2Query = {}): Promise<PaginatedRows<FinanceDonorV2>> {
    const response = await apiClient.get<ApiResponse<PaginatedRows<FinanceDonorV2>>>(
      "/finance/donors",
      { params }
    );

    return {
      ...response.data.data,
      rows: response.data.data.rows.map((row) => normalizeDonor(row))
    };
  },

  async createDonor(payload: CreateFinanceDonorV2Payload): Promise<FinanceDonorV2> {
    const response = await apiClient.post<ApiResponse<FinanceDonorV2>>("/finance/donors", payload);
    return normalizeDonor(response.data.data);
  },

  async updateDonor(donorId: number, payload: Partial<CreateFinanceDonorV2Payload>): Promise<FinanceDonorV2> {
    const response = await apiClient.patch<ApiResponse<FinanceDonorV2>>(
      `/finance/donors/${donorId}`,
      payload
    );
    return normalizeDonor(response.data.data);
  },

  async getDonations(params: FinanceDonationsV2Query = {}): Promise<PaginatedRows<FinanceDonationV2>> {
    const response = await apiClient.get<ApiResponse<PaginatedRows<FinanceDonationV2>>>(
      "/finance/donations",
      { params }
    );

    return {
      ...response.data.data,
      rows: response.data.data.rows.map((row) => normalizeDonation(row))
    };
  },

  async createDonation(payload: CreateFinanceDonationV2Payload): Promise<FinanceDonationV2> {
    const response = await apiClient.post<ApiResponse<FinanceDonationV2>>("/finance/donations", payload);
    return normalizeDonation(response.data.data);
  },

  async receiveDonation(
    donationId: number,
    payload: ReceiveFinanceDonationV2Payload
  ): Promise<FinanceDonationV2> {
    const response = await apiClient.post<ApiResponse<FinanceDonationV2>>(
      `/finance/donations/${donationId}/receive`,
      payload
    );
    return normalizeDonation(response.data.data);
  },

  async createPayment(payload: CreateFinancePaymentV2Payload): Promise<{
    payment: FinancePaymentV2;
    invoice: FinanceInvoiceV2;
    voucher?: FinanceVoucherV2 | null;
  }> {
    const headers = payload.idempotencyKey
      ? { "X-Idempotency-Key": payload.idempotencyKey }
      : undefined;
    const body = { ...payload };
    delete body.idempotencyKey;
    const response = await apiClient.post<
      ApiResponse<{
        payment: FinancePaymentV2;
        invoice: FinanceInvoiceV2;
        voucher?: FinanceVoucherV2 | null;
      }>
    >("/finance/v2/payments", body, { headers });

    return {
      payment: normalizePayment(response.data.data.payment),
      invoice: normalizeInvoice(response.data.data.invoice),
      voucher: response.data.data.voucher ? normalizeVoucher(response.data.data.voucher) : null
    };
  },

  async getVouchers(params: {
    centerId?: number;
    page?: number;
    pageSize?: number;
    status?: string;
    voucherType?: string;
  }): Promise<PaginatedRows<FinanceVoucherV2>> {
    const response = await apiClient.get<ApiResponse<PaginatedRows<FinanceVoucherV2>>>(
      "/finance/v2/vouchers",
      { params }
    );

    return {
      ...response.data.data,
      rows: response.data.data.rows.map((row) => normalizeVoucher(row))
    };
  },

  async createVoucher(payload: CreateFinanceVoucherV2Payload): Promise<FinanceVoucherV2> {
    const response = await apiClient.post<ApiResponse<FinanceVoucherV2>>("/finance/v2/vouchers", payload);
    return normalizeVoucher(response.data.data);
  },

  async submitVoucher(voucherId: number, comment?: string): Promise<FinanceVoucherV2> {
    const response = await apiClient.post<ApiResponse<FinanceVoucherV2>>(
      `/finance/v2/vouchers/${voucherId}/submit`,
      { comment: comment?.trim() || undefined }
    );
    return normalizeVoucher(response.data.data);
  },

  async approveVoucher(voucherId: number, comment?: string): Promise<FinanceVoucherV2> {
    const response = await apiClient.post<ApiResponse<FinanceVoucherV2>>(
      `/finance/v2/vouchers/${voucherId}/approve`,
      { comment: comment?.trim() || undefined }
    );
    return normalizeVoucher(response.data.data);
  },

  async rejectVoucher(voucherId: number, reason: string): Promise<FinanceVoucherV2> {
    const response = await apiClient.post<ApiResponse<FinanceVoucherV2>>(
      `/finance/v2/vouchers/${voucherId}/reject`,
      { reason: reason.trim() }
    );
    return normalizeVoucher(response.data.data);
  },

  async postVoucher(voucherId: number, comment?: string): Promise<{
    voucher: FinanceVoucherV2;
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        voucher: FinanceVoucherV2;
      }>
    >(`/finance/v2/vouchers/${voucherId}/post`, { comment: comment?.trim() || undefined });
    return { voucher: normalizeVoucher(response.data.data.voucher) };
  },

  async requestVoucherVoid(voucherId: number, reason: string): Promise<FinanceVoucherV2> {
    const response = await apiClient.post<ApiResponse<FinanceVoucherV2>>(
      `/finance/v2/vouchers/${voucherId}/void-request`,
      { reason: reason.trim() }
    );
    return normalizeVoucher(response.data.data);
  },

  async approveVoucherVoid(voucherId: number, comment?: string): Promise<{
    voucher: FinanceVoucherV2;
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        voucher: FinanceVoucherV2;
      }>
    >(`/finance/v2/vouchers/${voucherId}/void-approve`, { comment: comment?.trim() || undefined });
    return { voucher: normalizeVoucher(response.data.data.voucher) };
  },

  async getAccounts(params: { centerId?: number } = {}): Promise<FinanceAccountV2[]> {
    const response = await apiClient.get<ApiResponse<FinanceAccountV2[]>>("/finance/v2/accounts", {
      params
    });
    return response.data.data.map((row) => normalizeAccount(row));
  },

  async updateAccountLedgerAccount(
    accountId: number,
    payload: { accountingAccountId: number }
  ): Promise<FinanceAccountV2> {
    const response = await apiClient.patch<ApiResponse<FinanceAccountV2>>(
      `/finance/v2/accounts/${accountId}/ledger-account`,
      payload
    );
    return normalizeAccount(response.data.data);
  },

  async getFundTransfers(params: {
    centerId?: number;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedRows<FinanceFundTransferV2>> {
    const response = await apiClient.get<ApiResponse<PaginatedRows<FinanceFundTransferV2>>>(
      "/finance/v2/fund-transfers",
      { params }
    );
    return {
      ...response.data.data,
      rows: response.data.data.rows.map((row) => normalizeFundTransfer(row))
    };
  },

  async createFundTransfer(payload: CreateFundTransferV2Payload): Promise<FinanceFundTransferV2> {
    const response = await apiClient.post<ApiResponse<FinanceFundTransferV2>>(
      "/finance/v2/fund-transfers",
      payload
    );
    return normalizeFundTransfer(response.data.data);
  },

  async submitFundTransfer(transferId: number, comment?: string): Promise<FinanceFundTransferV2> {
    const response = await apiClient.post<ApiResponse<FinanceFundTransferV2>>(
      `/finance/v2/fund-transfers/${transferId}/submit`,
      { comment: comment?.trim() || undefined }
    );
    return normalizeFundTransfer(response.data.data);
  },

  async approveFundTransfer(transferId: number, comment?: string): Promise<FinanceFundTransferV2> {
    const response = await apiClient.post<ApiResponse<FinanceFundTransferV2>>(
      `/finance/v2/fund-transfers/${transferId}/approve`,
      { comment: comment?.trim() || undefined }
    );
    return normalizeFundTransfer(response.data.data);
  },

  async postFundTransfer(transferId: number, comment?: string): Promise<{
    transfer: FinanceFundTransferV2;
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        transfer: FinanceFundTransferV2;
      }>
    >(`/finance/v2/fund-transfers/${transferId}/post`, { comment: comment?.trim() || undefined });
    return {
      transfer: normalizeFundTransfer(response.data.data.transfer)
    };
  },

  async getPayrollBatches(params: {
    centerId?: number;
    periodYear?: number;
    periodMonth?: number;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedRows<PayrollBatchV2>> {
    const response = await apiClient.get<ApiResponse<PaginatedRows<PayrollBatchV2>>>(
      "/finance/v2/payroll/batches",
      { params }
    );

    return {
      ...response.data.data,
      rows: response.data.data.rows.map((row) => normalizePayrollBatch(row))
    };
  },

  async getPayrollProfiles(params: {
    centerId?: number;
    userId?: number;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedRows<PayrollProfileV2>> {
    const response = await apiClient.get<ApiResponse<PaginatedRows<PayrollProfileV2>>>(
      "/finance/v2/payroll/profiles",
      { params }
    );

    return {
      ...response.data.data,
      rows: response.data.data.rows.map((row) => normalizePayrollProfile(row))
    };
  },

  async createPayrollProfile(payload: CreatePayrollProfileV2Payload): Promise<PayrollProfileV2> {
    const response = await apiClient.post<ApiResponse<PayrollProfileV2>>(
      "/finance/v2/payroll/profiles",
      payload
    );
    return normalizePayrollProfile(response.data.data);
  },

  async createPayrollBatch(payload: CreatePayrollBatchV2Payload): Promise<PayrollBatchV2> {
    const response = await apiClient.post<ApiResponse<PayrollBatchV2>>(
      "/finance/v2/payroll/batches",
      payload
    );
    return normalizePayrollBatch(response.data.data);
  },

  async submitPayrollBatch(batchId: number, comment?: string): Promise<PayrollBatchV2> {
    const response = await apiClient.post<ApiResponse<PayrollBatchV2>>(
      `/finance/v2/payroll/batches/${batchId}/submit`,
      { comment: comment?.trim() || undefined }
    );
    return normalizePayrollBatch(response.data.data);
  },

  async approvePayrollBatch(batchId: number, comment?: string): Promise<PayrollBatchV2> {
    const response = await apiClient.post<ApiResponse<PayrollBatchV2>>(
      `/finance/v2/payroll/batches/${batchId}/approve`,
      { comment: comment?.trim() || undefined }
    );
    return normalizePayrollBatch(response.data.data);
  },

  async rejectPayrollBatch(batchId: number, reason: string): Promise<PayrollBatchV2> {
    const response = await apiClient.post<ApiResponse<PayrollBatchV2>>(
      `/finance/v2/payroll/batches/${batchId}/reject`,
      { reason: reason.trim() }
    );
    return normalizePayrollBatch(response.data.data);
  },

  async payPayrollBatch(
    batchId: number,
    payload: {
      payments: Array<{
        itemId: number;
        manualReferenceNo?: string;
        method: "CASH" | "TRANSFER";
        attachmentStorageKey?: string;
        externalTransferRef?: string;
      }>;
    }
  ): Promise<PayrollBatchV2> {
    const response = await apiClient.post<ApiResponse<PayrollBatchV2>>(
      `/finance/v2/payroll/batches/${batchId}/pay`,
      payload
    );
    return normalizePayrollBatch(response.data.data);
  },

  async failPayrollItem(itemId: number, failureReason: string): Promise<PayrollBatchV2> {
    const response = await apiClient.post<ApiResponse<PayrollBatchV2>>(
      `/finance/v2/payroll/items/${itemId}/fail`,
      { failureReason: failureReason.trim() }
    );
    return normalizePayrollBatch(response.data.data);
  },

  async getRewardBatches(params: {
    centerId?: number;
    cycle?: "MONTHLY" | "QUARTERLY" | "ANNUAL";
    rewardType?: "GENERAL" | "PERFORMANCE" | "ATTENDANCE" | "COMPETITION" | "OTHER";
    periodYear?: number;
    periodMonth?: number;
    periodQuarter?: number;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedRows<RewardBatchV2>> {
    const response = await apiClient.get<ApiResponse<PaginatedRows<RewardBatchV2>>>(
      "/finance/v2/reward/batches",
      { params }
    );

    return {
      ...response.data.data,
      rows: response.data.data.rows.map((row) => normalizeRewardBatch(row))
    };
  },

  async getRewardProfiles(params: {
    centerId?: number;
    beneficiaryUserId?: number;
    cycle?: "MONTHLY" | "QUARTERLY" | "ANNUAL";
    rewardType?: "GENERAL" | "PERFORMANCE" | "ATTENDANCE" | "COMPETITION" | "OTHER";
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedRows<RewardProfileV2>> {
    const response = await apiClient.get<ApiResponse<PaginatedRows<RewardProfileV2>>>(
      "/finance/v2/reward/profiles",
      { params }
    );
    return {
      ...response.data.data,
      rows: response.data.data.rows.map((row) => normalizeRewardProfile(row))
    };
  },

  async createRewardProfile(payload: CreateRewardProfileV2Payload): Promise<RewardProfileV2> {
    const response = await apiClient.post<ApiResponse<RewardProfileV2>>(
      "/finance/v2/reward/profiles",
      payload
    );
    return normalizeRewardProfile(response.data.data);
  },

  async createRewardBatch(payload: CreateRewardBatchV2Payload): Promise<RewardBatchV2> {
    const response = await apiClient.post<ApiResponse<RewardBatchV2>>(
      "/finance/v2/reward/batches",
      payload
    );
    return normalizeRewardBatch(response.data.data);
  },

  async submitRewardBatch(batchId: number, comment?: string): Promise<RewardBatchV2> {
    const response = await apiClient.post<ApiResponse<RewardBatchV2>>(
      `/finance/v2/reward/batches/${batchId}/submit`,
      { comment: comment?.trim() || undefined }
    );
    return normalizeRewardBatch(response.data.data);
  },

  async approveRewardBatch(batchId: number, comment?: string): Promise<RewardBatchV2> {
    const response = await apiClient.post<ApiResponse<RewardBatchV2>>(
      `/finance/v2/reward/batches/${batchId}/approve`,
      { comment: comment?.trim() || undefined }
    );
    return normalizeRewardBatch(response.data.data);
  },

  async rejectRewardBatch(batchId: number, reason: string): Promise<RewardBatchV2> {
    const response = await apiClient.post<ApiResponse<RewardBatchV2>>(
      `/finance/v2/reward/batches/${batchId}/reject`,
      { reason: reason.trim() }
    );
    return normalizeRewardBatch(response.data.data);
  },

  async payRewardBatch(
    batchId: number,
    payload: {
      payments: Array<{
        itemId: number;
        manualReferenceNo?: string;
        method: "CASH" | "TRANSFER";
        attachmentStorageKey?: string;
        externalTransferRef?: string;
      }>;
    }
  ): Promise<RewardBatchV2> {
    const response = await apiClient.post<ApiResponse<RewardBatchV2>>(
      `/finance/v2/reward/batches/${batchId}/pay`,
      payload
    );
    return normalizeRewardBatch(response.data.data);
  },

  async failRewardItem(itemId: number, failureReason: string): Promise<RewardBatchV2> {
    const response = await apiClient.post<ApiResponse<RewardBatchV2>>(
      `/finance/v2/reward/items/${itemId}/fail`,
      { failureReason: failureReason.trim() }
    );
    return normalizeRewardBatch(response.data.data);
  },

  async getPendingApprovals(): Promise<PendingApprovalsV2> {
    const response = await apiClient.get<ApiResponse<PendingApprovalsV2>>(
      "/finance/v2/approvals/pending"
    );
    return {
      ...response.data.data,
      vouchers: (response.data.data.vouchers ?? []).map((voucher) => normalizeVoucher(voucher)),
      transfers: (response.data.data.transfers ?? []).map((transfer) =>
        normalizeFundTransfer(transfer)
      ),
      payrollBatches: (response.data.data.payrollBatches ?? []).map((batch) =>
        normalizePayrollBatch(batch)
      ),
      rewardBatches: (response.data.data.rewardBatches ?? []).map((batch) =>
        normalizeRewardBatch(batch)
      )
    };
  },

  async getReportDashboard(params: { centerId?: number } = {}): Promise<FinanceReportDashboardV2> {
    const response = await apiClient.get<ApiResponse<FinanceReportDashboardV2>>(
      "/finance/v2/reports/dashboard",
      { params }
    );
    return normalizeDashboardReport(response.data.data);
  },

  async getReportCashflow(params: { centerId?: number } = {}): Promise<FinanceReportCashflowV2> {
    const response = await apiClient.get<ApiResponse<FinanceReportCashflowV2>>(
      "/finance/v2/reports/cashflow",
      { params }
    );
    return normalizeCashflowReport(response.data.data);
  },

  async getReportPayroll(params: { centerId?: number } = {}): Promise<FinanceReportPayrollV2> {
    const response = await apiClient.get<ApiResponse<FinanceReportPayrollV2>>(
      "/finance/v2/reports/payroll",
      { params }
    );
    return normalizePayrollReport(response.data.data);
  },

  async getReportRewards(params: { centerId?: number } = {}): Promise<FinanceReportRewardsV2> {
    const response = await apiClient.get<ApiResponse<FinanceReportRewardsV2>>(
      "/finance/v2/reports/rewards",
      { params }
    );
    return normalizeRewardsReport(response.data.data);
  },

  async getReportVouchers(params: { centerId?: number } = {}): Promise<FinanceReportVouchersV2> {
    const response = await apiClient.get<ApiResponse<FinanceReportVouchersV2>>(
      "/finance/v2/reports/vouchers",
      { params }
    );
    return normalizeVouchersReport(response.data.data);
  },

  async getReportInvoiceAging(params: { centerId?: number } = {}): Promise<FinanceReportInvoiceAgingV2> {
    const response = await apiClient.get<ApiResponse<FinanceReportInvoiceAgingV2>>(
      "/finance/v2/reports/invoice-aging",
      { params }
    );
    return normalizeAgingReport(response.data.data);
  },

  async getReportCenterFunding(params: { centerId?: number; from?: string; to?: string } = {}): Promise<FinanceReportCenterFundingV2> {
    const response = await apiClient.get<ApiResponse<CenterFundingApiResponse>>(
      "/finance/v2/reports/center-funding",
      { params }
    );
    return normalizeCenterFundingReport(response.data.data);
  },

  async getReportFinancialPosition(params: { centerId?: number; asOf?: string } = {}): Promise<FinanceReportFinancialPositionV2> {
    const response = await apiClient.get<ApiResponse<FinanceReportFinancialPositionV2>>(
      "/finance/v2/reports/financial-position",
      { params }
    );
    return normalizeFinancialPositionReport(response.data.data);
  },

  async getReportStatementOfActivities(params: { centerId?: number; from?: string; to?: string } = {}): Promise<FinanceReportStatementOfActivitiesV2> {
    const response = await apiClient.get<ApiResponse<FinanceReportStatementOfActivitiesV2>>(
      "/finance/v2/reports/statement-of-activities",
      { params }
    );
    return normalizeStatementOfActivitiesReport(response.data.data);
  },

  // FA-UX-4: Currencies
  async getCurrencies(): Promise<CurrencyV2[]> {
    const response = await apiClient.get<ApiResponse<CurrencyV2[]>>
      ("/finance/v2/currencies");
    return response.data.data;
  },

  async getPredefinedCurrencies(): Promise<PredefinedCurrencyV2[]> {
    const response = await apiClient.get<ApiResponse<PredefinedCurrencyV2[]>>(
      "/finance/v2/currencies/predefined"
    );
    return response.data.data;
  },

  async createCurrency(payload: CreateCurrencyV2Payload): Promise<CurrencyV2> {
    const response = await apiClient.post<ApiResponse<CurrencyV2>>(
      "/finance/v2/currencies",
      payload
    );
    return response.data.data;
  },

  async updateCurrency(id: number, payload: Partial<CreateCurrencyV2Payload>): Promise<CurrencyV2> {
    const response = await apiClient.patch<ApiResponse<CurrencyV2>>(
      `/finance/v2/currencies/${id}`,
      payload
    );
    return response.data.data;
  },

  async getBaseCurrency(): Promise<CurrencyV2 | null> {
    const response = await apiClient.get<ApiResponse<CurrencyV2 | null>>(
      "/finance/v2/currencies/base"
    );
    return response.data.data;
  },

  // FA-UX-4: Exchange Rates
  async getExchangeRates(currencyCode?: string): Promise<ExchangeRateV2[]> {
    const response = await apiClient.get<ApiResponse<ExchangeRateV2[]>>(
      "/finance/v2/exchange-rates",
      { params: currencyCode ? { currencyCode } : undefined }
    );
    return response.data.data;
  },

  async getLatestExchangeRate(currencyCode: string): Promise<ExchangeRateV2 | null> {
    const response = await apiClient.get<ApiResponse<ExchangeRateV2 | null>>(
      "/finance/v2/exchange-rates/latest",
      { params: { currencyCode } }
    );
    return response.data.data;
  },

  async createExchangeRate(payload: CreateExchangeRateV2Payload): Promise<ExchangeRateV2> {
    const response = await apiClient.post<ApiResponse<ExchangeRateV2>>(
      "/finance/v2/exchange-rates",
      payload
    );
    return response.data.data;
  },

  async getSalaryGrades(params: { centerId?: number; isActive?: boolean } = {}): Promise<SalaryGradeV2[]> {
    const response = await apiClient.get<ApiResponse<SalaryGradeV2[]>>(
      "/finance/v2/salary-grades",
      { params }
    );
    return response.data.data;
  },

  async createSalaryGrade(payload: CreateSalaryGradeV2Payload): Promise<SalaryGradeV2> {
    const response = await apiClient.post<ApiResponse<SalaryGradeV2>>(
      "/finance/v2/salary-grades",
      payload
    );
    return response.data.data;
  },

  async updateSalaryGrade(id: number, payload: UpdateSalaryGradeV2Payload): Promise<SalaryGradeV2> {
    const response = await apiClient.patch<ApiResponse<SalaryGradeV2>>(
      `/finance/v2/salary-grades/${id}`,
      payload
    );
    return response.data.data;
  },

  // HR-PAYROLL-UX-COMPLETE: eligible employees for payroll profile selection
  async getEligibleEmployees(params: { centerId?: number; search?: string } = {}): Promise<EligibleEmployeeV2[]> {
    const response = await apiClient.get<ApiResponse<EligibleEmployeeV2[]>>(
      "/finance/v2/payroll/eligible-employees",
      { params }
    );
    return (response.data.data ?? []).map((e) => ({
      ...e,
      id: Number(e.id)
    }));
  },

  async updatePayrollProfile(id: number, payload: UpdatePayrollProfileV2Payload): Promise<PayrollProfileV2> {
    const response = await apiClient.patch<ApiResponse<PayrollProfileV2>>(
      `/finance/v2/payroll/profiles/${id}`,
      payload
    );
    return normalizePayrollProfile(response.data.data);
  }
};
