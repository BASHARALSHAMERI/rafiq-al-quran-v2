import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financeV2Api } from "./finance-v2.api";
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
  CreateSalaryGradeV2Payload,
  UpdateSalaryGradeV2Payload,
  UpdatePayrollProfileV2Payload,
  CreateCurrencyV2Payload,
  CreateExchangeRateV2Payload,
  CreateAssetCategoryV2Payload,
  CreateFixedAssetV2Payload,
  AssignAssetCustodyV2Payload,
  FinanceDonationsV2Query,
  FinanceDonorsV2Query,
  FinanceInvoicesV2Query,
  DonationReportQuery,
  ReceiptReportQuery
} from "./types";

const invoicesKey = (filters: FinanceInvoicesV2Query) =>
  [
    filters.centerId ?? null,
    filters.studentId ?? null,
    filters.month ?? null,
    filters.year ?? null,
    filters.status ?? null,
    filters.page ?? null,
    filters.pageSize ?? null
  ] as const;

export const FINANCE_V2_QUERY_KEYS = {
  all: ["finance-v2"] as const,
  invoices: (filters: FinanceInvoicesV2Query) =>
    [...FINANCE_V2_QUERY_KEYS.all, "invoices", ...invoicesKey(filters)] as const,
  invoicePayments: (invoiceId: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "invoice-payments", invoiceId] as const,
  donors: (filters: FinanceDonorsV2Query = {}) =>
    [...FINANCE_V2_QUERY_KEYS.all, "donors", filters.centerId ?? null, filters.isActive ?? null] as const,
  donations: (filters: FinanceDonationsV2Query = {}) =>
    [
      ...FINANCE_V2_QUERY_KEYS.all,
      "donations",
      filters.centerId ?? null,
      filters.donorId ?? null,
      filters.status ?? null
    ] as const,
  vouchers: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "vouchers", centerId ?? null] as const,
  fundTransfers: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "fund-transfers", centerId ?? null] as const,
  accounts: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "accounts", centerId ?? null] as const,
  payrollBatches: (centerId?: number, year?: number, month?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "payroll-batches", centerId ?? null, year ?? null, month ?? null] as const,
  payrollProfiles: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "payroll-profiles", centerId ?? null] as const,
  salaryGrades: (centerId?: number, isActive?: boolean) =>
    [...FINANCE_V2_QUERY_KEYS.all, "salary-grades", centerId ?? null, isActive ?? null] as const,
  rewardBatches: (centerId?: number, year?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "reward-batches", centerId ?? null, year ?? null] as const,
  rewardProfiles: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "reward-profiles", centerId ?? null] as const,
  reportsDashboard: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "reports-dashboard", centerId ?? null] as const,
  reportsCashflow: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "reports-cashflow", centerId ?? null] as const,
  reportsPayroll: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "reports-payroll", centerId ?? null] as const,
  reportsRewards: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "reports-rewards", centerId ?? null] as const,
  reportsVouchers: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "reports-vouchers", centerId ?? null] as const,
  reportsReceipts: () =>
    [...FINANCE_V2_QUERY_KEYS.all, "reports-receipts"] as const,
  reportsInvoiceAging: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "reports-invoice-aging", centerId ?? null] as const,
  reportsFinancialPosition: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "reports-financial-position", centerId ?? null] as const,
  reportsStatementOfActivities: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "reports-statement-of-activities", centerId ?? null] as const,
  reportsCenterFunding: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "reports-center-funding", centerId ?? null] as const,
  approvals: () => [...FINANCE_V2_QUERY_KEYS.all, "approvals"] as const,
  // FA-UX-4: Currencies
  currencies: () => [...FINANCE_V2_QUERY_KEYS.all, "currencies"] as const,
  predefinedCurrencies: () => [...FINANCE_V2_QUERY_KEYS.all, "currencies", "predefined"] as const,
  exchangeRates: (currencyCode?: string) =>
    [...FINANCE_V2_QUERY_KEYS.all, "exchange-rates", currencyCode ?? null] as const,
  // FA-UX-4B: latest exchange rate for a single currency code.
  latestExchangeRate: (currencyCode?: string) =>
    [...FINANCE_V2_QUERY_KEYS.all, "exchange-rates", "latest", currencyCode ?? null] as const,
  baseCurrency: () => [...FINANCE_V2_QUERY_KEYS.all, "base-currency"] as const,
  assetCategories: () => [...FINANCE_V2_QUERY_KEYS.all, "asset-categories"] as const,
  fixedAssets: (params: { centerId?: number; categoryId?: number; status?: string } = {}) =>
    [
      ...FINANCE_V2_QUERY_KEYS.all,
      "assets",
      params.centerId ?? null,
      params.categoryId ?? null,
      params.status ?? null
    ] as const,
  assetCustody: (assetId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "asset-custody", assetId ?? null] as const,
  tuitionPlans: (centerId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "tuition-plans", centerId ?? null] as const,
  studentFeeProfiles: (centerId?: number, studentId?: number) =>
    [...FINANCE_V2_QUERY_KEYS.all, "student-fee-profiles", centerId ?? null, studentId ?? null] as const,
  policy: (centerId?: number) => [...FINANCE_V2_QUERY_KEYS.all, "policy", centerId ?? null] as const
};

