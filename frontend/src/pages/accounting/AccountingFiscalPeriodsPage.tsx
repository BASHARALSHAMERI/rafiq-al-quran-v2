import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Plus,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Search,
  Filter,
  RotateCcw,
  ChevronDown
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import { useAuthStore } from "../../features/auth/auth.store";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";
import { notifyError, notifySuccess } from "../../shared/ui/feedback";
import {
  FinancePageShell,
  FinancePageHeader,
  FinanceEmptyState,
  FinanceConfirmModal,
  FinanceMoney,
  FinanceDataTable,
  financeActionsColumn,
  type FinanceDataTableColumn
} from "../../features/finance-v2/design";
import { accountingLinks, formatDate } from "./AccountingShared";
import {
  useFiscalYearsQuery,
  useFiscalPeriodsQuery,
  useCreateFiscalYearMutation,
  useCloseFiscalPeriodMutation,
  useReopenFiscalPeriodMutation
} from "./accounting.hooks";
import type { FiscalPeriod, CreateFiscalYearPayload } from "./accounting.api";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/vouchers-premium.css";
import "../../styles/pages/finance-v4.css";

type FiscalYearFormState = {
  year: string;
  startDate: string;
  endDate: string;
  periodType: "MONTHLY" | "QUARTERLY";
};

const currentYear = new Date().getFullYear();

const emptyForm = (): FiscalYearFormState => ({
  year: String(currentYear),
  startDate: `${currentYear}-01-01`,
  endDate: `${currentYear}-12-31`,
  periodType: "MONTHLY"
});

export default function AccountingFiscalPeriodsPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER";

  const fiscalYearsQ = useFiscalYearsQuery();
  const periodsQ = useFiscalPeriodsQuery();
  const createFiscalYearM = useCreateFiscalYearMutation();
  const closeFiscalPeriodM = useCloseFiscalPeriodMutation();
  const reopenFiscalPeriodM = useReopenFiscalPeriodMutation();

  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "OPEN" | "CLOSED">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState<FiscalYearFormState>(emptyForm());
  const [formError, setFormError] = useState("");
  const [periodToClose, setPeriodToClose] = useState<number | null>(null);
  const [periodToReopen, setPeriodToReopen] = useState<number | null>(null);

  const fiscalYears = fiscalYearsQ.data ?? [];
  const allPeriods = periodsQ.data ?? [];

  const filteredPeriods = useMemo(() => {
    return allPeriods.filter((p) => {
      const matchesYear =
        selectedYearFilter === "all" || p.fiscalYear.year === Number(selectedYearFilter);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesSearch =
        !searchTerm.trim() ||
        String(p.periodNumber).includes(searchTerm) ||
        (p.periodName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(p.fiscalYear.year).includes(searchTerm);
      return matchesYear && matchesStatus && matchesSearch;
    });
  }, [allPeriods, selectedYearFilter, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = allPeriods.length;
    const open = allPeriods.filter((p) => p.status === "OPEN").length;
    return { years: fiscalYears.length, totalPeriods: total, openPeriods: open };
  }, [allPeriods, fiscalYears]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.year || !form.startDate || !form.endDate) {
      setFormError("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    const payload: CreateFiscalYearPayload = {
      year: Number(form.year),
      startDate: form.startDate,
      endDate: form.endDate,
      periodType: form.periodType
    };
    try {
      const created = await createFiscalYearM.mutateAsync(payload);
      notifySuccess(
        `تم إنشاء السنة المالية ${created.year} بنجاح مع ${created.periods.length} فترة`
      );
      setCreateModalOpen(false);
      setForm(emptyForm());
      periodsQ.refetch();
    } catch (err) {
      const msg = getLocalizedApiErrorMessage(err, {
        ar: true,
        fallback: err instanceof Error ? err.message : "تعذر إنشاء السنة المالية"
      });
      setFormError(msg);
      notifyError(msg);
    }
  };

  const handleClosePeriod = async () => {
    if (!periodToClose) return;
    try {
      await closeFiscalPeriodM.mutateAsync(periodToClose);
      notifySuccess("تم إغلاق الفترة المالية بنجاح");
      setPeriodToClose(null);
      periodsQ.refetch();
    } catch (err) {
      notifyError(
        getLocalizedApiErrorMessage(err, {
          ar: true,
          fallback: err instanceof Error ? err.message : "تعذر إغلاق الفترة"
        })
      );
    }
  };

  const handleReopenPeriod = async () => {
    if (!periodToReopen) return;
    try {
      await reopenFiscalPeriodM.mutateAsync(periodToReopen);
      notifySuccess("تم إعادة فتح الفترة المالية بنجاح");
      setPeriodToReopen(null);
      periodsQ.refetch();
    } catch (err) {
      notifyError(
        getLocalizedApiErrorMessage(err, {
          ar: true,
          fallback: err instanceof Error ? err.message : "تعذر إعادة فتح الفترة"
        })
      );
    }
  };

  const handleYearChange = (year: string) => {
    const y = Number(year);
    setForm((prev) => ({
      ...prev,
      year,
      startDate: Number.isFinite(y) && y > 1990 ? `${y}-01-01` : prev.startDate,
      endDate: Number.isFinite(y) && y > 1990 ? `${y}-12-31` : prev.endDate
    }));
  };

  const columns: FinanceDataTableColumn<FiscalPeriod>[] = useMemo(
    () => [
      {
        id: "periodNumber",
        header: "#",
        align: "start",
        cell: (_, idx) => <span className="text-gray-400 text-xs font-bold tabular-nums">{idx + 1}</span>
      },
      {
        id: "periodNumberValue",
        header: "رقم الفترة",
        align: "start",
        cell: (p) => <strong className="text-slate-900 dark:text-slate-100 font-mono">فترة {p.periodNumber}</strong>
      },
      {
        id: "fiscalYear",
        header: "السنة المالية",
        align: "start",
        cell: (p) => <Badge variant="default" size="sm">السنة المالية {p.fiscalYear.year}</Badge>
      },
      {
        id: "startDate",
        header: "تاريخ البداية",
        align: "start",
        cell: (p) => <span className="text-slate-500">{formatDate(p.startDate)}</span>
      },
      {
        id: "endDate",
        header: "تاريخ النهاية",
        align: "start",
        cell: (p) => <span className="text-slate-500">{formatDate(p.endDate)}</span>
      },
      {
        id: "status",
        header: "الحالة",
        align: "start",
        cell: (p) => (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            p.status === "OPEN" 
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" 
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}>
            {p.status === "OPEN" ? "مفتوحة" : "مغلقة"}
          </span>
        )
      },
      {
        id: "entriesCount",
        header: "القيود",
        align: "start",
        cell: (p) => <span className="font-mono font-bold">{p._count.journalEntries.toLocaleString("ar-YE-u-nu-latn")}</span>
      },
      {
        id: "debit",
        header: "المدين",
        align: "start",
        cell: (p) => <div className="font-mono font-bold text-emerald-600"><FinanceMoney amount={p.debit} baseCurrency="ر.ي" /></div>
      },
      {
        id: "credit",
        header: "الدائن",
        align: "start",
        cell: (p) => <div className="font-mono font-bold text-rose-600"><FinanceMoney amount={p.credit} baseCurrency="ر.ي" /></div>
      },
      financeActionsColumn("إجراءات", (p: FiscalPeriod) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="fin-action-btn view"
            title="عرض القيود"
            onClick={() => navigate(`/finance/accounting/journal-entries?periodId=${p.id}`)}
          >
            <Eye size={14} />
          </button>
          {canManage && (
            p.status === "OPEN" ? (
              <button
                type="button"
                className="fin-action-btn border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                title="إغلاق الفترة"
                onClick={() => setPeriodToClose(p.id)}
              >
                <Unlock size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="fin-action-btn border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                title="إعادة فتح الفترة"
                onClick={() => setPeriodToReopen(p.id)}
              >
                <Lock size={14} />
              </button>
            )
          )}
        </div>
      ))
    ],
    [canManage, navigate]
  );

  const pageStyles = `
    /* KPI Cards Styling - Restored to default look */
    .ctr-kpis-modern .ctr-kpi-modern {
      border-radius: 16px !important;
      transition: all 0.2s ease !important;
    }

    /* Filters Styling */
    .fin-filters-container .fin-filter-item {
      min-width: 200px !important;
      height: 42px !important;
      cursor: pointer !important;
      transition: all 0.2s ease-in-out !important;
      position: relative !important;
    }
    .fin-filters-container .fin-filter-item:hover {
      background-color: #f0f2f5 !important;
      border-color: var(--brand-500, #247d7e) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
    }
    [data-theme="dark"] .fin-filters-container .fin-filter-item:hover {
      background-color: rgba(255, 255, 255, 0.08) !important;
    }
    .fin-filters-container .fin-filter-item select {
      cursor: pointer !important;
    }

    /* Table Header Heights */
    .fin-premium-table thead th {
      padding: 16px 20px !important;
      height: 52px !important;
      vertical-align: middle !important;
    }

    /* Table Spacing & Lines */
    .fin-premium-table {
      border-spacing: 0 12px !important;
    }
    .fin-floating-row td {
      padding-top: 14px !important;
      padding-bottom: 14px !important;
      border-top: 1px solid var(--border-subtle, #e2e8f0) !important;
      border-bottom: 1px solid var(--border-subtle, #e2e8f0) !important;
    }
    .fin-floating-row td:first-child {
      border-inline-start: 6px solid var(--brand-500, #247d7e) !important;
      border-top-right-radius: 16px !important;
      border-bottom-right-radius: 16px !important;
    }
    .fin-floating-row td:last-child {
      border-inline-end: 1px solid var(--border-subtle, #e2e8f0) !important;
      border-top-left-radius: 16px !important;
      border-bottom-left-radius: 16px !important;
    }

    /* Calm & Soft Row Hover */
    .fin-premium-table .fin-floating-row:hover {
      transform: none !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03) !important;
    }
    .fin-premium-table .fin-floating-row:hover td {
      background-color: #f8fafc !important;
      border-top-color: var(--brand-300, #4ea3a5) !important;
      border-bottom-color: var(--brand-300, #4ea3a5) !important;
    }
    .fin-premium-table .fin-floating-row:hover td:last-child {
      border-inline-end-color: var(--brand-300, #4ea3a5) !important;
    }
    [data-theme="dark"] .fin-premium-table .fin-floating-row:hover td {
      background-color: rgba(255, 255, 255, 0.02) !important;
      border-top-color: var(--brand-700, #1b5e5f) !important;
      border-bottom-color: var(--brand-700, #1b5e5f) !important;
    }
    [data-theme="dark"] .fin-premium-table .fin-floating-row:hover td:last-child {
      border-inline-end-color: var(--brand-700, #1b5e5f) !important;
    }

    /* Sticky Actions Column */
    .fin-premium-table th.app-data-table__header--actions,
    .fin-premium-table td.app-data-table__cell--actions {
      position: sticky !important;
      left: 0 !important;
      z-index: 10 !important;
      background-color: var(--bg-card, #fff) !important;
      box-shadow: 4px 0 10px rgba(0, 0, 0, 0.04) !important;
      border-inline-start: 1px solid var(--border-subtle, #e2e8f0) !important;
    }
    .fin-premium-table th.app-data-table__header--actions {
      background-color: var(--bg-subtle, #f8fafc) !important;
      border-bottom: 1px solid var(--border-default, #e2e8f0) !important;
    }
    [data-theme="dark"] .fin-premium-table th.app-data-table__header--actions,
    [data-theme="dark"] .fin-premium-table td.app-data-table__cell--actions {
      background-color: #1a1a1a !important;
      border-inline-start-color: #2a2a2a !important;
    }
  `;

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir="rtl"
      header={
        <div className="fin-premium-header">
          <style>{pageStyles}</style>
          <FinancePageHeader
            title="الفترات المالية"
            subtitle="إدارة فترات السنة المالية"
            icon={<CalendarClock className="w-6 h-6 text-brand-600" />}
            actions={
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="glass-btn"
                  leftIcon={<RefreshCw className={`w-4 h-4 ${periodsQ.isLoading ? "animate-spin" : ""}`} />}
                  onClick={() => {
                    periodsQ.refetch();
                    fiscalYearsQ.refetch();
                  }}
                >
                  تحديث
                </Button>
                {canManage && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-lg shadow-brand-500/20"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      setForm(emptyForm());
                      setFormError("");
                      setCreateModalOpen(true);
                    }}
                  >
                    فترة جديدة
                  </Button>
                )}
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
          <motion.div className="ctr-kpi-modern brand" whileHover={{ y: -4 }}>
            <div className="ctr-kpi-icon-wrap"><CalendarClock size={24} /></div>
            <div className="ctr-kpi-content">
              <span className="ctr-kpi-val">{stats.years}</span>
              <span className="ctr-kpi-label">سنة مالية</span>
            </div>
          </motion.div>
          <motion.div className="ctr-kpi-modern amber" whileHover={{ y: -4 }}>
            <div className="ctr-kpi-icon-wrap"><BookOpen size={24} /></div>
            <div className="ctr-kpi-content">
              <span className="ctr-kpi-val">{stats.totalPeriods}</span>
              <span className="ctr-kpi-label">إجمالي الفترات</span>
            </div>
          </motion.div>
          <motion.div className="ctr-kpi-modern emerald" whileHover={{ y: -4 }}>
            <div className="ctr-kpi-icon-wrap"><CheckCircle2 size={24} /></div>
            <div className="ctr-kpi-content">
              <span className="ctr-kpi-val">{stats.openPeriods}</span>
              <span className="ctr-kpi-label">فترة مفتوحة</span>
            </div>
          </motion.div>
          <motion.div className="ctr-kpi-modern rose" whileHover={{ y: -4 }}>
            <div className="ctr-kpi-icon-wrap"><Lock size={24} /></div>
            <div className="ctr-kpi-content">
              <span className="ctr-kpi-val">{stats.totalPeriods - stats.openPeriods}</span>
              <span className="ctr-kpi-label">فترة مغلقة</span>
            </div>
          </motion.div>
        </div>
      }
      toolbar={
        <div className="fin-filters-container" style={{ padding: "12px 20px", marginBottom: "0px" }}>
          <div className="fin-filters-scroll">
            {/* Search Input */}
            <div className="fin-filter-item" style={{ minWidth: 240 }}>
              <Search className="fin-filter-icon" size={16} />
              <input
                type="text"
                placeholder="بحث برقم الفترة أو السنة المالية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Fiscal Year Filter */}
            <div className="fin-filter-item" style={{ minWidth: 200, height: 42, position: "relative" }}>
              <Filter className="fin-filter-icon" size={16} />
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                style={{ paddingInlineStart: "36px", paddingInlineEnd: "32px", appearance: "none" }}
              >
                <option value="all">كل السنوات المالية</option>
                {fiscalYears.map((y) => (
                  <option key={y.id} value={y.year}>
                    السنة المالية {y.year}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
            </div>

            {/* Status Filter */}
            <div className="fin-filter-item" style={{ minWidth: 200, height: 42, position: "relative" }}>
              <Filter className="fin-filter-icon" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "OPEN" | "CLOSED")}
                style={{ paddingInlineStart: "36px", paddingInlineEnd: "32px", appearance: "none" }}
              >
                <option value="all">كل الحالات</option>
                <option value="OPEN">مفتوحة</option>
                <option value="CLOSED">مغلقة</option>
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
            </div>
          </div>

          {(selectedYearFilter !== "all" || statusFilter !== "all" || searchTerm) && (
            <button
              type="button"
              className="fin-filter-reset"
              onClick={() => {
                setSelectedYearFilter("all");
                setStatusFilter("all");
                setSearchTerm("");
              }}
            >
              <RotateCcw size={14} />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>
      }
    >
      <hr className="my-8 border-slate-200 dark:border-slate-800" />
      <div className="fin-premium-panel animate-premium">
        <div className="fin-premium-panel__content" style={{ padding: 0 }}>
          {periodsQ.isLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
              <span className="text-slate-500 font-medium">جاري تحميل الفترات المالية...</span>
            </div>
          ) : periodsQ.isError ? (
            <div className="circlemod-error p-6 m-4 animate-premium" role="alert">
              <AlertCircle size={16} />
              <span>{getLocalizedApiErrorMessage(periodsQ.error, { ar: true, fallback: "تعذر تحميل البيانات" })}</span>
            </div>
          ) : filteredPeriods.length === 0 ? (
            <FinanceEmptyState
              variant={selectedYearFilter !== "all" ? "filtered" : "first-time"}
              title={selectedYearFilter !== "all" ? "لا توجد نتائج" : "لا توجد فترات مالية"}
              description={selectedYearFilter !== "all" ? "جرب تعديل اختيار السنة المالية" : "أنشئ السنة المالية الأولى لتفعيل الفترات وتوليدها تلقائياً"}
              action={
                selectedYearFilter !== "all" ? (
                  <Button variant="secondary" onClick={() => setSelectedYearFilter("all")}>
                    مسح الفلاتر
                  </Button>
                ) : canManage ? (
                  <Button
                    variant="primary"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      setForm(emptyForm());
                      setFormError("");
                      setCreateModalOpen(true);
                    }}
                  >
                    إنشاء سنة مالية
                  </Button>
                ) : null
              }
            />
          ) : (
            <FinanceDataTable<FiscalPeriod>
              rows={filteredPeriods}
              columns={columns}
              rowKey="id"
              className="fin-premium-table"
              rowClassName={() => "fin-floating-row"}
            />
          )}
        </div>
      </div>

      {/* مودال إنشاء سنة مالية */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          if (createFiscalYearM.isPending) return;
          setCreateModalOpen(false);
          setFormError("");
        }}
        title="إنشاء سنة مالية جديدة"
        titleIcon={
          <div className="circlemod-head-icon">
            <CalendarClock className="w-4 h-4" />
          </div>
        }
        size="lg"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button
              variant="ghost"
              onClick={() => setCreateModalOpen(false)}
              disabled={createFiscalYearM.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              form="fiscal-year-form"
              isLoading={createFiscalYearM.isPending}
            >
              إنشاء السنة المالية
            </Button>
          </div>
        }
      >
        <form
          id="fiscal-year-form"
          className="circlemod-form"
          onSubmit={handleCreate}
        >
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <CalendarClock size={15} className="circlemod-section-icon" />
              <span>بيانات السنة المالية</span>
            </div>

            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <p className="font-medium">سيتم توليد الفترات تلقائياً</p>
              <p className="text-xs mt-0.5 text-amber-700">
                اختر التقسيم الشهري (12 فترة) أو الربعي (4 فترات)
              </p>
            </div>

            <div className="circlemod-form-grid">
              <div className="circlemod-field">
                <label>السنة *</label>
                <input
                  className="circlemod-input"
                  type="number"
                  min={2000}
                  max={2100}
                  value={form.year}
                  onChange={(e) => handleYearChange(e.target.value)}
                  required
                />
              </div>

              <div className="circlemod-field">
                <label>نوع التقسيم *</label>
                <select
                  className="circlemod-select"
                  value={form.periodType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, periodType: e.target.value as "MONTHLY" | "QUARTERLY" }))
                  }
                >
                  <option value="MONTHLY">شهري (12 فترة)</option>
                  <option value="QUARTERLY">ربعي (4 فترات)</option>
                </select>
              </div>

              <div className="circlemod-field">
                <label>تاريخ البداية *</label>
                <input
                  className="circlemod-input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>

              <div className="circlemod-field">
                <label>تاريخ النهاية *</label>
                <input
                  className="circlemod-input"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            {formError && (
              <div className="circlemod-error mt-3">
                <AlertCircle size={14} />
                <span>{formError}</span>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* مودال تأكيد إغلاق الفترة */}
      <FinanceConfirmModal
        isOpen={Boolean(periodToClose)}
        onClose={() => setPeriodToClose(null)}
        onConfirm={handleClosePeriod}
        isConfirming={closeFiscalPeriodM.isPending}
        title="إغلاق الفترة المالية"
        message="هل أنت متأكد من إغلاق هذه الفترة المالية؟ لن تتمكن من إنشاء أو ترحيل أي قيد بتاريخ يقع داخلها بعد الإغلاق. هذا الإجراء لا يمكن التراجع عنه."
        confirmLabel="إغلاق الفترة"
        tone="danger"
      />

      {/* مودال تأكيد إعادة فتح الفترة */}
      <FinanceConfirmModal
        isOpen={Boolean(periodToReopen)}
        onClose={() => setPeriodToReopen(null)}
        onConfirm={handleReopenPeriod}
        isConfirming={reopenFiscalPeriodM.isPending}
        title="إعادة فتح الفترة المالية"
        message="هل تريد بالتأكيد إعادة فتح هذه الفترة المالية المغلقة؟ سيسمح ذلك مجدداً بترحيل وتعديل القيود والعمليات المحاسبية ضمن تاريخ هذه الفترة."
        confirmLabel="إعادة فتح"
        tone="warning"
      />
    </FinancePageShell>
  );
}
