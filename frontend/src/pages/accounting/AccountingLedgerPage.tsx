import { useEffect, useMemo, useState } from "react";
import { BookOpen, Printer, RefreshCw, CheckCircle, Clock, FileText, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import {
  FinancePageShell,
  FinancePageHeader,
  FinanceEmptyState,
  FinanceMoney
} from "../../features/finance-v2/design";
import DataTable from "../../components/ui/DataTable";
import {
  formatDate,
  formatMoney,
  sourceTypeLabels,
  accountingLinks,
  type AccountingColumn
} from "./AccountingShared";
import { useAccountingAccountsQuery, useAccountingLedgerQuery } from "./accounting.hooks";
import type { LedgerResponse } from "./accounting.api";
import { printAccountingDocument, formatArabicDate, formatYemeniCurrency } from "../../features/accounting/printAccounting";
import { NavLink } from "react-router-dom";
import { ErrorState } from "../../components/ui/ErrorState";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/vouchers-premium.css";
import "../../styles/pages/finance-v4.css";

type LedgerRow = LedgerResponse["rows"][number];

const columns: Array<AccountingColumn<LedgerRow>> = [
  {
    id: "date",
    header: "التاريخ",
    cell: (row) => <span className="opacity-70 font-medium">{formatDate(row.journalEntry.entryDate)}</span>
  },
  {
    id: "entryNo",
    header: "رقم القيد",
    cell: (row) => <strong className="text-slate-900 dark:text-slate-100">{row.journalEntry.entryNo}</strong>
  },
  {
    id: "source",
    header: "المصدر",
    cell: (row) => (
      <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
        {sourceTypeLabels[row.journalEntry.sourceType]}
      </span>
    )
  },
  {
    id: "memo",
    header: "البيان",
    cell: (row) => (
      <span className="text-slate-600 dark:text-slate-400 font-medium block max-w-[280px] truncate" title={row.memo || undefined}>
        {row.memo || "-"}
      </span>
    )
  },
  {
    id: "center",
    header: "المركز",
    cell: (row) => (
      <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
        {row.center?.name ?? (row.centerId ? `مركز #${row.centerId}` : "عام")}
      </span>
    )
  },
  {
    id: "debit",
    header: "مدين",
    align: "end",
    cell: (row) => <div className="font-bold text-emerald-600">{formatMoney(row.debit)}</div>
  },
  {
    id: "credit",
    header: "دائن",
    align: "end",
    cell: (row) => <div className="font-bold text-rose-600">{formatMoney(row.credit)}</div>
  }
];

function VouchersKpi({
  icon: Icon,
  cls,
  val,
  label
}: {
  icon: React.ElementType;
  cls: string;
  val: React.ReactNode;
  label: string;
}) {
  return (
    <motion.div
      className={`ctr-kpi-modern ${cls}`}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
    >
      <div className="ctr-kpi-icon-wrap">
        <Icon size={24} />
      </div>
      <div className="ctr-kpi-content">
        <span className="ctr-kpi-val">{val}</span>
        <span className="ctr-kpi-label">{label}</span>
      </div>
    </motion.div>
  );
}

export default function AccountingLedgerPage() {
  const accountsQ = useAccountingAccountsQuery();
  const accounts = useMemo(() => accountsQ.data ?? [], [accountsQ.data]);
  const [accountId, setAccountId] = useState<number | undefined>();

  useEffect(() => {
    if (!accountId && accounts[0]) {
      setAccountId(accounts[0].id);
    }
  }, [accountId, accounts]);

  const ledgerQ = useAccountingLedgerQuery(accountId);
  const ledger = ledgerQ.data;
  const rows = ledger?.rows ?? [];

  const selectedAccount = useMemo(() => accounts.find(a => a.id === accountId), [accounts, accountId]);

  const handlePrint = () => {
    if (!ledger || !selectedAccount) return;

    printAccountingDocument({
      title: "كشف حساب (دفتر الأستاذ)",
      subtitle: `${selectedAccount.code} - ${selectedAccount.name}`,
      rows: rows,
      summaryHtml: `
        <div style="display: flex; justify-content: space-between;">
          <div><strong>الرصيد الافتتاحي:</strong> ${formatYemeniCurrency(ledger.opening.balance)}</div>
          <div><strong>إجمالي المدين:</strong> ${formatYemeniCurrency(ledger.totals.debit)}</div>
          <div><strong>إجمالي الدائن:</strong> ${formatYemeniCurrency(ledger.totals.credit)}</div>
          <div><strong>الرصيد الختامي:</strong> ${formatYemeniCurrency(ledger.closing.balance)}</div>
        </div>
      `,
      columns: [
        { label: "التاريخ", render: (row) => formatArabicDate(row.journalEntry.entryDate), align: "center" },
        { label: "رقم القيد", render: (row) => row.journalEntry.entryNo, align: "center" },
        { label: "المصدر", render: (row) => sourceTypeLabels[row.journalEntry.sourceType], align: "center" },
        { label: "البيان", render: (row) => row.memo || "-" },
        { label: "مدين", render: (row) => row.debit.toLocaleString("ar-YE-u-nu-latn"), align: "left" },
        { label: "دائن", render: (row) => row.credit.toLocaleString("ar-YE-u-nu-latn"), align: "left" }
      ]
    });
  };

  const loading = accountsQ.isLoading || ledgerQ.isLoading || (Boolean(accountId) && !ledger && !ledgerQ.error);

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir="rtl"
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title="دفتر الأستاذ"
            subtitle="عرض حركة الحساب التفصيلية لجميع القيود المحاسبية المرحلة"
            icon={<BookOpen className="w-6 h-6 text-brand-600" />}
            actions={
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="glass-btn" 
                  leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />} 
                  onClick={() => { accountsQ.refetch(); ledgerQ.refetch(); }}
                >
                  تحديث
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="glass-btn" 
                  leftIcon={<Printer className="w-4 h-4" />} 
                  onClick={handlePrint}
                  disabled={!ledger}
                >
                  طباعة الكشف
                </Button>
              </div>
            }
          />
          <nav className="exams-tabs-bar mt-6" aria-label="روابط المحاسبة">
            {accountingLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink 
                  key={item.to} 
                  to={item.to} 
                  className={({ isActive }) => 
                    `exams-tab-btn ${isActive ? "exams-tab-btn--active" : ""}`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      }
      kpis={
        <div className="ctr-kpis-modern">
          <VouchersKpi 
            icon={Clock} 
            cls="brand" 
            val={<FinanceMoney amount={ledger?.opening.balance || 0} baseCurrency="YER" />} 
            label="رصيد افتتاحي" 
          />
          <VouchersKpi 
            icon={CheckCircle} 
            cls="emerald" 
            val={<FinanceMoney amount={ledger?.totals.debit || 0} baseCurrency="YER" />} 
            label="إجمالي مدين" 
          />
          <VouchersKpi 
            icon={CheckCircle} 
            cls="rose" 
            val={<FinanceMoney amount={ledger?.totals.credit || 0} baseCurrency="YER" />} 
            label="إجمالي دائن" 
          />
          <VouchersKpi 
            icon={FileText} 
            cls="violet" 
            val={<FinanceMoney amount={ledger?.closing.balance || 0} baseCurrency="YER" />} 
            label="الرصيد الختامي" 
          />
        </div>
      }
      toolbar={
        <div className="ctr-controls">
          <div className="ctr-filters-group">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border-none shadow-sm flex-1 min-w-[300px]">
              <Filter size={16} className="text-slate-400 ms-2" />
              <select
                className="ctr-filter-select border-none bg-transparent h-8 w-full focus:ring-0 outline-none"
                value={accountId ?? ""}
                onChange={(event) => setAccountId(Number(event.target.value) || undefined)}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      }
    >
      <div className="fin-premium-panel animate-premium">
        <div className="fin-premium-panel__content" style={{ padding: 0 }}>
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
              <span className="text-slate-500 font-medium">جاري جلب دفتر الأستاذ...</span>
            </div>
          ) : accountsQ.isError || ledgerQ.isError ? (
            <ErrorState
              title="تعذر تحميل دفتر الأستاذ"
              description={getLocalizedApiErrorMessage(accountsQ.error ?? ledgerQ.error, {
                ar: true,
                fallback: "تعذر تحميل حركة الحساب. حاول مرة أخرى."
              })}
              onRetry={() => {
                void accountsQ.refetch();
                void ledgerQ.refetch();
              }}
            />
          ) : rows.length === 0 ? (
            <FinanceEmptyState
              variant="first-time"
              title={accounts.length === 0 ? "لا توجد حسابات محاسبية" : "لا توجد حركة لهذا الحساب"}
              description={accounts.length === 0 ? "يجب إضافة حسابات أولاً" : "لم يتم تسجيل أي قيود على هذا الحساب"}
            />
          ) : (
            <DataTable<LedgerRow>
              rows={rows}
              columns={columns}
              rowKey="id"
              dense
            />
          )}
        </div>
      </div>
    </FinancePageShell>
  );
}
