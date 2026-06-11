import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";

export type AccountingAccountType = "ASSET" | "LIABILITY" | "NET_ASSET" | "REVENUE" | "EXPENSE";
export type AccountingNormalBalance = "DEBIT" | "CREDIT";
export type JournalEntryStatus = "DRAFT" | "POSTED" | "VOID";
export type JournalSourceType =
  | "INVOICE"
  | "PAYMENT"
  | "VOUCHER"
  | "FUND_TRANSFER"
  | "MANUAL"
  | "PAYROLL"
  | "REWARD"
  | "DEDUCTION"
  | "EXPENSE_INVOICE"
  | "EXPENSE_PAYMENT"
  | "ASSET_ACQUISITION"
  | "ASSET_DEPRECIATION";

export type FiscalPeriodStatus = "OPEN" | "CLOSED";

export type FiscalYear = {
  id: number;
  organizationId: number;
  year: number;
  startDate: string;
  endDate: string;
  status: FiscalPeriodStatus;
  closedAt?: string | null;
  closedById?: number | null;
  closedBy?: { id: number; fullName: string } | null;
  periods: FiscalPeriod[];
};

export type CreateFiscalYearPayload = {
  year: number;
  startDate: string;
  endDate: string;
  periodType: "MONTHLY" | "QUARTERLY";
};

export type FiscalPeriod = {
  id: number;
  organizationId: number;
  fiscalYearId: number;
  periodNumber: number;
  periodName: string;
  startDate: string;
  endDate: string;
  status: FiscalPeriodStatus;
  closedAt?: string | null;
  closedById?: number | null;
  fiscalYear: {
    id: number;
    year: number;
    status: FiscalPeriodStatus;
  };
  closedBy?: { id: number; fullName: string } | null;
  _count: { journalEntries: number };
  debit: number;
  credit: number;
};

export type AccountingCenter = {
  id: number;
  name: string;
};

export type AccountingAccount = {
  id: number;
  organizationId: number;
  centerId: number | null;
  parentId: number | null;
  code: string;
  name: string;
  type: AccountingAccountType;
  normalBalance: AccountingNormalBalance;
  isActive: boolean;
  systemKey?: string | null;
};

export type UpsertAccountingAccountPayload = {
  centerId?: number;
  parentId?: number;
  code: string;
  type: AccountingAccountType;
  name: string;
};

export type CreateJournalEntryPayload = {
  centerId?: number;
  entryDate: string;
  sourceType: JournalSourceType;
  sourceId?: number;
  description: string;
  lines: Array<{
    accountId: number;
    debit: number;
    credit: number;
    memo?: string;
  }>;
};

export type JournalEntryLine = {
  id: number;
  journalEntryId: number;
  organizationId: number;
  centerId: number | null;
  accountId: number;
  debit: number;
  credit: number;
  memo?: string | null;
  sourceLineType?: JournalSourceType | null;
  sourceLineId?: number | null;
  account?: Pick<AccountingAccount, "id" | "code" | "name" | "type" | "normalBalance">;
  center?: AccountingCenter | null;
};

export type JournalEntry = {
  id: number;
  organizationId: number;
  centerId: number | null;
  entryNo: string;
  entryDate: string;
  sourceType: JournalSourceType;
  sourceId?: number | null;
  status: JournalEntryStatus;
  description?: string | null;
  postedAt?: string | null;
  center?: AccountingCenter | null;
  postedBy?: { id: number; fullName: string } | null;
  lines: JournalEntryLine[];
};

export type LedgerResponse = {
  account: AccountingAccount;
  opening: {
    debit: number;
    credit: number;
    balance: number;
  };
  totals: {
    debit: number;
    credit: number;
    balance: number;
  };
  closing: {
    balance: number;
  };
  rows: Array<
    JournalEntryLine & {
      journalEntry: Pick<JournalEntry, "id" | "entryNo" | "entryDate" | "sourceType" | "sourceId">;
    }
  >;
};

export type TrialBalanceResponse = {
  rows: Array<{
    account: Pick<AccountingAccount, "id" | "code" | "name" | "type" | "normalBalance">;
    debit: number;
    credit: number;
    balance: number;
  }>;
  totals: {
    debit: number;
    credit: number;
    balanced: boolean;
  };
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return value.toISOString();
  return null;
};

const normalizeAccount = (account: AccountingAccount): AccountingAccount => ({
  ...account,
  id: Number(account.id),
  organizationId: Number(account.organizationId),
  centerId: account.centerId === null || account.centerId === undefined ? null : Number(account.centerId),
  parentId: account.parentId === null || account.parentId === undefined ? null : Number(account.parentId),
  isActive: Boolean(account.isActive)
});

const normalizeLine = (line: JournalEntryLine): JournalEntryLine => ({
  ...line,
  id: Number(line.id),
  journalEntryId: Number(line.journalEntryId),
  organizationId: Number(line.organizationId),
  centerId: line.centerId === null || line.centerId === undefined ? null : Number(line.centerId),
  accountId: Number(line.accountId),
  debit: toNumber(line.debit),
  credit: toNumber(line.credit)
});

