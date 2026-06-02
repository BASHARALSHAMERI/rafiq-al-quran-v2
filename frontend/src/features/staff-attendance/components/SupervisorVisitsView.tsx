import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Calendar,
  Star,
  MapPin,
  Users,
  Search,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  FileText,
  Plus,
  StopCircle,
} from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { fadeUp } from "../../../shared/pageAnimations";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
import { entityFeedback, type LocalizedLabel } from "../../../shared/ui/feedback";
import { useAuthStore } from "../../auth/auth.store";
import { useCentersQuery } from "../../org/org.hooks";
import { useCirclesQuery } from "../../org/org.hooks";

import {
  useSupervisorVisitLogs,
  useCreateVisitLog,
  useEndVisitLog,
  type SupervisorVisitLog,
} from "../staff-attendance.api";
import {
  useClientPagination
} from "../../../shared/ui/useClientPagination";



const SUPERVISOR_VISITS_ENTITY: LocalizedLabel = { ar: "الزيارات الإشرافية", en: "supervisor visits" };

// ── Start Visit Modal ────────────────────────────────────────────────────────
function StartVisitModal({ ar, onClose }: { ar: boolean; onClose: () => void }) {
  const centersQ = useCentersQuery();
  const centers = centersQ.data?.items ?? [];

  const [centerId, setCenterId] = useState<number | "">("");
  const [circleId, setCircleId] = useState<number | "">("");
  const [observations, setObservations] = useState("");
  const createM = useCreateVisitLog();

  const circlesQ = useCirclesQuery(centerId !== "" ? Number(centerId) : undefined);
  const circles = circlesQ.data?.items ?? [];

  const handleSubmit = () => {
    if (!centerId) return;
    createM.mutate(
      { centerId: Number(centerId), circleId: circleId !== "" ? Number(circleId) : null, observations: observations.trim() || null },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
        dir={ar ? "rtl" : "ltr"}
      >
        <h3 className="text-base font-bold text-slate-800 mb-4">
          {ar ? "بدء زيارة إشرافية" : "Start Supervisor Visit"}
        </h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">{ar ? "المركز *" : "Center *"}</label>
            <select
              value={centerId}
              onChange={(e) => { setCenterId(Number(e.target.value) || ""); setCircleId(""); }}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">{ar ? "اختر المركز" : "Select center"}</option>
              {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {centerId !== "" && circles.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">{ar ? "الحلقة (اختياري)" : "Circle (optional)"}</label>
              <select
                value={circleId}
                onChange={(e) => setCircleId(Number(e.target.value) || "")}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">{ar ? "بدون تحديد حلقة" : "No specific circle"}</option>
                {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">{ar ? "ملاحظات مبدئية (اختياري)" : "Initial observations (optional)"}</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder={ar ? "أضف ملاحظة..." : "Add a note..."}
            />
          </div>
        </div>
        {createM.isError && (
          <p className="text-xs text-rose-600 mt-3">{ar ? "فشل بدء الزيارة. حاول مرة أخرى." : "Failed to start visit. Try again."}</p>
        )}
        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSubmit}
            disabled={!centerId || createM.isPending}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2 rounded-xl transition disabled:opacity-50"
          >
            {createM.isPending ? (ar ? "جارٍ البدء..." : "Starting...") : (ar ? "بدء الزيارة" : "Start Visit")}
          </button>
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2 rounded-xl hover:bg-slate-50 transition">
            {ar ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── End Visit Modal ──────────────────────────────────────────────────────────
function EndVisitModal({ visit, ar, onClose }: { visit: SupervisorVisitLog; ar: boolean; onClose: () => void }) {
  const [rating, setRating] = useState<number>(0);
  const [observations, setObservations] = useState(visit.observations ?? "");
  const endM = useEndVisitLog();

  const handleSubmit = () => {
    endM.mutate(
      { visitId: visit.id, payload: { rating: rating > 0 ? rating : null, observations: observations.trim() || null } },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
        dir={ar ? "rtl" : "ltr"}
      >
        <h3 className="text-base font-bold text-slate-800 mb-1">{ar ? "إنهاء الزيارة" : "End Visit"}</h3>
        <p className="text-xs text-slate-400 mb-4">{visit.center?.name}</p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-2">{ar ? "التقييم (1-5)" : "Rating (1-5)"}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold border transition ${
                    rating === n ? "bg-amber-400 border-amber-400 text-white" : "border-slate-200 text-slate-400 hover:border-amber-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">{ar ? "الملاحظات الختامية" : "Final observations"}</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder={ar ? "سجّل ملاحظاتك الختامية..." : "Record your final observations..."}
            />
          </div>
        </div>
        {endM.isError && (
          <p className="text-xs text-rose-600 mt-3">{ar ? "فشل إنهاء الزيارة." : "Failed to end visit."}</p>
        )}
        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSubmit}
            disabled={endM.isPending}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold py-2 rounded-xl transition disabled:opacity-50"
          >
            {endM.isPending ? (ar ? "جارٍ الإنهاء..." : "Ending...") : (ar ? "إنهاء الزيارة" : "End Visit")}
          </button>
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2 rounded-xl hover:bg-slate-50 transition">
            {ar ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export const getVisitStatusBadge = (status: string, ar: boolean) => {
  const normalized = status?.toUpperCase();
  if (normalized === "COMPLETED" || normalized === "RESOLVED") {
    return <Badge variant="success" size="sm">{ar ? "مكتملة" : "Completed"}</Badge>;
  }
  return <Badge variant="warning" size="sm">{ar ? "مفتوحة" : "Open"}</Badge>;
};


const DEFAULT_MONTH = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
})();

export function SupervisorVisitsView() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role === "SUPER_ADMIN" || user?.role === "CENTER_ADMIN" || user?.role === "SUPERVISOR";

  const [search, setSearch] = useState("");
  const [monthStr, setMonthStr] = useState(DEFAULT_MONTH);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [endingVisit, setEndingVisit] = useState<SupervisorVisitLog | null>(null);

  const queryFilters = useMemo(() => {
    if (!monthStr) return undefined;
    const [year, month] = monthStr.split("-").map(Number);
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { startDate, endDate };
  }, [monthStr]);

  const visitsQuery = useSupervisorVisitLogs(queryFilters);
  const visits = visitsQuery.data ?? [];

  const filteredVisits = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return visits;
    }

    return visits.filter((visit) => {
      const supervisor = visit.supervisor.fullName.toLowerCase();
      const center = visit.center.name.toLowerCase();
      const target = String(visit.circle?.name ?? visit.targetLabel ?? "").toLowerCase();
      const category = String(visit.category ?? "").toLowerCase();

      return (
        supervisor.includes(normalized) ||
        center.includes(normalized) ||
        target.includes(normalized) ||
        category.includes(normalized)
      );
    });
  }, [search, visits]);

  const pagination = useClientPagination(filteredVisits, { initialPageSize: 12 });

  const selectedVisit = useMemo(
    () => filteredVisits.find((visit) => visit.id === selectedVisitId) ?? null,
    [filteredVisits, selectedVisitId]
  );

  useEffect(() => {
    if (selectedVisitId && !selectedVisit) {
      setSelectedVisitId(null);
    }
  }, [selectedVisit, selectedVisitId]);

  const stats = useMemo(() => {
    const totalVisits = filteredVisits.length;
    const scheduledVisits = filteredVisits.filter(
      (v) => v.status?.toUpperCase() !== "COMPLETED" && v.status?.toUpperCase() !== "RESOLVED"
    ).length;
    const averageRating =
      totalVisits > 0
        ? (
            filteredVisits.reduce((sum, visit) => sum + (visit.rating ?? 0), 0) /
            totalVisits
          ).toFixed(1)
        : "0.0";

    return [
      {
        label: ar ? "إجمالي الزيارات" : "Total Visits",
        value: totalVisits,
        cls: "exams-kpi-card--total",
        icon: MapPin
      },
      {
        label: ar ? "قيد التنفيذ" : "Pending / Open",
        value: scheduledVisits,
        cls: "exams-kpi-card--published",
        icon: CalendarDays
      },
      {
        label: ar ? "متوسط التقييم" : "Average Rating",
        value: averageRating,
        cls: "exams-kpi-card--draft",
        icon: Star
      }
    ];
  }, [ar, filteredVisits]);

  return (
    <section className="staff-ops-view ctr-workspace">
      <div 
        className="ctr-kpis-modern mb-6"
        style={{ 
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          width: '100%' 
        }}
      >
        {stats.map((stat) => (
          <div 
            key={stat.label} 
            className={`ctr-kpi-modern ${
              stat.cls === "exams-kpi-card--completed" ? "emerald" :
              stat.cls === "exams-kpi-card--draft" ? "amber" :
              stat.cls === "exams-kpi-card--cancelled" ? "violet" :
              stat.cls === "exams-kpi-card--published" ? "brand" :
              "brand"
            }`}
          >
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

      <div className="ctr-controls mb-6">
        <div className="flex gap-4 items-center flex-1 flex-wrap">
          {/* Text Search */}
          <div className="ctr-search-wrap max-w-[280px] w-full">
            <Search className="ctr-search-icon" size={16} />
            <input
              type="text"
              className="ctr-search-input"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                pagination.setCurrentPage(1);
              }}
              placeholder={ar ? "ابحث بالمشرف أو المركز أو التصنيف..." : "Search by supervisor, center, or category..."}
            />
          </div>

          {/* Month Picker */}
          <div className="ctr-search-wrap max-w-[240px] w-full">
            <CalendarDays className="ctr-search-icon" size={16} />
            <input
              type="month"
              className="ctr-search-input !px-10"
              value={monthStr}
              onChange={(e) => {
                setMonthStr(e.target.value);
                pagination.setCurrentPage(1);
              }}
            />
          </div>

          <div className="text-[12px] text-slate-500 italic hidden md:block">
            {ar ? "يتم تحديث البيانات تلقائياً عند تغيير الشهر" : "Data updates automatically on month change"}
          </div>
        </div>
        
        <div className="ctr-filters-group">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setMonthStr(DEFAULT_MONTH);
              pagination.setCurrentPage(1);
            }}
            disabled={!search.trim() && monthStr === DEFAULT_MONTH}
          >
            {ar ? "إعادة الضبط" : "Reset"}
          </Button>
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowStartModal(true)}
              className="flex items-center gap-1.5"
            >
              <Plus size={14} />
              {ar ? "بدء زيارة" : "Start Visit"}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {visitsQuery.isError ? (
          <ErrorState
            title={ar ? "تعذر تحميل الزيارات الإشرافية" : "Unable to load supervisor visits"}
            description={getLocalizedApiErrorMessage(visitsQuery.error, {
              ar,
              fallback: entityFeedback.error(ar, "load", SUPERVISOR_VISITS_ENTITY)
            })}
            onRetry={() => void visitsQuery.refetch()}
            retryLabel={ar ? "إعادة المحاولة" : "Retry"}
          />
        ) : visitsQuery.isLoading ? (
          <div className="ctr-grid-modern">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="ctr-card-modern animate-pulse" style={{ height: "200px", opacity: 0.5 }} />
            ))}
          </div>
        ) : pagination.pagedRows.length === 0 ? (
          <EmptyState
            title={ar ? "لا توجد زيارات" : "No visits recorded"}
            description={
              ar
                ? "لم يتم العثور على زيارات تطابق الفلاتر الحالية."
                : "No visits match the current filters."
            }
          />
        ) : (
          <div className="ctr-grid-modern">
            {pagination.pagedRows.map((visit) => {
               const rating = Number(visit.rating || 0);
               const scoreColor = rating >= 90 ? "text-emerald-600" : rating >= 70 ? "text-amber-600" : "text-red-600";
               const title = visit.center?.name || (ar ? "مركز غير معروف" : "Unknown Center");
               const subtitle = visit.supervisor?.fullName || (ar ? "مشرف" : "Supervisor");
              
              return (
                <motion.div
                  key={visit.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className={`ctr-card-modern ${selectedVisitId === visit.id ? "border-brand ring-1 ring-brand/20 shadow-lg bg-brand/[0.01]" : "border-slate-50 shadow-sm"}`}
                  onClick={() => setSelectedVisitId(visit.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ctr-card-header">
                    <div className={`ctr-card-icon-box ${selectedVisitId === visit.id ? "bg-brand text-white" : "bg-brand/5 text-brand"}`}>
                      <MapPin size={24} />
                    </div>
                    <div className="ctr-card-title-wrap">
                      <h3 className="ctr-card-title text-[15px] font-bold">{title}</h3>
                      <div className="ctr-card-subtitle flex items-center gap-1.5">
                        <Users size={12} className="text-slate-400" />
                        <span className="text-slate-500 font-medium">{subtitle}</span>
                      </div>
                    </div>
                    <div className="ctr-card-status-row">
                       <Badge variant="secondary" size="sm" className="ctr-card-status bg-slate-100 text-slate-700">
                         {visit.category || (ar ? "زيارة" : "Visit")}
                       </Badge>
                    </div>
                  </div>

                  <div className="ctr-card-details bg-slate-50/30 p-3 rounded-xl mt-3 space-y-2">
                    <div className="ctr-card-detail-row">
                      <span className="ctr-card-detail-label text-[11px]">{ar ? "تاريخ الزيارة" : "Visit Date"}</span>
                       <span className="ctr-card-detail-val font-medium">
                         <Calendar size={14} className="text-blue-500" />
                         {new Date(visit.createdAt).toLocaleDateString(ar ? 'ar-SA-u-nu-latn' : 'en-US')}
                       </span>
                    </div>
                     <div className="ctr-card-detail-row">
                       <span className="ctr-card-detail-label text-[11px]">{ar ? "التقييم الإجمالي" : "Overall Score"}</span>
                       <span className={`ctr-card-detail-val text-lg font-black ${scoreColor}`}>
                         <Star size={16} className="fill-current" />
                         {rating}%
                       </span>
                     </div>
                  </div>

                   <div className="ctr-card-actions mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                       <div>
                         {getVisitStatusBadge(visit.status, ar)}
                       </div>
                      <div className="flex items-center gap-2">
                        {visit.status !== "COMPLETED" && canCreate && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setEndingVisit(visit as unknown as SupervisorVisitLog); }}
                            className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2 py-1.5 rounded-lg transition"
                          >
                            <StopCircle size={12} />
                            {ar ? "إنهاء" : "End"}
                          </button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[11px] text-brand font-bold hover:bg-brand/5"
                          onClick={(e) => { e.stopPropagation(); setSelectedVisitId(visit.id); }}
                        >
                          {ar ? "عرض" : "View"}
                        </Button>
                      </div>
                   </div>
                 </motion.div>
               );
            })}
          </div>
        )}
      </AnimatePresence>

      {!visitsQuery.isLoading && !visitsQuery.isError && pagination.totalItems > 0 && (
        <div className="ctr-footer">
          <div className="ctr-page-size">
            <span>{ar ? "الصفوف:" : "Rows:"}</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => {
                pagination.setPageSize(Number(e.target.value));
              }}
            >
              {[12, 24, 48].map((sz) => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
          </div>

          <div className="ctr-page-info">
            {ar
              ? `عرض ${Math.min(pagination.totalItems, (pagination.currentPage - 1) * pagination.pageSize + 1)} - ${Math.min(pagination.totalItems, pagination.currentPage * pagination.pageSize)} من ${pagination.totalItems}`
              : `Showing ${Math.min(pagination.totalItems, (pagination.currentPage - 1) * pagination.pageSize + 1)} - ${Math.min(pagination.totalItems, pagination.currentPage * pagination.pageSize)} of ${pagination.totalItems}`
            }
          </div>

          <div className="ctr-page-controls">
            <button
              className="ctr-page-btn"
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.setCurrentPage(pagination.currentPage - 1)}
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="ctr-page-btn active"
            >
              {pagination.currentPage}
            </button>
            <button
              className="ctr-page-btn"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => pagination.setCurrentPage(pagination.currentPage + 1)}
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedVisit && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="ctr-card-modern mt-8 border-brand/20 bg-brand/[0.02]" 
            aria-label={ar ? "تفاصيل الزيارة" : "Visit details"}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand text-white rounded-lg shadow-brand/20 shadow-lg">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">{ar ? "تقرير الزيارة التفصيلي" : "Detailed Visit Report"}</h3>
                    <p className="text-sm text-slate-500">{ar ? "ملاحظات المشرف وتقييم البنود" : "Supervisor observations and checklist"}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedVisitId(null)}
                  className="text-slate-400 hover:text-red-500"
                >
                  {ar ? "إغلاق" : "Close"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <Star size={16} className="text-amber-500" />
                    {ar ? "الملاحظات العامة" : "General Observations"}
                  </h4>
                  <div className="p-4 bg-white border border-slate-100 rounded-xl text-slate-600 leading-relaxed shadow-sm italic">
                    {selectedVisit.observations ||
                      selectedVisit.content ||
                      (ar
                        ? "لا توجد ملاحظات مسجلة لهذه الزيارة حالياً."
                        : "No observations recorded for this visit.")}
                  </div>
                </div>

                {selectedVisit.checklist?.length ? (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-500" />
                      {ar ? "بنود التقييم" : "Evaluation Checklist"}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedVisit.checklist.map((item, index) => (
                        <div key={`${selectedVisit.id}-${index}`} className="flex items-center justify-between p-3 bg-white border border-slate-50 rounded-lg shadow-sm">
                          <span className="text-sm text-slate-600 font-medium">
                            {String(item.label ?? item.key ?? `${ar ? "بند" : "Item"} ${index + 1}`)}
                          </span>
                          <Badge variant={item.checked === true ? "success" : "secondary"} size="sm" className="font-bold">
                            {item.checked === true ? (ar ? "مكتمل" : "Done") : ar ? "مفتوح" : "Open"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      {showStartModal && <StartVisitModal ar={ar} onClose={() => setShowStartModal(false)} />}
      {endingVisit && <EndVisitModal visit={endingVisit} ar={ar} onClose={() => setEndingVisit(null)} />}
    </section>
  );
}
