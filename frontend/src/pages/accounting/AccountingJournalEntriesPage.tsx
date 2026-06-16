import { useMemo, useState } from "react";
import { FileText, Plus, Trash2, Printer, Search, Filter, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { useAuthStore } from "../../features/auth/auth.store";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";
import { notifyError, notifySuccess } from "../../shared/ui/feedback";
import {
  FinancePageShell,
  FinancePageHeader,
  FinanceEmptyState,
  FinanceMoney,
  FinanceDataTable,
  FinanceTableFooter
} from "../../features/finance-v2/design";
import { Badge } from "../../components/ui/Badge";
import { useI18n } from "../../app/i18n";
import {
  formatDate,
  formatMoney,
  journalStatusLabels,
  sourceTypeLabels,
  accountingLinks,
  type AccountingColumn
} from "./AccountingShared";
import {
  useAccountingAccountsQuery,
  useAccountingJournalEntriesQuery,
  useCreateAccountingJournalEntryMutation,
  usePostAccountingJournalEntryMutation
} from "./accounting.hooks";
import type { AccountingAccount, JournalEntry, JournalSourceType } from "./accounting.api";
import { printAccountingDocument } from "../../features/accounting/printAccounting";
import { useOrgBrandingQuery } from "../../features/org/org.hooks";
import { NavLink } from "react-router-dom";
import useClientPagination from "../../shared/ui/useClientPagination";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/vouchers-premium.css";
import "../../styles/pages/finance-v4.css";

const entryDebitTotal = (entry: JournalEntry) =>
  entry.lines.reduce((sum, line) => sum + line.debit, 0);

const entryCreditTotal = (entry: JournalEntry) =>
  entry.lines.reduce((sum, line) => sum + line.credit, 0);

type JournalLineForm = {
  accountId: string;
  debit: string;
  credit: string;
  memo: string;
};

type JournalFormState = {
  entryDate: string;
  sourceType: JournalSourceType | "OTHER";
  sourceId: string;
  description: string;
  lines: JournalLineForm[];
};

const emptyLine = (): JournalLineForm => ({ accountId: "", debit: "", credit: "", memo: "" });

const todayIso = () => new Date().toISOString().slice(0, 10);

const createColumns = (ar: boolean): Array<AccountingColumn<JournalEntry>> => [
  {
    id: "entryNo",
    header: ar ? "رقم القيد" : "Entry No",
    cell: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">{row.entryNo}</span>
  },
  {
    id: "entryDate",
    header: ar ? "التاريخ" : "Date",
    cell: (row) => <span className="text-slate-500 font-medium">{formatDate(row.entryDate)}</span>
  },
  {
    id: "description",
    header: ar ? "البيان" : "Description",
    cell: (row) => (
      <span className="text-slate-600 dark:text-slate-400 font-medium block max-w-[280px] truncate" title={row.description ?? undefined}>
        {row.description || "-"}
      </span>
    )
  },
  {
    id: "sourceType",
    header: ar ? "المصدر" : "Source",
    cell: (row) => (
      <Badge variant="info" size="sm" className="opacity-80">
        {sourceTypeLabels[row.sourceType]}
      </Badge>
    )
  },
  {
    id: "status",
    header: ar ? "الحالة" : "Status",
    cell: (row) => (
      <span className={`fin-status-pill ${row.status === "POSTED" ? "fin-status--success" : "fin-status--warning"}`}>
        {journalStatusLabels[row.status]}
      </span>
    )
  },
  {
    id: "debit",
    header: ar ? "إجمالي مدين" : "Total Debit",
    headerClassName: "text-center",
    cellClassName: "text-center whitespace-nowrap",
    cell: (row) => (
      <div className="font-bold text-emerald-600">
        <FinanceMoney amount={entryDebitTotal(row)} baseCurrency="YER" />
      </div>
    )
  },
  {
    id: "credit",
    header: ar ? "إجمالي دائن" : "Total Credit",
    headerClassName: "text-center",
    cellClassName: "text-center whitespace-nowrap",
    cell: (row) => (
      <div className="font-bold text-rose-600">
        <FinanceMoney amount={entryCreditTotal(row)} baseCurrency="YER" />
      </div>
    )
  },
  {
    id: "lines",
    header: ar ? "الأسطر" : "Lines",
    align: "center",
    cell: (row) => (
      <Badge variant="secondary" size="sm">
        {row.lines.length}
      </Badge>
    )
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

export default function AccountingJournalEntriesPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const canPostJournalEntry = user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER";
  const entriesQ = useAccountingJournalEntriesQuery();
  const accountsQ = useAccountingAccountsQuery();
  const brandingQ = useOrgBrandingQuery();
  const allEntries = entriesQ.data ?? [];
  const accounts = accountsQ.data ?? [];

  const columns = useMemo(() => createColumns(ar), [ar]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [journalError, setJournalError] = useState("");
  const [journalForm, setJournalForm] = useState<JournalFormState>({
    entryDate: todayIso(),
    sourceType: "MANUAL",
    sourceId: "",
    description: "",
    lines: [emptyLine(), emptyLine()]
  });

  const createEntryM = useCreateAccountingJournalEntryMutation();
  const postEntryM = usePostAccountingJournalEntryMutation();
  const isSavingEntry = createEntryM.isPending || postEntryM.isPending;

  const postingBlockedAccountIds = useMemo(() => {
    return new Set(accounts.map((account) => account.parentId).filter((id): id is number => Boolean(id)));
  }, [accounts]);

  const postingAccounts = useMemo(
    () => accounts.filter((account) => account.isActive && !postingBlockedAccountIds.has(account.id)),
    [accounts, postingBlockedAccountIds]
  );

  const journalTotals = useMemo(() => {
    const debit = journalForm.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const credit = journalForm.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    return {
      debit,
      credit,
      difference: debit - credit,
      balanced: debit > 0 && debit === credit
    };
  }, [journalForm.lines]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      const matchesSearch =
        entry.entryNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || entry.status === statusFilter;
      const matchesSource = sourceFilter === "ALL" || entry.sourceType === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [allEntries, searchTerm, statusFilter, sourceFilter]);
  const pagination = useClientPagination(filteredEntries, {
    initialPageSize: 10,
    resetKey: `${searchTerm}|${statusFilter}|${sourceFilter}`
  });

  const stats = useMemo(() => {
    return {
      total: allEntries.length,
      posted: allEntries.filter((e) => e.status === "POSTED").length,
      draft: allEntries.filter((e) => e.status === "DRAFT").length,
      totalDebit: allEntries.reduce((sum, e) => sum + entryDebitTotal(e), 0),
      totalCredit: allEntries.reduce((sum, e) => sum + entryCreditTotal(e), 0)
    };
  }, [allEntries]);

  const closeJournalModal = () => {
    if (isSavingEntry) return;
    setJournalModalOpen(false);
    setJournalError("");
  };

  const setJournalLine = (index: number, patch: Partial<JournalLineForm>) => {
    setJournalForm((previous) => ({
      ...previous,
      lines: previous.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line))
    }));
  };

  const removeJournalLine = (index: number) => {
    setJournalForm((previous) => ({
      ...previous,
      lines: previous.lines.filter((_, lineIndex) => lineIndex !== index)
    }));
  };

  const validateJournalForm = (post: boolean) => {
    if (!journalForm.entryDate) throw new Error("تاريخ القيد مطلوب");
    if (!journalForm.description.trim()) throw new Error("وصف القيد مطلوب");
    if (journalForm.lines.length < 2) throw new Error("يجب أن يحتوي القيد على سطرين على الأقل");

    journalForm.lines.forEach((line) => {
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      const account = accounts.find((candidate) => String(candidate.id) === line.accountId);
      if (!account) throw new Error("كل سطر يجب أن يحتوي حسابًا");
      if (postingBlockedAccountIds.has(account.id)) throw new Error("لا يسمح باستخدام حساب رئيسي غير قابل للترحيل");
      if (debit > 0 && credit > 0) throw new Error("لا يسمح بسطر فيه مدين ودائن معًا");
      if (debit <= 0 && credit <= 0) throw new Error("لا يسمح بسطر مدين ودائن كلاهما صفر");
    });

    if (post && !journalTotals.balanced) {
      throw new Error("لا يمكن الترحيل قبل توازن القيد");
    }
  };

  const saveJournalEntry = async (post: boolean) => {
    setJournalError("");
    try {
      validateJournalForm(post);
      const created = await createEntryM.mutateAsync({
        entryDate: journalForm.entryDate,
        sourceType: journalForm.sourceType === "OTHER" ? "MANUAL" : journalForm.sourceType,
        sourceId: Number(journalForm.sourceId) > 0 ? Number(journalForm.sourceId) : undefined,
        description: journalForm.description.trim(),
        lines: journalForm.lines.map((line) => ({
          accountId: Number(line.accountId),
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
          memo: line.memo.trim() || undefined
        }))
      });

      if (post) {
        await postEntryM.mutateAsync(created.id);
        notifySuccess("تم حفظ وترحيل القيد");
      } else {
        notifySuccess("تم حفظ القيد كمسودة");
      }

      setJournalForm({
        entryDate: todayIso(),
        sourceType: "MANUAL",
        sourceId: "",
        description: "",
        lines: [emptyLine(), emptyLine()]
      });
      setJournalModalOpen(false);
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, {
        ar: true,
        fallback: error instanceof Error ? error.message : "تعذر حفظ القيد"
      });
      setJournalError(message);
      notifyError(message);
    }
  };

  const handlePrint = () => {
    printAccountingDocument({
      title: "دفتر القيود اليومية",
      subtitle: "قائمة القيود المحاسبية للمرحلة الحالية",
      rows: filteredEntries,
      logoUrl: brandingQ.data?.logoUrl || undefined,
      orgName: brandingQ.data?.name || undefined,
      summaryHtml: `
        <strong>إجمالي المدين:</strong> ${stats.totalDebit.toLocaleString("ar-YE-u-nu-latn")} ريال
        &nbsp; | &nbsp;
        <strong>إجمالي الدائن:</strong> ${stats.totalCredit.toLocaleString("ar-YE-u-nu-latn")} ريال
        &nbsp; | &nbsp;
        <strong>عدد القيود:</strong> ${filteredEntries.length.toLocaleString("ar-YE-u-nu-latn")}
      `,
      columns: [
        { label: "رقم القيد", render: (row) => row.entryNo, align: "center" },
        { label: "التاريخ", render: (row) => formatDate(row.entryDate), align: "center" },
        { label: "الوصف", render: (row) => row.description || "-" },
        { label: "المصدر", render: (row) => sourceTypeLabels[row.sourceType], align: "center" },
        { label: "الحالة", render: (row) => journalStatusLabels[row.status], align: "center" },
        { label: "مدين", render: (row) => entryDebitTotal(row).toLocaleString("ar-YE-u-nu-latn"), align: "left" },
        { label: "دائن", render: (row) => entryCreditTotal(row).toLocaleString("ar-YE-u-nu-latn"), align: "left" }
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
            title="القيود اليومية"
            subtitle="عرض وإدارة القيود المحاسبية المرحلة والمسودة"
            icon={<FileText className="w-6 h-6 text-brand-600" />}
            actions={
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="glass-btn" 
                  leftIcon={<RefreshCw className={`w-4 h-4 ${entriesQ.isLoading ? "animate-spin" : ""}`} />} 
                  onClick={() => entriesQ.refetch()}
                >
                  تحديث
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="glass-btn" 
                  leftIcon={<Printer className="w-4 h-4" />} 
                  onClick={handlePrint}
                >
                  طباعة التقرير
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="shadow-lg shadow-brand-500/20" 
                  leftIcon={<Plus className="w-4 h-4" />} 
                  onClick={() => setJournalModalOpen(true)}
                >
                  قيد محاسبي جديد
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
            icon={FileText} 
            cls="brand" 
            val={stats.total} 
            label="عدد القيود" 
          />
          <VouchersKpi 
            icon={Clock} 
            cls="amber" 
            val={stats.draft} 
            label="القيود المسودة" 
          />
          <VouchersKpi 
            icon={CheckCircle} 
            cls="emerald" 
            val={stats.posted} 
            label="القيود المرحلة" 
          />
          <VouchersKpi 
            icon={FileText} 
            cls="violet" 
            val={<FinanceMoney amount={stats.totalDebit} baseCurrency="YER" />} 
            label="إجمالي العمليات" 
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
              placeholder="بحث برقم القيد أو الوصف..." 
            />
          </div>
          <div className="ctr-filters-group">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border-none shadow-sm">
              <Filter size={16} className="text-slate-400 ms-2" />
              <select 
                className="ctr-filter-select border-none bg-transparent h-8 min-w-[140px] focus:ring-0 outline-none"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">كل الحالات</option>
                {Object.entries(journalStatusLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border-none shadow-sm">
              <Filter size={16} className="text-slate-400 ms-2" />
              <select 
                className="ctr-filter-select border-none bg-transparent h-8 min-w-[140px] focus:ring-0 outline-none"
                value={sourceFilter} 
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="ALL">كل المصادر</option>
                {Object.entries(sourceTypeLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            {(searchTerm || statusFilter !== "ALL" || sourceFilter !== "ALL") && (
              <button 
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline px-2"
                onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setSourceFilter("ALL"); }}
              >
                تصفير
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="fin-premium-panel animate-premium">
        <div className="fin-premium-panel__content" style={{ padding: 0 }}>
          {entriesQ.isLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
              <span className="text-slate-500 font-medium">جاري جلب القيود...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <FinanceEmptyState
              variant={searchTerm || statusFilter !== "ALL" || sourceFilter !== "ALL" ? "filtered" : "first-time"}
              title={searchTerm || statusFilter !== "ALL" || sourceFilter !== "ALL" ? "لا توجد نتائج" : "لا توجد قيود يومية"}
              description={searchTerm || statusFilter !== "ALL" || sourceFilter !== "ALL" ? "جرب تعديل البحث أو الفلتر" : "ابدأ بإنشاء قيد محاسبي جديد"}
              action={searchTerm || statusFilter !== "ALL" || sourceFilter !== "ALL" ? (
                <Button variant="secondary" onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setSourceFilter("ALL"); }}>
                  مسح الفلاتر
                </Button>
              ) : (
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setJournalModalOpen(true)}>
                  قيد محاسبي جديد
                </Button>
              )}
            />
          ) : (
            <FinanceDataTable<JournalEntry>
              rows={pagination.pagedRows}
              columns={columns}
              rowKey="id"
              density="dense"
              rowClassName={(entry) => (entry.status === "POSTED" ? "receipt" : "disbursement")}
            />
          )}
        </div>
      </div>
      <FinanceTableFooter
        ar={ar}
        pageSize={pagination.pageSize}
        setPageSize={pagination.setPageSize}
        currentPage={pagination.currentPage}
        setPage={pagination.setCurrentPage}
        totalFilteredCount={pagination.totalItems}
        pages={pagination.totalPages}
      />

      <Modal
        isOpen={journalModalOpen}
        onClose={closeJournalModal}
        title="قيد محاسبي جديد"
        titleIcon={
          <div className="circlemod-head-icon">
            <FileText className="w-4 h-4" />
          </div>
        }
        size="xl"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="ghost" onClick={closeJournalModal} disabled={isSavingEntry}>
              إلغاء
            </Button>
            <Button variant="secondary" onClick={() => void saveJournalEntry(false)} isLoading={createEntryM.isPending}>
              حفظ كمسودة
            </Button>
            {canPostJournalEntry ? (
              <Button onClick={() => void saveJournalEntry(true)} isLoading={postEntryM.isPending} disabled={!journalTotals.balanced}>
                حفظ وترحيل
              </Button>
            ) : null}
          </div>
        }
      >
        <form className="circlemod-form" onSubmit={(event) => event.preventDefault()}>
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <FileText size={15} className="circlemod-section-icon" />
              <span>البيانات الأساسية للقيد</span>
            </div>

            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label>تاريخ القيد *</label>
                <input 
                  className="circlemod-input" 
                  type="date" 
                  value={journalForm.entryDate} 
                  onChange={(event) => setJournalForm((previous) => ({ ...previous, entryDate: event.target.value }))} 
                  required 
                />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>نوع المرجع</label>
                <select 
                  className="circlemod-select" 
                  value={journalForm.sourceType} 
                  onChange={(event) => setJournalForm((previous) => ({ ...previous, sourceType: event.target.value as JournalFormState["sourceType"] }))}
                >
                  <option value="MANUAL">يدوي</option>
                  <option value="VOUCHER">سند قبض/صرف</option>
                  <option value="INVOICE">فاتورة</option>
                  <option value="PAYMENT">دفعة</option>
                  <option value="DEDUCTION">تسوية</option>
                  <option value="OTHER">أخرى</option>
                </select>
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>رقم المرجع</label>
                <input 
                  className="circlemod-input" 
                  type="number" 
                  min={1} 
                  value={journalForm.sourceId} 
                  onChange={(event) => setJournalForm((previous) => ({ ...previous, sourceId: event.target.value }))} 
                />
              </div>
            </div>

            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>وصف القيد *</label>
                <input 
                  className="circlemod-input" 
                  value={journalForm.description} 
                  onChange={(event) => setJournalForm((previous) => ({ ...previous, description: event.target.value }))} 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <FileText size={15} className="circlemod-section-icon" />
              <span>السطور (مدين / دائن)</span>
            </div>
            
            <div className="accounting-journal-lines">
              {journalForm.lines.map((line, index) => (
                <div className="accounting-journal-line flex gap-2 items-center" key={index}>
                  <div className="flex-1">
                    <select 
                      className="circlemod-select" 
                      value={line.accountId} 
                      onChange={(event) => setJournalLine(index, { accountId: event.target.value })} 
                      required
                    >
                      <option value="">الحساب *</option>
                      {postingAccounts.map((account: AccountingAccount) => (
                        <option key={account.id} value={account.id}>{account.code} - {account.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <input 
                      className="circlemod-input" 
                      type="number" 
                      min={0} 
                      value={line.debit} 
                      onChange={(event) => setJournalLine(index, { debit: event.target.value })} 
                      placeholder="مدين" 
                    />
                  </div>
                  <div className="w-32">
                    <input 
                      className="circlemod-input" 
                      type="number" 
                      min={0} 
                      value={line.credit} 
                      onChange={(event) => setJournalLine(index, { credit: event.target.value })} 
                      placeholder="دائن" 
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      className="circlemod-input" 
                      value={line.memo} 
                      onChange={(event) => setJournalLine(index, { memo: event.target.value })} 
                      placeholder="ملاحظة السطر" 
                    />
                  </div>
                  <button 
                    type="button" 
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors" 
                    onClick={() => removeJournalLine(index)} 
                    disabled={journalForm.lines.length <= 2} 
                    title="حذف سطر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-2">
              <Button size="sm" variant="ghost" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setJournalForm((previous) => ({ ...previous, lines: [...previous.lines, emptyLine()] }))}>
                إضافة سطر
              </Button>
            </div>

            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex gap-6 text-sm">
              <div className="flex flex-col">
                <span className="text-slate-500">مجموع المدين</span>
                <strong className="text-emerald-600 font-bold">{formatMoney(journalTotals.debit)}</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500">مجموع الدائن</span>
                <strong className="text-rose-600 font-bold">{formatMoney(journalTotals.credit)}</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500">الفرق</span>
                <strong className="text-slate-700">{formatMoney(Math.abs(journalTotals.difference))}</strong>
              </div>
              <div className="flex flex-col ms-auto text-end border-s ps-6 border-slate-200">
                <span className="text-slate-500">حالة التوازن</span>
                <strong className={journalTotals.balanced ? "text-emerald-600" : "text-rose-600"}>
                  {journalTotals.balanced ? "متوازن" : "غير متوازن"}
                </strong>
              </div>
            </div>
          </div>
          
          {journalError ? (
            <div className="circlemod-error mt-4">
              <span className="flex-shrink-0">⚠️</span>
              <span>{journalError}</span>
            </div>
          ) : null}
        </form>
      </Modal>
    </FinancePageShell>
  );
}