const normalizeJournalEntry = (entry: JournalEntry): JournalEntry => ({
  ...entry,
  id: Number(entry.id),
  organizationId: Number(entry.organizationId),
  centerId: entry.centerId === null || entry.centerId === undefined ? null : Number(entry.centerId),
  entryNo: toNullableString(entry.entryNo) ?? "-",
  entryDate: toNullableString(entry.entryDate) ?? "",
  description: toNullableString(entry.description),
  postedAt: toNullableString(entry.postedAt),
  lines: (entry.lines ?? []).map((line) => normalizeLine(line))
});

export const accountingApi = {
  async getFiscalYears(): Promise<FiscalYear[]> {
    const response = await apiClient.get<ApiResponse<FiscalYear[]>>("/accounting/fiscal-years");
    return response.data.data;
  },

  async createFiscalYear(payload: CreateFiscalYearPayload): Promise<FiscalYear> {
    const response = await apiClient.post<ApiResponse<FiscalYear>>("/accounting/fiscal-years", payload);
    return response.data.data;
  },

  async getFiscalPeriods(): Promise<FiscalPeriod[]> {
    const response = await apiClient.get<ApiResponse<FiscalPeriod[]>>("/accounting/fiscal-periods");
    return response.data.data;
  },

  async closeFiscalPeriod(periodId: number): Promise<FiscalPeriod> {
    const response = await apiClient.post<ApiResponse<FiscalPeriod>>(
      `/accounting/fiscal-periods/${periodId}/close`,
      {}
    );
    return response.data.data;
  },

  async reopenFiscalPeriod(periodId: number): Promise<FiscalPeriod> {
    const response = await apiClient.post<ApiResponse<FiscalPeriod>>(
      `/accounting/fiscal-periods/${periodId}/reopen`,
      {}
    );
    return response.data.data;
  },


  async getAccounts(): Promise<AccountingAccount[]> {
    const response = await apiClient.get<ApiResponse<AccountingAccount[]>>("/accounting/accounts");
    return response.data.data.map((account) => normalizeAccount(account));
  },

  async createAccount(payload: UpsertAccountingAccountPayload): Promise<AccountingAccount> {
    const response = await apiClient.post<ApiResponse<AccountingAccount>>("/accounting/accounts", payload);
    return normalizeAccount(response.data.data);
  },

  async updateAccount(accountId: number, payload: UpsertAccountingAccountPayload): Promise<AccountingAccount> {
    const response = await apiClient.patch<ApiResponse<AccountingAccount>>(
      `/accounting/accounts/${accountId}`,
      payload
    );
    return normalizeAccount(response.data.data);
  },

  async getJournalEntries(): Promise<JournalEntry[]> {
    const response = await apiClient.get<ApiResponse<JournalEntry[]>>("/accounting/journal-entries");
    return response.data.data.map((entry) => normalizeJournalEntry(entry));
  },

  async createJournalEntry(payload: CreateJournalEntryPayload): Promise<JournalEntry> {
    const response = await apiClient.post<ApiResponse<JournalEntry>>("/accounting/journal-entries", payload);
    return normalizeJournalEntry(response.data.data);
  },

  async postJournalEntry(entryId: number): Promise<JournalEntry> {
    const response = await apiClient.post<ApiResponse<JournalEntry>>(
      `/accounting/journal-entries/${entryId}/post`,
      {}
    );
    return normalizeJournalEntry(response.data.data);
  },

  async getLedger(accountId: number): Promise<LedgerResponse> {
    const response = await apiClient.get<ApiResponse<LedgerResponse>>("/accounting/ledger", {
      params: { accountId }
    });
    const data = response.data.data;

    return {
      ...data,
      account: normalizeAccount(data.account),
      opening: {
        debit: toNumber(data.opening.debit),
        credit: toNumber(data.opening.credit),
        balance: toNumber(data.opening.balance)
      },
      totals: {
        debit: toNumber(data.totals.debit),
        credit: toNumber(data.totals.credit),
        balance: toNumber(data.totals.balance)
      },
      closing: {
        balance: toNumber(data.closing.balance)
      },
      rows: data.rows.map((row) => ({
        ...normalizeLine(row),
        journalEntry: {
          ...row.journalEntry,
          id: Number(row.journalEntry.id),
          entryNo: toNullableString(row.journalEntry.entryNo) ?? "-",
          entryDate: toNullableString(row.journalEntry.entryDate) ?? ""
        }
      }))
    };
  },

  async getTrialBalance(): Promise<TrialBalanceResponse> {
    const response = await apiClient.get<ApiResponse<TrialBalanceResponse>>("/accounting/trial-balance");
    const data = response.data.data;

    return {
      rows: data.rows.map((row) => ({
        ...row,
        debit: toNumber(row.debit),
        credit: toNumber(row.credit),
        balance: toNumber(row.balance)
      })),
      totals: {
        debit: toNumber(data.totals.debit),
        credit: toNumber(data.totals.credit),
        balanced: Boolean(data.totals.balanced)
      }
    };
  }
};
