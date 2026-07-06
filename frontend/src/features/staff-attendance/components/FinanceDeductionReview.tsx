import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Clock,
  DollarSign,
  Search,
  Settings,
  Shield,
  LayoutGrid,
  List,
  Plus,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  User
} from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
import { entityFeedback, notifyError, notifySuccess, type LocalizedLabel } from "../../../shared/ui/feedback";
import { useClientPagination } from "../../../shared/ui/useClientPagination";
import { useAuthStore } from "../../auth/auth.store";
import type { DeductionEvent, DeductionEventStatus, DeductionTrigger } from "../staff-attendance.api";
import { useDeductionEvents, useGenerateDeductions, useReviewDeduction } from "../staff-attendance.api";
import { DeductionRulesConfig } from "./DeductionRulesConfig";
import { fadeUp } from "../../../shared/pageAnimations";

const DEDUCTION_EVENT_ENTITY: LocalizedLabel = { ar: "الحدث المالي", en: "deduction event" };
const DEDUCTION_EVENTS_ENTITY: LocalizedLabel = { ar: "أحداث الخصم", en: "deduction events" };

function getTriggerLabel(trigger: DeductionTrigger, ar: boolean) {
  switch (trigger) {
    case "UNEXCUSED_ABSENCE":
      return ar ? "غياب غير مبرر" : "Unexcused Absence";
    case "LATE_THRESHOLD":
      return ar ? "تجاوز حد التأخير" : "Late Threshold";
    case "EARLY_DEPARTURE":
      return ar ? "انصراف مبكر" : "Early Departure";
    case "UNPAID_LEAVE":
      return ar ? "إجازة غير مدفوعة" : "Unpaid Leave";
    case "MISSED_VISIT":
      return ar ? "زيارة فائتة" : "Missed Visit";
    default:
      return trigger;
  }
}

function getStatusBadge(status: DeductionEventStatus, ar: boolean) {
  switch (status) {
    case "PENDING":
      return <Badge variant="warning" size="sm">{ar ? "قيد المراجعة" : "Pending"}</Badge>;
    case "APPROVED":
      return <Badge variant="success" size="sm">{ar ? "معتمد" : "Approved"}</Badge>;
    case "REJECTED":
      return <Badge variant="error" size="sm">{ar ? "مرفوض" : "Rejected"}</Badge>;
    case "WAIVED":
      return <Badge variant="info" size="sm">{ar ? "معفى" : "Waived"}</Badge>;
    case "INCLUDED_IN_PAYROLL":
      return <Badge variant="secondary" size="sm">{ar ? "في المسير" : "Included in Payroll"}</Badge>;
    default:
      return <Badge variant="secondary" size="sm">{status}</Badge>;
  }
}

