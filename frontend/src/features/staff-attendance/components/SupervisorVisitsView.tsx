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
  RotateCcw,
} from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { fadeUp } from "../../../shared/pageAnimations";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
import { entityFeedback, type LocalizedLabel } from "../../../shared/ui/feedback";
import {
  useSupervisorVisitLogs,
} from "../staff-attendance.api";
import {
  useClientPagination
} from "../../../shared/ui/useClientPagination";



const SUPERVISOR_VISITS_ENTITY: LocalizedLabel = { ar: "الزيارات الإشرافية", en: "supervisor visits" };

export const getVisitStatusBadge = (status: string, ar: boolean) => {
  const normalized = status?.toUpperCase();
  if (normalized === "COMPLETED" || normalized === "RESOLVED") {
    return <Badge variant="success" size="sm">{ar ? "مكتملة" : "Completed"}</Badge>;
  }
  if (normalized === "MISSED") {
    return <Badge variant="destructive" size="sm">{ar ? "زيارة فائتة" : "Missed"}</Badge>;
  }
  if (normalized === "IN_PROGRESS") {
    return <Badge variant="warning" size="sm">{ar ? "قيد التنفيذ" : "In Progress"}</Badge>;
  }
  if (normalized === "PENDING" || normalized === "SCHEDULED") {
    return <Badge variant="secondary" size="sm">{ar ? "مجدولة / لم تنفذ" : "Scheduled"}</Badge>;
  }
  return <Badge variant="secondary" size="sm">{ar ? "مفتوحة" : "Open"}</Badge>;
};


const DEFAULT_MONTH = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
})();

export function SupervisorVisitsView() {
  const { language } = useI18n();
  const ar = language === "ar";
  const [search, setSearch] = useState("");
  const [monthStr, setMonthStr] = useState(DEFAULT_MONTH);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const year = Number(monthStr.split("-")[0]);
  const month = Number(monthStr.split("-")[1]);

  const queryFilters = useMemo(() => {
    if (!monthStr) return undefined;
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { startDate, endDate };
  }, [monthStr, year, month]);

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

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="ctr-search-wrap flex-1 !max-w-none bg-slate-50/50 border-transparent focus-within:bg-white transition-colors">
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

          <div className="flex gap-2 items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
            <CalendarDays className="text-slate-400 ms-2" size={14} />
            <select
              className="ctr-search-input !h-7 w-20 !bg-transparent !border-none !p-0 text-center text-xs font-semibold cursor-pointer"
              value={month}
              onChange={(e) => {
                setMonthStr(`${year}-${String(e.target.value).padStart(2, "0")}`);
                pagination.setCurrentPage(1);
              }}
            >
              {Array.from({ length: 12 }, (_, i) => {
                const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
                const englishMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return (
                  <option key={i + 1} value={i + 1}>
                    {ar ? arabicMonths[i] : englishMonths[i]}
                  </option>
                );
              })}
            </select>
            <span className="text-slate-300">/</span>
            <input
              type="number"
              className="ctr-search-input !h-7 w-12 !bg-transparent !border-none !p-0 text-center text-xs font-semibold font-mono"
              value={year}
              onChange={(e) => {
                setMonthStr(`${e.target.value}-${String(month).padStart(2, "0")}`);
                pagination.setCurrentPage(1);
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-[12px] text-slate-500 italic hidden xl:block">
            {ar ? "يتم التحديث تلقائياً" : "Auto updates"}
          </div>
          <Button
            variant="ghost"
            className="hover:bg-slate-100 flex items-center justify-center p-2 rounded-full w-10 h-10 text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-200 transition-all"
            title={ar ? "إعادة الضبط" : "Reset"}
            onClick={() => {
              setSearch("");
              setMonthStr(DEFAULT_MONTH);
              pagination.setCurrentPage(1);
            }}
            disabled={!search.trim() && monthStr === DEFAULT_MONTH}
          >
            <RotateCcw size={18} strokeWidth={2.5} />
          </Button>
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
                           {visit.category === "PLANNED" 
                             ? (ar ? "مجدولة" : "Planned") 
                             : visit.category === "EMERGENCY" 
                             ? (ar ? "طارئة" : "Emergency") 
                             : visit.category || (ar ? "زيارة" : "Visit")}
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
                    {(visit.plannedStartAt || visit.plannedEndAt || visit.plannedTimeWindow) && (
                      <div className="ctr-card-detail-row">
                        <span className="ctr-card-detail-label text-[11px]">{ar ? "وقت الزيارة" : "Visit Time"}</span>
                        <span className="ctr-card-detail-val font-medium">
                          {visit.plannedStartAt || visit.plannedEndAt 
                            ? `${visit.plannedStartAt ? new Date(visit.plannedStartAt).toLocaleTimeString(ar ? 'ar-SA-u-nu-latn' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '?'} - ${visit.plannedEndAt ? new Date(visit.plannedEndAt).toLocaleTimeString(ar ? 'ar-SA-u-nu-latn' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '?'}`
                            : visit.plannedTimeWindow}
                        </span>
                      </div>
                    )}
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

      {selectedVisit && (
        <Modal
          isOpen={Boolean(selectedVisitId)}
          onClose={() => setSelectedVisitId(null)}
          title={ar ? "تقرير الزيارة التفصيلي" : "Detailed Visit Report"}
          size="lg"
          hideFooter
          panelClassName="users-modal-panel staff-ops-users-modal-panel"
          bodyClassName="users-modal-body staff-ops-users-modal-body bg-slate-50/30"
        >
          <div className="p-2 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand text-white rounded-lg shadow-brand/20 shadow-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{ar ? "ملاحظات المشرف وقائمة التقييم" : "Supervisor observations and checklist"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  {ar ? "الملاحظات العامة" : "General Observations"}
                </h4>
                <div className="p-4 bg-white border border-slate-100 rounded-xl text-slate-600 leading-relaxed shadow-sm italic">
                  {selectedVisit.status?.toUpperCase() === "MISSED" ? (
                    ar ? "هذه الزيارة فائتة ولم يتم إجراؤها في وقتها المحدد." : "This visit was missed and not performed."
                  ) : selectedVisit.status?.toUpperCase() === "PENDING" ? (
                    ar ? "لم تنفذ بعد" : "Not yet performed"
                  ) : selectedVisit.status?.toUpperCase() === "IN_PROGRESS" ? (
                    ar ? "جاري التنفيذ حالياً" : "Currently in progress"
                  ) : (
                    selectedVisit.observations ||
                    selectedVisit.content ||
                    (ar
                      ? "لا توجد ملاحظات مسجلة لهذه الزيارة حالياً."
                      : "No observations recorded for this visit.")
                  )}
                </div>
              </div>

              {selectedVisit.checklist?.length ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    {ar ? "قائمة التقييم" : "Evaluation Checklist"}
                  </h4>
                  <div className="space-y-2">
                    {selectedVisit.checklist.map((item: any, index: number) => (
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
        </Modal>
      )}
    </section>
  );
}
