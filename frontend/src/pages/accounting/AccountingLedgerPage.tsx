import { useEffect, useMemo, useState } from "react";
import { BookOpen, Printer, RefreshCw, CheckCircle, Clock, FileText, Filter, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import {
  FinancePageShell,
  FinancePageHeader,
  FinanceEmptyState,
  FinanceMoney,
  FinanceDataTable,
  FinanceTableFooter
} from "../../features/finance-v2/design";
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
import { useOrgBrandingQuery } from "../../features/org/org.hooks";
import { NavLink } from "react-router-dom";
import { ErrorState } from "../../components/ui/ErrorState";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";
import useClientPagination from "../../shared/ui/useClientPagination";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/vouchers-premium.css";
import "../../styles/pages/finance-v4.css";

const AR_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type LedgerRow = LedgerResponse["rows"][number];

const columns: Array<AccountingColumn<LedgerRow>> = [
  {
    id: "date",
    width: "10%",
    header: "التاريخ",
    cell: (row) => <span className="opacity-70 font-medium">{formatDate(row.journalEntry.entryDate)}</span>
  },
  {
    id: "entryNo",
    width: "10%",
    header: "رقم القيد",
    cell: (row) => <strong className="text-slate-900 dark:text-slate-100">{row.journalEntry.entryNo}</strong>
  },
  {
    id: "source",
    width: "10%",
    header: "المصدر",
    cell: (row) => (
      <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
        {sourceTypeLabels[row.journalEntry.sourceType]}
      </span>
    )
  },
  {
    id: "memo",
    width: "38%",
    cellClassName: "!text-start",
    header: "البيان",
    cell: (row) => (
      <span className="text-slate-600 dark:text-slate-400 font-medium block truncate" title={row.memo || undefined}>
        {row.memo || "-"}
      </span>
    )
  },
  {
    id: "center",
    width: "12%",
    header: "المركز",
    cell: (row) => (
      <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
        {row.center?.name ?? (row.centerId ? `مركز #${row.centerId}` : "عام")}
      </span>
    )
  },
  {
    id: "debit",
    headerClassName: "text-center",
    header: "مدين",
    cellClassName: "text-center whitespace-nowrap",
    cell: (row) => <div className="font-bold text-emerald-600 tabular-nums whitespace-nowrap">{formatMoney(row.debit)}</div>
  },
  {
    id: "credit",
    headerClassName: "text-center",
    header: "دائن",
    cellClassName: "text-center whitespace-nowrap",
    cell: (row) => <div className="font-bold text-rose-600 tabular-nums whitespace-nowrap">{formatMoney(row.credit)}</div>
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
  const brandingQ = useOrgBrandingQuery();
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
  const [filterMonth, setFilterMonth] = useState<number | "">("");
  const [filterYear, setFilterYear] = useState<number | "">("");

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const rowDate = new Date(row.journalEntry.entryDate);
      const matchesMonth = filterMonth === "" || (rowDate.getMonth() + 1) === filterMonth;
      const matchesYear = filterYear === "" || rowDate.getFullYear() === filterYear;
      return matchesMonth && matchesYear;
    });
  }, [rows, filterMonth, filterYear]);

  const pagination = useClientPagination(filteredRows, { initialPageSize: 10, resetKey: `${filterMonth}|${filterYear}` });

  const selectedAccount = useMemo(() => accounts.find(a => a.id === accountId), [accounts, accountId]);

  const handlePrint = () => {
    if (!ledger || !selectedAccount) return;

    printAccountingDocument({
      title: "كشف حساب (دفتر الأستاذ)",
      subtitle: `${selectedAccount.code} - ${selectedAccount.name}`,
      rows: filteredRows,
      logoUrl: brandingQ.data?.logoUrl || undefined,
      orgName: brandingQ.data?.name || undefined,
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
          <div className="fin-filters-scroll">
            <div className="fin-filter-item min-w-[200px]">
              <select
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
            {/* Month Filter */}
            <div className="fin-filter-item min-w-[140px]">
              <select 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">كل الأشهر</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{brandingQ.data?.language === "en" ? EN_MONTHS[i] : AR_MONTHS[i]}</option>
                ))}
              </select>
            </div>
            {/* Year Filter */}
            <div className="fin-filter-item w-28">
              <input
                type="number" min={2000} max={2100} 
                placeholder="السنة"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
          </div>
          {(filterMonth !== "" || filterYear !== "") && (
            <button 
              type="button"
              className="fin-filter-reset"
              onClick={() => { setFilterMonth(""); setFilterYear(""); }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>تصفير</span>
            </button>
          )}
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
          ) : filteredRows.length === 0 ? (
            <FinanceEmptyState
              variant="first-time"
              title={accounts.length === 0 ? "لا توجد حسابات محاسبية" : "لا توجد حركة لهذا الحساب"}
              description={accounts.length === 0 ? "يجب إضافة حسابات أولاً" : "لم يتم تسجيل أي قيود على هذا الحساب في التاريخ المحدد"}
            />
          ) : (
            <FinanceDataTable<LedgerRow>
              rows={pagination.pagedRows}
              columns={columns}
              rowKey="id"
              density="dense"
              rowClassName={(row) => (row.debit >= row.credit ? "receipt" : "disbursement")}
            />
          )}
        </div>
      </div>
      <FinanceTableFooter
        ar
        pageSize={pagination.pageSize}
        setPageSize={pagination.setPageSize}
        currentPage={pagination.currentPage}
        setPage={pagination.setCurrentPage}
        totalFilteredCount={pagination.totalItems}
        pages={pagination.totalPages}
      />
    </FinancePageShell>
  );
}
