import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountingApi } from "./accounting.api";
import type { CreateFiscalYearPayload, CreateJournalEntryPayload, UpsertAccountingAccountPayload } from "./accounting.api";

export const ACCOUNTING_QUERY_KEYS = {
  all: ["accounting-preview"] as const,
  fiscalYears: () => [...ACCOUNTING_QUERY_KEYS.all, "fiscal-years"] as const,
  fiscalPeriods: () => [...ACCOUNTING_QUERY_KEYS.all, "fiscal-periods"] as const,
  accounts: () => [...ACCOUNTING_QUERY_KEYS.all, "accounts"] as const,
  journalEntries: () => [...ACCOUNTING_QUERY_KEYS.all, "journal-entries"] as const,
  ledger: (accountId?: number) => [...ACCOUNTING_QUERY_KEYS.all, "ledger", accountId ?? null] as const,
  trialBalance: () => [...ACCOUNTING_QUERY_KEYS.all, "trial-balance"] as const
};

export const useFiscalYearsQuery = () =>
  useQuery({
    queryKey: ACCOUNTING_QUERY_KEYS.fiscalYears(),
    queryFn: accountingApi.getFiscalYears,
    staleTime: 30_000
  });

export const useCreateFiscalYearMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFiscalYearPayload) => accountingApi.createFiscalYear(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.all });
    }
  });
};



export const useFiscalPeriodsQuery = () =>
  useQuery({
    queryKey: ACCOUNTING_QUERY_KEYS.fiscalPeriods(),
    queryFn: accountingApi.getFiscalPeriods,
    staleTime: 20_000
  });

export const useCloseFiscalPeriodMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: number) => accountingApi.closeFiscalPeriod(periodId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.all });
    }
  });
};

export const useReopenFiscalPeriodMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: number) => accountingApi.reopenFiscalPeriod(periodId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.all });
    }
  });
};

export const useAccountingAccountsQuery = (enabled = true) =>
  useQuery({
    queryKey: ACCOUNTING_QUERY_KEYS.accounts(),
    queryFn: accountingApi.getAccounts,
    enabled,
    staleTime: 20_000
  });

export const useCreateAccountingAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertAccountingAccountPayload) => accountingApi.createAccount(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.all });
    }
  });
};

export const useUpdateAccountingAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { accountId: number; payload: UpsertAccountingAccountPayload }) =>
      accountingApi.updateAccount(input.accountId, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.all });
    }
  });
};

export const useAccountingJournalEntriesQuery = () =>
  useQuery({
    queryKey: ACCOUNTING_QUERY_KEYS.journalEntries(),
    queryFn: accountingApi.getJournalEntries,
    staleTime: 20_000
  });

export const useCreateAccountingJournalEntryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJournalEntryPayload) => accountingApi.createJournalEntry(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.all });
    }
  });
};

export const usePostAccountingJournalEntryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: number) => accountingApi.postJournalEntry(entryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTING_QUERY_KEYS.all });
    }
  });
};

export const useAccountingLedgerQuery = (accountId?: number) =>
  useQuery({
    queryKey: ACCOUNTING_QUERY_KEYS.ledger(accountId),
    queryFn: () => accountingApi.getLedger(accountId ?? 0),
    enabled: Boolean(accountId),
    staleTime: 20_000
  });

export const useAccountingTrialBalanceQuery = () =>
  useQuery({
    queryKey: ACCOUNTING_QUERY_KEYS.trialBalance(),
    queryFn: accountingApi.getTrialBalance,
    staleTime: 20_000
  });