export const useFinanceV2InvoicesQuery = (filters: FinanceInvoicesV2Query) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.invoices(filters),
    queryFn: () => financeV2Api.getInvoices(filters),
    staleTime: 15_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2InvoicePaymentsQuery = (
  invoiceId: number | null,
  enabled: boolean
) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.invoicePayments(invoiceId ?? 0),
    queryFn: () => financeV2Api.getInvoicePayments(invoiceId ?? 0),
    enabled: enabled && Boolean(invoiceId),
    staleTime: 15_000,
    placeholderData: keepPreviousData
  });

export const useAssetCategoriesQuery = () =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.assetCategories(),
    queryFn: () => financeV2Api.listAssetCategories(),
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });

export const useCreateAssetCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssetCategoryV2Payload) => financeV2Api.createAssetCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.assetCategories() });
    }
  });
};

export const useFixedAssetsQuery = (
  params: { centerId?: number; categoryId?: number; status?: string } = {}
) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.fixedAssets(params),
    queryFn: () => financeV2Api.listFixedAssets(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData
  });

export const useCreateFixedAssetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFixedAssetV2Payload) => financeV2Api.createFixedAsset(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.fixedAssets() }),
        queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.assetCustody() })
      ]);
    }
  });
};

export const useAssetCustodyLogsQuery = (assetId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.assetCustody(assetId),
    queryFn: () => financeV2Api.listAssetCustodyLogs(assetId),
    staleTime: 30_000,
    placeholderData: keepPreviousData
  });

export const useAssignAssetCustodyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { assetId: number; payload: AssignAssetCustodyV2Payload }) =>
      financeV2Api.assignAssetCustody(input.assetId, input.payload),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.fixedAssets() }),
        queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.assetCustody() }),
        queryClient.invalidateQueries({
          queryKey: FINANCE_V2_QUERY_KEYS.assetCustody(variables.assetId)
        })
      ]);
    }
  });
};

export const usePostAssetAcquisitionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; payload: { financeAccountId: number } }) =>
      financeV2Api.postAssetAcquisition(input.id, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.fixedAssets() });
    }
  });
};

export const usePostAssetDepreciationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; payload: { periodYear: number; periodMonth: number } }) =>
      financeV2Api.postAssetDepreciation(input.id, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.fixedAssets() });
    }
  });
};

export const useCreateFinanceV2InvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFinanceInvoiceV2Payload) => financeV2Api.createInvoice(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useCreateFinanceV2PaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFinancePaymentV2Payload) => financeV2Api.createPayment(payload),
    onSuccess: async (_result, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all }),
        queryClient.invalidateQueries({
          queryKey: FINANCE_V2_QUERY_KEYS.invoicePayments(payload.invoiceId)
        })
      ]);
    }
  });
};

export const useFinanceV2DonorsQuery = (filters: FinanceDonorsV2Query = {}) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.donors(filters),
    queryFn: () => financeV2Api.getDonors({ page: 1, pageSize: 100, ...filters }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2TuitionPlansQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.tuitionPlans(centerId),
    queryFn: () => financeV2Api.getTuitionPlans({ centerId, isActive: true }),
    staleTime: 60_000
  });