export function FinanceDeductionReview() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canReview = user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER";
  const [subTab, setSubTab] = useState<"events" | "rules">("events");

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [filterStatus, setFilterStatus] = useState<"ALL" | DeductionEventStatus>("ALL");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [reviewModal, setReviewModal] = useState<DeductionEvent | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [rulesNewSignal, setRulesNewSignal] = useState(0);

  const eventsQuery = useDeductionEvents({
    month: Number(filterMonth),
    year: Number(filterYear),
    status: filterStatus === "ALL" ? undefined : filterStatus
  });
  const generateMutation = useGenerateDeductions();
  const reviewMutation = useReviewDeduction();

  const events = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const source = eventsQuery.data?.records ?? [];

    if (!normalized) {
      return source;
    }

    return source.filter((event) =>
      [event.user.fullName, event.user.role, event.center?.name ?? "", getTriggerLabel(event.triggerType, false)]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [eventsQuery.data?.records, search]);

  const pagination = useClientPagination(events, { initialPageSize: viewMode === "grid" ? 12 : 25 });

  const stats = useMemo(() => {
    const pending = events.filter((event) => event.status === "PENDING").length;
    const approved = events.filter((event) => event.status === "APPROVED").length;
    const waived = events.filter((event) => event.status === "WAIVED").length;
    const totalAmount = events
      .filter((event) => event.status === "APPROVED")
      .reduce((sum, event) => sum + event.amount, 0);

    return [
      {
        label: ar ? "قيد المراجعة" : "Pending",
        value: pending,
        cls: "amber",
        icon: Clock
      },
      {
        label: ar ? "معتمد" : "Approved",
        value: approved,
        cls: "emerald",
        icon: CheckCircle
      },
      {
        label: ar ? "معفى" : "Waived",
        value: waived,
        cls: "brand",
        icon: Shield
      },
      {
        label: ar ? "إجمالي المعتمد" : "Approved Total",
        value: totalAmount.toFixed(2),
        cls: "violet",
        icon: DollarSign
      }
    ];
  }, [ar, events]);

  const handleReview = (action: "APPROVED" | "REJECTED" | "WAIVED") => {
    if (!reviewModal) return;

    if ((action === "REJECTED" || action === "WAIVED") && !reviewNote.trim()) {
      notifyError(ar ? "ملاحظة المراجعة مطلوبة عند الرفض أو الإعفاء." : "Review note is required when rejecting or waiving.");
      return;
    }

    reviewMutation.mutate(
      { id: reviewModal.id, action, reviewNote: reviewNote || undefined },
      {
        onSuccess: () => {
          notifySuccess(entityFeedback.success(ar, "review", DEDUCTION_EVENT_ENTITY));
          setReviewModal(null);
          setReviewNote("");
        },
        onError: (error) => notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: entityFeedback.error(ar, "review", DEDUCTION_EVENT_ENTITY) }))
      }
    );
  };

  const handleGenerate = () => {
    generateMutation.mutate(
      { month: Number(filterMonth), year: Number(filterYear) },
      {
        onSuccess: (response) => {
          const generatedCount = response?.data?.generatedCount ?? response?.generatedCount ?? 0;
          notifySuccess(ar ? `تم توليد أو تحديث ${generatedCount} من أحداث الخصم` : `Generated or updated ${generatedCount} deduction events`);
        },
        onError: (error) => notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: entityFeedback.error(ar, "generate", DEDUCTION_EVENTS_ENTITY) }))
      }
    );
  };

  const columns = [
    {
      id: "staff",
      header: ar ? "الموظف" : "Staff",
      cell: (event: DeductionEvent) => (
        <div className="staff-ops-person">
          <div className="exams-avatar bg-slate-100 text-slate-700 font-bold text-xs">
            {event.user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="staff-ops-person__meta">
            <span className="staff-ops-person__name">{event.user.fullName}</span>
            <span className="staff-ops-person__sub">{event.user.role}</span>
          </div>
        </div>
      )
    },
    {
      id: "center",
      header: ar ? "المركز" : "Center",
      cell: (event: DeductionEvent) => event.center?.name ?? `${ar ? "مركز" : "Center"} #${event.centerId}`
    },
    {
      id: "trigger",
      header: ar ? "سبب الخصم" : "Trigger",
      cell: (event: DeductionEvent) => <Badge variant="secondary" size="sm">{getTriggerLabel(event.triggerType, ar)}</Badge>
    },
    {
      id: "amount",
      header: ar ? "المبلغ" : "Amount",
      align: "center" as const,
      cell: (event: DeductionEvent) => <span className="text-rose-600 font-bold">{event.amount.toFixed(2)}</span>
    },
    {
      id: "status",
      header: ar ? "الحالة" : "Status",
      align: "center" as const,
      cell: (event: DeductionEvent) => getStatusBadge(event.status, ar)
    }
  ];

  return (
    <section className="staff-ops-view ctr-workspace">
      {/* ── Sub-Tabs ── */}
      {isSuperAdmin && (
        <div className="staff-ops-finance-topbar mb-6">
          <div className="staff-ops-finance-tabs" role="tablist" aria-label={ar ? "تبويبات الخصومات" : "Finance deduction tabs"}>
            <button
              type="button"
              role="tab"
              aria-selected={subTab === "events"}
              className={`staff-ops-finance-tab ${subTab === "events" ? "staff-ops-finance-tab--active" : ""}`}
              onClick={() => setSubTab("events")}
            >
              <DollarSign size={15} />
              <span>{ar ? "أحداث الخصم" : "Deduction Events"}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subTab === "rules"}
              className={`staff-ops-finance-tab ${subTab === "rules" ? "staff-ops-finance-tab--active" : ""}`}
              onClick={() => setSubTab("rules")}
            >
              <Settings size={15} />
              <span>{ar ? "قواعد الخصم" : "Deduction Rules"}</span>
            </button>
          </div>
          {subTab === "events" && (
            <Button
              variant="primary"
              size="sm"
              className="h-9 px-4 staff-ops-toolbar__action-btn staff-ops-finance-topbar__action"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              isLoading={generateMutation.isPending}
            >
              {ar ? "توليد الخصومات" : "Generate Deductions"}
            </Button>
          )}
          {subTab === "rules" && (
            <Button
              variant="primary"
              size="sm"
              className="h-9 px-4 staff-ops-toolbar__action-btn staff-ops-finance-topbar__action"
              onClick={() => setRulesNewSignal((current) => current + 1)}
            >
              <Plus size={16} className="me-1.5" />
              {ar ? "قاعدة جديدة" : "New Rule"}
            </Button>
          )}
        </div>
      )}

      {subTab === "rules" && isSuperAdmin ? (
        <DeductionRulesConfig openNewSignal={rulesNewSignal} />
      ) : (
        <>
          {/* ── KPIs ── */}
          <div className="ctr-kpis-modern mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {stats.map((stat) => (
              <div key={stat.label} className={`ctr-kpi-modern ${stat.cls}`}>
                <div className="ctr-kpi-icon-wrap">
                  <stat.icon size={22} />
                </div>
                <div className="ctr-kpi-content">
                  <div className="ctr-kpi-val">{stat.value}</div>
                  <div className="ctr-kpi-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Controls ── */}
          <div className="ctr-controls mb-6">
            <div className="ctr-search-wrap">
              <Search className="ctr-search-icon" size={16} />
              <input
                type="text"
                className="ctr-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={ar ? "ابحث بالاسم أو المركز..." : "Search by staff or center..."}
              />
            </div>

            <div className="ctr-filters-group">
              <div className="flex gap-2 items-center bg-slate-50 p-1 rounded-lg border border-slate-100">
                <select
                  className="ctr-search-input !h-8 !w-24 !bg-transparent !border-none !p-0 text-center text-[12px] font-semibold cursor-pointer"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
                    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    return (
                      <option key={i + 1} value={String(i + 1)}>
                        {ar ? arabicMonths[i] : englishMonths[i]}
                      </option>
                    );
                  })}
                </select>
                <span className="text-slate-300">/</span>
                <input
                  type="number"
                  className="ctr-search-input !h-8 !w-20 !bg-transparent !border-none !p-0 text-center text-[12px] font-mono"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                />
              </div>

              <select
                className="ctr-search-input !w-[140px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="ALL">{ar ? "كل الحالات" : "All Status"}</option>
                <option value="PENDING">{ar ? "قيد المراجعة" : "Pending"}</option>
                <option value="APPROVED">{ar ? "معتمدة" : "Approved"}</option>
                <option value="REJECTED">{ar ? "مرفوضة" : "Rejected"}</option>
                <option value="WAIVED">{ar ? "معفى" : "Waived"}</option>
                <option value="INCLUDED_IN_PAYROLL">{ar ? "في المسير" : "In Payroll"}</option>
              </select>

              <div className="ctr-view-toggle">
                <button className={`ctr-view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}><LayoutGrid size={18} /></button>
                <button className={`ctr-view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}><List size={18} /></button>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <AnimatePresence mode="wait">
            {eventsQuery.isError ? (
              <ErrorState title={ar ? "تعذر تحميل الخصومات" : "Unable to load deductions"} onRetry={() => void eventsQuery.refetch()} />
            ) : eventsQuery.isLoading ? (
              <div className="ctr-grid-modern">
                {[...Array(8)].map((_, i) => <div key={i} className="ctr-card-modern animate-pulse h-40 opacity-50" />)}
              </div>
            ) : pagination.pagedRows.length === 0 ? (
              <EmptyState title={ar ? "لا توجد خصومات" : "No deductions found"} />
            ) : viewMode === "grid" ? (
              <div className="ctr-grid-modern">
                {pagination.pagedRows.map((event) => {
                  const isPending = event.status === "PENDING";
                  return (
                    <motion.div key={event.id} variants={fadeUp} initial="hidden" animate="visible" className="ctr-card-modern">
                      <div className="ctr-card-header">
                        <div className="ctr-card-icon-box bg-slate-50 text-slate-500">
                          <DollarSign size={22} />
                        </div>
                        <div className="ctr-card-title-wrap">
                          <h3 className="ctr-card-title text-[15px] font-bold">{event.user.fullName}</h3>
                          <div className="ctr-card-subtitle flex items-center gap-1.5">
                            <User size={12} className="text-slate-400" />
                            <span className="text-slate-500 font-medium text-[11px]">{event.user.role}</span>
                          </div>
                        </div>
                        <div className="ctr-card-status-row">{getStatusBadge(event.status, ar)}</div>
                      </div>

                      <div className="ctr-card-details bg-slate-50/30 p-3 rounded-xl mt-3 space-y-2">
                        <div className="ctr-card-detail-row">
                          <span className="ctr-card-detail-label text-[10px]">{ar ? "سبب الخصم" : "Trigger"}</span>
                          <span className="text-[11px] font-bold text-slate-700">{getTriggerLabel(event.triggerType, ar)}</span>
                        </div>
                        <div className="ctr-card-detail-row">
                          <span className="ctr-card-detail-label text-[10px]">{ar ? "المبلغ" : "Amount"}</span>
                          <span className="text-[13px] font-black text-rose-600">{event.amount.toFixed(2)}</span>
                        </div>
                        <div className="ctr-card-detail-row pt-1 border-t border-slate-100/50">
                          <span className="ctr-card-detail-label text-[10px]">{ar ? "المركز" : "Center"}</span>
                          <span className="text-[11px] text-slate-500">{event.center?.name || "N/A"}</span>
                        </div>
                      </div>

                      <div className="ctr-card-actions mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                        {isPending && canReview ? (
                          <Button size="sm" className="h-8 px-4 text-[11px]" onClick={() => setReviewModal(event)}>
                            {ar ? "مراجعة الخصم" : "Review Deduction"}
                          </Button>
                        ) : event.status === "INCLUDED_IN_PAYROLL" ? (
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider">{ar ? "حالة الخصم" : "Status"}</span>
                            <span className="text-[11px] font-bold text-slate-700">{ar ? "مُدرج في مسير الرواتب" : "Locked in Payroll"}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider">{ar ? "بواسطة" : "By"}</span>
                            <span className="text-[11px] font-bold text-slate-700">{event.reviewedBy?.fullName || "System"}</span>
                          </div>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><MoreHorizontal size={14} /></Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ctr-card-modern !p-0 overflow-hidden">
                <DataTable columns={columns} rows={pagination.pagedRows} rowKey="id" className="!border-none" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Pagination ── */}
          {!eventsQuery.isLoading && pagination.totalItems > 0 && (
            <div className="ctr-footer mt-6">
              <div className="ctr-page-size">
                <span>{ar ? "الصفوف:" : "Rows:"}</span>
                <select value={pagination.pageSize} onChange={(e) => pagination.setPageSize(Number(e.target.value))}>
                  {[12, 24, 48].map((sz) => <option key={sz} value={sz}>{sz}</option>)}
                </select>
              </div>
              <div className="ctr-page-info">
                {ar ? `عرض ${pagination.currentPage} من ${pagination.totalPages}` : `Page ${pagination.currentPage} of ${pagination.totalPages}`}
              </div>
              <div className="ctr-page-controls">
                <button className="ctr-page-btn" disabled={pagination.currentPage === 1} onClick={() => pagination.setCurrentPage(p => p - 1)}><ChevronRight size={16} /></button>
                <button className="ctr-page-btn active">{pagination.currentPage}</button>
                <button className="ctr-page-btn" disabled={pagination.currentPage === pagination.totalPages} onClick={() => pagination.setCurrentPage(p => p + 1)}><ChevronLeft size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Review Modal ── */}
      <AnimatePresence>
        {reviewModal && (
          <div className="staff-ops-modal-overlay" onClick={() => setReviewModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="staff-ops-modal staff-ops-modal--compact" onClick={e => e.stopPropagation()}>
              <div className="staff-ops-modal__header">
                <div className="flex items-center gap-3">
                  <div className="staff-ops-modal__icon-box"><DollarSign size={20} /></div>
                  <h3>{ar ? "مراجعة الخصم المالي" : "Review Deduction"}</h3>
                </div>
                <button className="staff-ops-modal__close" onClick={() => setReviewModal(null)}>×</button>
              </div>
              <div className="staff-ops-modal__body space-y-4">
                <div className="staff-ops-modal__summary">
                  <div className="staff-ops-modal__summary-row">
                    <span>{ar ? "الموظف" : "Staff Member"}</span>
                    <span className="font-bold">{reviewModal.user.fullName}</span>
                  </div>
                  <div className="staff-ops-modal__summary-row">
                    <span>{ar ? "السبب" : "Trigger"}</span>
                    <span className="font-bold">{getTriggerLabel(reviewModal.triggerType, ar)}</span>
                  </div>
                  <div className="staff-ops-modal__summary-row staff-ops-modal__summary-row--total">
                    <span>{ar ? "المبلغ المستحق" : "Amount Due"}</span>
                    <span className="text-brand-600 font-black">{reviewModal.amount.toFixed(2)} {ar ? "ريال يمني" : "YER"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="staff-ops-modal__note-label ps-1">{ar ? "ملاحظة المراجعة" : "Reviewer Note"}</label>
                  <textarea 
                    value={reviewNote} 
                    onChange={e => setReviewNote(e.target.value)} 
                    maxLength={500}
                    className="staff-ops-modal__textarea staff-ops-modal__textarea--review" 
                    placeholder={ar ? "أدخل سببا للاعتماد أو الإعفاء..." : "Enter reason for approval or waiver..."}
                  />
                </div>
              </div>
              <div className="staff-ops-modal__footer staff-ops-modal__footer--tone">
                <div className="flex gap-2 w-full">
                  <Button variant="success" className="flex-1" onClick={() => handleReview("APPROVED")} isLoading={reviewMutation.isPending}>{ar ? "اعتماد" : "Approve"}</Button>
                  <Button variant="danger" className="flex-1" onClick={() => handleReview("REJECTED")} isLoading={reviewMutation.isPending}>{ar ? "رفض" : "Reject"}</Button>
                  <Button variant="ghost" className="flex-1 staff-ops-modal__waive-btn" onClick={() => handleReview("WAIVED")} isLoading={reviewMutation.isPending}>{ar ? "إعفاء" : "Waive"}</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
