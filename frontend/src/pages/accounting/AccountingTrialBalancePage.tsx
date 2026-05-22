import { Scale, Printer, RefreshCw, CheckCircle, AlertCircle, Search } from "lucide-react";
import { useState, useMemo } from "react";
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
  accountTypeLabels,
  formatMoney,
  normalBalanceLabels,
  accountingLinks,
  type AccountingColumn
} from "./AccountingShared";
import { useAccountingTrialBalanceQuery } from "./accounting.hooks";
import type { TrialBalanceResponse } from "./accounting.api";
import { printAccountingDocument, formatYemeniCurrency } from "../../features/accounting/printAccounting";
import { NavLink } from "react-router-dom";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/vouchers-premium.css";
import "../../styles/pages/finance-v4.css";

type TrialBalanceRow = TrialBalanceResponse["rows"][number];

const columns: Array<AccountingColumn<TrialBalanceRow>> = [
  {
    id: "account",
    header: "الحساب",
    cell: (row) => (
      <div className="flex flex-col gap-1">
        <strong className="text-slate-900 dark:text-slate-100">
          {row.account.code} - {row.account.name}
        </strong>
        <span className="text-xs text-slate-500">
          {accountTypeLabels[row.account.type]} / {normalBalanceLabels[row.account.normalBalance]}
        </span>
      </div>
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
  },
  {
    id: "balance",
    header: "الرصيد",
    align: "end",
    cell: (row) => <div className="font-bold text-brand-600">{formatMoney(row.balance)}</div>
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

export default function AccountingTrialBalancePage() {
  const trialBalanceQ = useAccountingTrialBalanceQuery();
  const data = trialBalanceQ.data;
  const rows = data?.rows ?? [];

  const [searchTerm, setSearchTerm] = useState("");

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const lower = searchTerm.toLowerCase();
    return rows.filter(
      (r) =>
        r.account.code.toLowerCase().includes(lower) ||
        r.account.name.toLowerCase().includes(lower)
    );
  }, [rows, searchTerm]);

  const handlePrint = () => {
    if (!data) return;

    printAccountingDocument({
      title: "ميزان المراجعة",
      subtitle: "الأرصدة الختامية لجميع الحسابات",
      rows: filteredRows,
      summaryHtml: `
        <div style="display: flex; justify-content: space-between;">
          <div><strong>إجمالي المدين:</strong> ${formatYemeniCurrency(data.totals.debit)}</div>
          <div><strong>إجمالي الدائن:</strong> ${formatYemeniCurrency(data.totals.credit)}</div>
          <div><strong>الفرق:</strong> ${formatYemeniCurrency(Math.abs(data.totals.debit - data.totals.credit))}</div>
          <div><strong>حالة الميزان:</strong> ${data.totals.balanced ? "متوازن" : "غير متوازن"}</div>
        </div>
      `,
      columns: [
        { label: "كود الحساب", render: (row) => row.account.code, align: "center" },
        { label: "اسم الحساب", render: (row) => row.account.name },
        { label: "النوع", render: (row) => accountTypeLabels[row.account.type], align: "center" },
        { label: "مدين", render: (row) => row.debit.toLocaleString("ar-YE-u-nu-latn"), align: "left" },
        { label: "دائن", render: (row) => row.credit.toLocaleString("ar-YE-u-nu-latn"), align: "left" },
        { label: "الرصيد", render: (row) => row.balance.toLocaleString("ar-YE-u-nu-latn"), align: "left" }
      ]
    });
  };

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir="rtl"
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title="ميزان المراجعة"
            subtitle="عرض إجماليات وأرصدة الحسابات للتحقق من التوازن"
            icon={<Scale className="w-6 h-6 text-brand-600" />}
            actions={
              <div className="flex items-center gap-3">
                {data && (
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm ${data.totals.balanced ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {data.totals.balanced ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {data.totals.balanced ? "متوازن" : "غير متوازن"}
                  </span>
                )}
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="glass-btn" 
                  leftIcon={<RefreshCw className={`w-4 h-4 ${trialBalanceQ.isLoading ? "animate-spin" : ""}`} />} 
                  onClick={() => trialBalanceQ.refetch()}
                >
                  تحديث
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="glass-btn" 
                  leftIcon={<Printer className="w-4 h-4" />} 
                  onClick={handlePrint}
                  disabled={!data}
                >
                  طباعة الميزان
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
            icon={Scale} 
            cls="brand" 
            val={rows.length.toLocaleString("ar-YE-u-nu-latn")} 
            label="عدد الحسابات" 
          />
          <VouchersKpi 
            icon={CheckCircle} 
            cls="emerald" 
            val={<FinanceMoney amount={data?.totals.debit || 0} baseCurrency="YER" />} 
            label="إجمالي مدين" 
          />
          <VouchersKpi 
            icon={CheckCircle} 
            cls="rose" 
            val={<FinanceMoney amount={data?.totals.credit || 0} baseCurrency="YER" />} 
            label="إجمالي دائن" 
          />
          <VouchersKpi 
            icon={AlertCircle} 
            cls="amber" 
            val={<FinanceMoney amount={data ? Math.abs(data.totals.debit - data.totals.credit) : 0} baseCurrency="YER" />} 
            label="الفرق" 
          />
        </div>
      }
      toolbar={
        <div className="ctr-controls">
          <div className="ctr-search-wrap">
            <Search className="ctr-search-icon" size={18} />
            <input 
              className="ctr-search-input"
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="بحث بالكود أو اسم الحساب..." 
            />
          </div>
        </div>
      }
    >
      <div className="fin-premium-panel animate-premium">
        <div className="fin-premium-panel__content" style={{ padding: 0 }}>
          {trialBalanceQ.isLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
              <span className="text-slate-500 font-medium">جاري جلب الميزان...</span>
            </div>
          ) : filteredRows.length === 0 ? (
            <FinanceEmptyState
              variant={searchTerm ? "filtered" : "first-time"}
              title={searchTerm ? "لا توجد نتائج" : "لا توجد أرصدة محاسبية"}
              description={searchTerm ? "جرب تعديل البحث" : "لم يتم تسجيل قيود أو حركات بعد"}
              action={searchTerm ? (
                <Button variant="secondary" onClick={() => setSearchTerm("")}>
                  مسح البحث
                </Button>
              ) : undefined}
            />
          ) : (
            <DataTable<TrialBalanceRow>
              rows={filteredRows}
              columns={columns}
              rowKey={(row) => row.account.id}
              dense
            />
          )}
        </div>
      </div>
    </FinancePageShell>
  );
}