export const useCreateFinanceV2TuitionPlanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { centerId: number; name: string; monthlyAmount: number; planKind?: string; isActive?: boolean }) =>
      financeV2Api.createTuitionPlan(payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.tuitionPlans() });
    }
  });
};

export const useUpdateFinanceV2TuitionPlanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; payload: { name?: string; monthlyAmount?: number; planKind?: string; isActive?: boolean } }) =>
      financeV2Api.updateTuitionPlan(input.id, input.payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.tuitionPlans() });
    }
  });
};

export const useFinanceV2StudentFeeProfilesQuery = (centerId?: number, studentId?: number, enabled = true) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.studentFeeProfiles(centerId, studentId),
    queryFn: () => financeV2Api.getStudentFeeProfiles({ centerId, studentId, page: 1, pageSize: 100 }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    enabled
  });

export const useCreateFinanceV2StudentFeeProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      centerId: number; studentId: number; feeMode: string;
      tuitionPlanId?: number; symbolicAmount?: number;
      isActive?: boolean; startDate: string; endDate?: string; notes?: string
    }) => financeV2Api.createStudentFeeProfile(payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useUpdateFinanceV2StudentFeeProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: number;
      payload: {
        feeMode?: string; tuitionPlanId?: number | null; symbolicAmount?: number | null;
        isActive?: boolean; startDate?: string; endDate?: string | null; notes?: string | null
      }
    }) => financeV2Api.updateStudentFeeProfile(input.id, input.payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useFinanceV2PolicyQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.policy(centerId),
    queryFn: () => financeV2Api.getEffectivePolicy({ centerId }),
    staleTime: 120_000,
    placeholderData: keepPreviousData
  });

export const usePatchOrganizationPolicyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<import("./types").FinancePolicyProfileV2>) =>
      financeV2Api.patchOrganizationPolicy(payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [...FINANCE_V2_QUERY_KEYS.all, "policy"] });
    }
  });
};

export const useCreateFinanceV2DonorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFinanceDonorV2Payload) => financeV2Api.createDonor(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useUpdateFinanceV2DonorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { donorId: number; payload: Partial<CreateFinanceDonorV2Payload> }) =>
      financeV2Api.updateDonor(input.donorId, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useDeleteFinanceV2DonorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (donorId: number) => financeV2Api.deleteDonor(donorId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useFinanceV2DonationsQuery = (filters: FinanceDonationsV2Query = {}) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.donations(filters),
    queryFn: () => financeV2Api.getDonations({ page: 1, pageSize: 100, ...filters }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2DonationReportQuery = (filters: DonationReportQuery, enabled = true) =>
  useQuery({
    queryKey: [...FINANCE_V2_QUERY_KEYS.all, "reports", "donations", filters],
    queryFn: () => financeV2Api.getDonationReport(filters),
    enabled,
    staleTime: 30_000,
  });

export const useCreateFinanceV2DonationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFinanceDonationV2Payload) => financeV2Api.createDonation(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useReceiveFinanceV2DonationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // FA-UX-4B: support optional exchangeRateToBase override at receipt time
    // for foreign-currency pledges.
    mutationFn: (input: {
      donationId: number;
      receivedDate?: string;
      paymentMethod?: "CASH" | "TRANSFER";
      exchangeRateToBase?: number;
      notes?: string;
    }) =>
      financeV2Api.receiveDonation(input.donationId, {
        receivedDate: input.receivedDate,
        paymentMethod: input.paymentMethod,
        exchangeRateToBase: input.exchangeRateToBase,
        notes: input.notes
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useFinanceV2VouchersQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.vouchers(centerId),
    queryFn: () => financeV2Api.getVouchers({ centerId, page: 1, pageSize: 100 }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useCreateFinanceV2VoucherMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFinanceVoucherV2Payload) => financeV2Api.createVoucher(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useSubmitFinanceV2VoucherMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { voucherId: number; comment?: string }) =>
      financeV2Api.submitVoucher(input.voucherId, input.comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useApproveFinanceV2VoucherMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { voucherId: number; comment?: string }) =>
      financeV2Api.approveVoucher(input.voucherId, input.comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useRejectFinanceV2VoucherMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { voucherId: number; reason: string }) =>
      financeV2Api.rejectVoucher(input.voucherId, input.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const usePostFinanceV2VoucherMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { voucherId: number; comment?: string }) =>
      financeV2Api.postVoucher(input.voucherId, input.comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useRequestFinanceV2VoucherVoidMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { voucherId: number; reason: string }) =>
      financeV2Api.requestVoucherVoid(input.voucherId, input.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useApproveFinanceV2VoucherVoidMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { voucherId: number; comment?: string }) =>
      financeV2Api.approveVoucherVoid(input.voucherId, input.comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useFinanceV2AccountsQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.accounts(centerId),
    queryFn: () => financeV2Api.getAccounts({ centerId }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useUpdateFinanceV2AccountLedgerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { accountId: number; accountingAccountId: number }) =>
      financeV2Api.updateAccountLedgerAccount(input.accountId, {
        accountingAccountId: input.accountingAccountId
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useFinanceV2FundTransfersQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.fundTransfers(centerId),
    queryFn: () =>
      financeV2Api.getFundTransfers({
        centerId,
        page: 1,
        pageSize: 100
      }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useCreateFinanceV2FundTransferMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFundTransferV2Payload) => financeV2Api.createFundTransfer(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useSubmitFinanceV2FundTransferMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { transferId: number; comment?: string }) =>
      financeV2Api.submitFundTransfer(input.transferId, input.comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useApproveFinanceV2FundTransferMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { transferId: number; comment?: string }) =>
      financeV2Api.approveFundTransfer(input.transferId, input.comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const usePostFinanceV2FundTransferMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { transferId: number; comment?: string }) =>
      financeV2Api.postFundTransfer(input.transferId, input.comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useFinanceV2PayrollBatchesQuery = (
  centerId?: number,
  periodYear?: number,
  periodMonth?: number
) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.payrollBatches(centerId, periodYear, periodMonth),
    queryFn: () =>
      financeV2Api.getPayrollBatches({
        centerId,
        periodYear,
        periodMonth,
        page: 1,
        pageSize: 100
      }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2PayrollProfilesQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.payrollProfiles(centerId),
    queryFn: () =>
      financeV2Api.getPayrollProfiles({
        centerId,
        isActive: true,
        page: 1,
        pageSize: 100
      }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useCreateFinanceV2PayrollProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayrollProfileV2Payload) => financeV2Api.createPayrollProfile(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useCreateFinanceV2PayrollBatchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayrollBatchV2Payload) => financeV2Api.createPayrollBatch(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useSubmitFinanceV2PayrollBatchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { batchId: number; comment?: string }) =>
      financeV2Api.submitPayrollBatch(input.batchId, input.comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useApproveFinanceV2PayrollBatchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { batchId: number; comment?: string }) =>
      financeV2Api.approvePayrollBatch(input.batchId, input.comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useRejectFinanceV2PayrollBatchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { batchId: number; reason: string }) =>
      financeV2Api.rejectPayrollBatch(input.batchId, input.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const usePayFinanceV2PayrollBatchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      batchId: number;
      payments: Array<{
        itemId: number;
        manualReferenceNo?: string;
        method: "CASH" | "TRANSFER";
        attachmentStorageKey?: string;
        externalTransferRef?: string;
      }>;
    }) => financeV2Api.payPayrollBatch(input.batchId, { payments: input.payments }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useFailFinanceV2PayrollItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: number; failureReason: string }) =>
      financeV2Api.failPayrollItem(input.itemId, input.failureReason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useFinanceV2RewardBatchesQuery = (centerId?: number, periodYear?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.rewardBatches(centerId, periodYear),
    queryFn: () =>
      financeV2Api.getRewardBatches({
        centerId,
        periodYear,
        page: 1,
        pageSize: 100
      }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2RewardProfilesQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.rewardProfiles(centerId),
    queryFn: () =>
      financeV2Api.getRewardProfiles({
        centerId,
        isActive: true,
        page: 1,
        pageSize: 100
      }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useCreateFinanceV2RewardProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRewardProfileV2Payload) => financeV2Api.createRewardProfile(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useCreateFinanceV2RewardBatchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRewardBatchV2Payload) => financeV2Api.createRewardBatch(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useSubmitFinanceV2RewardBatchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { batchId: number; comment?: string }) =>
      financeV2Api.submitRewardBatch(input.batchId, input.comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useApproveFinanceV2RewardBatchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { batchId: number; comment?: string }) =>
      financeV2Api.approveRewardBatch(input.batchId, input.comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useRejectFinanceV2RewardBatchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { batchId: number; reason: string }) =>
      financeV2Api.rejectRewardBatch(input.batchId, input.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const usePayFinanceV2RewardBatchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      batchId: number;
      payments: Array<{
        itemId: number;
        manualReferenceNo?: string;
        method: "CASH" | "TRANSFER";
        attachmentStorageKey?: string;
        externalTransferRef?: string;
      }>;
    }) => financeV2Api.payRewardBatch(input.batchId, { payments: input.payments }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useFailFinanceV2RewardItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: number; failureReason: string }) =>
      financeV2Api.failRewardItem(input.itemId, input.failureReason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useFinanceV2ApprovalsQuery = (enabled = true) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.approvals(),
    queryFn: () => financeV2Api.getPendingApprovals(),
    enabled,
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2ReportDashboardQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.reportsDashboard(centerId),
    queryFn: () => financeV2Api.getReportDashboard({ centerId }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2ReportCashflowQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.reportsCashflow(centerId),
    queryFn: () => financeV2Api.getReportCashflow({ centerId }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2ReportPayrollQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.reportsPayroll(centerId),
    queryFn: () => financeV2Api.getReportPayroll({ centerId }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2ReportRewardsQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.reportsRewards(centerId),
    queryFn: () => financeV2Api.getReportRewards({ centerId }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2ReportVouchersQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.reportsVouchers(centerId),
    queryFn: () => financeV2Api.getReportVouchers({ centerId }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2ReceiptReportQuery = (filters: ReceiptReportQuery = {}, enabled = true) =>
  useQuery({
    queryKey: [...FINANCE_V2_QUERY_KEYS.reportsReceipts(), filters],
    queryFn: () => financeV2Api.getReceiptReport(filters),
    staleTime: 20_000,
    enabled,
  });

export const useFinanceV2ReportInvoiceAgingQuery = (centerId?: number) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.reportsInvoiceAging(centerId),
    queryFn: () => financeV2Api.getReportInvoiceAging({ centerId }),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2ReportCenterFundingQuery = (params: { centerId?: number; from?: string; to?: string }) =>
  useQuery({
    queryKey: [...FINANCE_V2_QUERY_KEYS.reportsCenterFunding(params.centerId), params.from, params.to],
    queryFn: () => financeV2Api.getReportCenterFunding(params),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

// FA-UX-4: Currencies
export const useCurrenciesQuery = () =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.currencies(),
    queryFn: () => financeV2Api.getCurrencies(),
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });

export const usePredefinedCurrenciesQuery = () =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.predefinedCurrencies(),
    queryFn: () => financeV2Api.getPredefinedCurrencies(),
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });

export const useExchangeRatesQuery = (currencyCode?: string) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.exchangeRates(currencyCode),
    queryFn: () => financeV2Api.getExchangeRates(currencyCode),
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });

// FA-UX-4B: latest exchange rate for a foreign currency, used to pre-fill the
// donation/voucher forms. Disabled for empty/YER codes to avoid noisy 404s.
export const useLatestExchangeRateQuery = (currencyCode?: string) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.latestExchangeRate(currencyCode),
    queryFn: () => financeV2Api.getLatestExchangeRate((currencyCode ?? "").toUpperCase()),
    enabled: Boolean(currencyCode) && currencyCode!.toUpperCase() !== "YER",
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });

export const useBaseCurrencyQuery = () =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.baseCurrency(),
    queryFn: () => financeV2Api.getBaseCurrency(),
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });

export const useCreateCurrencyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCurrencyV2Payload) => financeV2Api.createCurrency(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.currencies() });
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.predefinedCurrencies() });
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.baseCurrency() });
    }
  });
};

export const useCreateExchangeRateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExchangeRateV2Payload) => financeV2Api.createExchangeRate(payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.exchangeRates() });
      await queryClient.invalidateQueries({
        queryKey: FINANCE_V2_QUERY_KEYS.exchangeRates(variables.currencyCode)
      });
      await queryClient.invalidateQueries({
        queryKey: FINANCE_V2_QUERY_KEYS.latestExchangeRate(variables.currencyCode)
      });
    }
  });
};

export const useFinanceV2SalaryGradesQuery = (centerId?: number, isActive?: boolean) =>
  useQuery({
    queryKey: FINANCE_V2_QUERY_KEYS.salaryGrades(centerId, isActive),
    queryFn: () => financeV2Api.getSalaryGrades({ centerId, isActive }),
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });

export const useCreateFinanceV2SalaryGradeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalaryGradeV2Payload) => financeV2Api.createSalaryGrade(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

export const useUpdateFinanceV2SalaryGradeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSalaryGradeV2Payload }) =>
      financeV2Api.updateSalaryGrade(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};

// HR-PAYROLL-UX-COMPLETE: eligible employees for payroll profile creation
export const useFinanceV2EligibleEmployeesQuery = (params: { centerId?: number; search?: string } = {}) =>
  useQuery({
    queryKey: [...FINANCE_V2_QUERY_KEYS.all, "eligible-employees", params.centerId ?? null, params.search ?? null] as const,
    queryFn: () => financeV2Api.getEligibleEmployees(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData
  });

export const useUpdateFinanceV2PayrollProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePayrollProfileV2Payload }) =>
      financeV2Api.updatePayrollProfile(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_V2_QUERY_KEYS.all });
    }
  });
};


export const useSuppliersQuery = () =>
  useQuery({
    queryKey: [...FINANCE_V2_QUERY_KEYS.all, "suppliers"],
    queryFn: () => financeV2Api.listSuppliers(),
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });

export const useCreateSupplierMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; phone?: string; address?: string; notes?: string }) => financeV2Api.createSupplier(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...FINANCE_V2_QUERY_KEYS.all, "suppliers"] });
    }
  });
};

export const useExpenseCategoriesQuery = () =>
  useQuery({
    queryKey: [...FINANCE_V2_QUERY_KEYS.all, "expense-categories"],
    queryFn: () => financeV2Api.listExpenseCategories(),
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });

export const useCreateExpenseCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; type?: string; accountingAccountId?: number }) => financeV2Api.createExpenseCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...FINANCE_V2_QUERY_KEYS.all, "expense-categories"] });
    }
  });
};

export const useExpenseInvoicesQuery = (params: { centerId?: number; supplierId?: number; status?: string }) =>
  useQuery({
    queryKey: [...FINANCE_V2_QUERY_KEYS.all, "expenses", params.centerId, params.supplierId, params.status],
    queryFn: () => financeV2Api.listExpenseInvoices(params),
    staleTime: 15_000,
    placeholderData: keepPreviousData
  });

export const useCreateExpenseInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { centerId?: number; supplierId?: number; categoryId: number; invoiceNo?: string; invoiceDate: string; dueDate?: string; description: string; amount: number; }) => financeV2Api.createExpenseInvoice(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...FINANCE_V2_QUERY_KEYS.all, "expenses"] });
    }
  });
};

export const useApproveExpenseInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeV2Api.approveExpenseInvoice(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...FINANCE_V2_QUERY_KEYS.all, "expenses"] });
    }
  });
};

export const usePayExpenseInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { amount: number; financeAccountId: number; notes?: string } }) => financeV2Api.payExpenseInvoice(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...FINANCE_V2_QUERY_KEYS.all, "expenses"] });
    }
  });
};


export const useFinanceV2ReportFinancialPositionQuery = (params: { centerId?: number; asOf?: string }) =>
  useQuery({
    queryKey: [...FINANCE_V2_QUERY_KEYS.reportsFinancialPosition(params.centerId), params.asOf],
    queryFn: () => financeV2Api.getReportFinancialPosition(params),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });

export const useFinanceV2ReportStatementOfActivitiesQuery = (params: { centerId?: number; from?: string; to?: string }) =>
  useQuery({
    queryKey: [...FINANCE_V2_QUERY_KEYS.reportsStatementOfActivities(params.centerId), params.from, params.to],
    queryFn: () => financeV2Api.getReportStatementOfActivities(params),
    staleTime: 20_000,
    placeholderData: keepPreviousData
  });
