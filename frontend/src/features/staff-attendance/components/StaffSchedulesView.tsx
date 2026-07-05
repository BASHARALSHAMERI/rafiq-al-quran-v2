import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, Users, Clock, Trash2, Edit2, Search, CheckCircle, XCircle } from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { fadeUp } from "../../../shared/pageAnimations";
import { useCentersQuery } from "../../org/org.hooks";
import {
  useStaffSchedules,
  useDeactivateStaffSchedule,
  type StaffScheduleAssignment,
} from "../staff-attendance.api";
import { StaffScheduleModal } from "./StaffScheduleModal";

const SCHEDULABLE_ROLES = [
  { value: "CENTER_ADMIN",    labelAr: "مدير مركز",    labelEn: "Center Admin" },
  { value: "ACCOUNTANT",      labelAr: "محاسب",        labelEn: "Accountant" },
  { value: "FINANCE_MANAGER", labelAr: "مدير مالي",   labelEn: "Finance Manager" },
  { value: "TREASURER",       labelAr: "أمين صندوق",  labelEn: "Treasurer" },
  { value: "AUDITOR",         labelAr: "مدقق حسابات", labelEn: "Auditor" },
];

const roleLabel = (role: string, ar: boolean) =>
  SCHEDULABLE_ROLES.find((r) => r.value === role)?.[ar ? "labelAr" : "labelEn"] ?? role;

// ── Main View ──────────────────────────────────────────────────────────────────
export function StaffSchedulesView() {
  const { language } = useI18n();
  const ar = language === "ar";

  const centersQ = useCentersQuery();
  const centers = centersQ.data?.items ?? [];

  const [filterCenter, setFilterCenter] = useState<number | "">("");
  const [filterRole, setFilterRole] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<StaffScheduleAssignment | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  const schedulesQ = useStaffSchedules({
    centerId: filterCenter !== "" ? filterCenter : undefined,
    staffRole: filterRole || undefined,
    isActive: filterActive,
  });
  const schedules = schedulesQ.data ?? [];

  const deactivateM = useDeactivateStaffSchedule();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schedules;
    return schedules.filter(
      (s) =>
        s.user.fullName.toLowerCase().includes(q) ||
        s.center.name.toLowerCase().includes(q) ||
        roleLabel(s.staffRole, ar).toLowerCase().includes(q)
    );
  }, [schedules, search, ar]);

  const handleDeactivate = (id: number) => {
    deactivateM.mutate(id, { onSuccess: () => setDeactivatingId(null) });
  };

  return (
    <section className="staff-ops-view ctr-workspace" dir={ar ? "rtl" : "ltr"}>
      {/* Controls */}
      <div className="ctr-controls mb-6 flex flex-wrap gap-3 items-center">
        <div className="ctr-search-wrap flex-1 min-w-[180px]">
          <Search className="ctr-search-icon" size={16} />
          <input
            className="ctr-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ar ? "ابحث بالاسم أو المركز أو الدور..." : "Search by name, center, or role..."}
          />
        </div>

        <select
          value={filterCenter}
          onChange={(e) => setFilterCenter(Number(e.target.value) || "")}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="">{ar ? "كل المراكز" : "All Centers"}</option>
          {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="">{ar ? "كل الأدوار" : "All Roles"}</option>
          {SCHEDULABLE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>{ar ? r.labelAr : r.labelEn}</option>
          ))}
        </select>

        <select
          value={filterActive === undefined ? "" : String(filterActive)}
          onChange={(e) => setFilterActive(e.target.value === "" ? undefined : e.target.value === "true")}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="true">{ar ? "نشط" : "Active"}</option>
          <option value="false">{ar ? "موقوف" : "Inactive"}</option>
          <option value="">{ar ? "الكل" : "All"}</option>
        </select>

        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 shrink-0">
          <Plus size={14} />
          {ar ? "إضافة جدول" : "Add Schedule"}
        </Button>
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        {schedulesQ.isError ? (
          <ErrorState
            title={ar ? "تعذر تحميل الجداول" : "Failed to load schedules"}
            onRetry={() => void schedulesQ.refetch()}
            retryLabel={ar ? "إعادة المحاولة" : "Retry"}
          />
        ) : schedulesQ.isLoading ? (
          <div className="ctr-grid-modern">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="ctr-card-modern animate-pulse" style={{ height: "200px", opacity: 0.5 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={ar ? "لا توجد جداول" : "No schedules found"}
            description={ar ? "لم يتم تعيين أي جداول بعد لهذا الفلتر." : "No schedule assignments match current filters."}
          />
        ) : (
          <div className="ctr-grid-modern">
            {filtered.map((sched) => (
              <motion.div key={sched.id} variants={fadeUp} initial="hidden" animate="visible" className="ctr-card-modern border-slate-50 shadow-sm">
                <div className="ctr-card-header">
                  <div className={`ctr-card-icon-box ${sched.isActive ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-400"}`}>
                    <Clock size={22} />
                  </div>
                  <div className="ctr-card-title-wrap">
                    <h3 className="ctr-card-title">{sched.user.fullName}</h3>
                    <div className="ctr-card-subtitle flex items-center gap-1.5">
                      <Users size={11} className="text-slate-400" />
                      <span>{roleLabel(sched.staffRole, ar)}</span>
                    </div>
                  </div>
                  <div className="ctr-card-status-row">
                    {sched.isActive
                      ? <Badge variant="success" size="sm">{ar ? "نشط" : "Active"}</Badge>
                      : <Badge variant="secondary" size="sm">{ar ? "موقوف" : "Inactive"}</Badge>}
                  </div>
                </div>

                <div className="ctr-card-details bg-slate-50/30 p-3 rounded-xl mt-3 space-y-2">
                  <div className="ctr-card-detail-row">
                    <span className="ctr-card-detail-label text-[11px]">{ar ? "المركز" : "Center"}</span>
                    <span className="ctr-card-detail-val font-medium text-[12px]">{sched.center.name}</span>
                  </div>
                  <div className="ctr-card-detail-row">
                    <span className="ctr-card-detail-label text-[11px]">{ar ? "تاريخ البدء" : "From"}</span>
                    <span className="ctr-card-detail-val text-[12px]">
                      <Calendar size={12} className="text-teal-500" />
                      {new Date(sched.effectiveFrom).toLocaleDateString(ar ? "ar-SA-u-nu-latn" : "en-US")}
                    </span>
                  </div>
                  {sched.effectiveTo && (
                    <div className="ctr-card-detail-row">
                      <span className="ctr-card-detail-label text-[11px]">{ar ? "تاريخ الانتهاء" : "To"}</span>
                      <span className="ctr-card-detail-val text-[12px]">
                        {new Date(sched.effectiveTo).toLocaleDateString(ar ? "ar-SA-u-nu-latn" : "en-US")}
                      </span>
                    </div>
                  )}
                  {sched.latitude != null && sched.longitude != null ? (
                    <div className="ctr-card-detail-row">
                      <span className="ctr-card-detail-label text-[11px]">{ar ? "الموقع" : "Location"}</span>
                      <span className="ctr-card-detail-val text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded" title={`${Number(sched.latitude).toFixed(5)}, ${Number(sched.longitude).toFixed(5)}`}>
                        📍 {sched.locationText || (ar ? "موقع مخصص" : "Custom Location")}
                      </span>
                    </div>
                  ) : (
                    <div className="ctr-card-detail-row">
                      <span className="ctr-card-detail-label text-[11px]">{ar ? "الموقع" : "Location"}</span>
                      <span className="ctr-card-detail-val text-[12px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        🏢 {ar ? "موقع المركز" : "Center Location"}
                      </span>
                    </div>
                  )}
                  <div className="ctr-card-detail-row">
                    <span className="ctr-card-detail-label text-[11px]">{ar ? "أيام الدوام" : "Work Days"}</span>
                    <span className="ctr-card-detail-val text-[12px] font-semibold text-teal-700">
                      {sched.slots.length} {ar ? "أيام" : "days"}
                    </span>
                  </div>
                </div>

                <div className="ctr-card-actions mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                  {sched.isActive && deactivatingId === sched.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-[11px] text-slate-500 flex-1">{ar ? "تأكيد الإيقاف؟" : "Confirm deactivate?"}</span>
                      <button
                        onClick={() => handleDeactivate(sched.id)}
                        disabled={deactivateM.isPending}
                        className="text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-1 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle size={11} /> {ar ? "نعم" : "Yes"}
                      </button>
                      <button
                        onClick={() => setDeactivatingId(null)}
                        className="text-[11px] font-bold text-slate-600 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50 transition flex items-center gap-1"
                      >
                        <XCircle size={11} /> {ar ? "لا" : "No"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(sched)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100 px-2 py-1.5 rounded-lg transition"
                        >
                          <Edit2 size={11} /> {ar ? "تعديل" : "Edit"}
                        </button>
                        {sched.isActive && (
                          <button
                            onClick={() => setDeactivatingId(sched.id)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2 py-1.5 rounded-lg transition"
                          >
                            <Trash2 size={11} /> {ar ? "إيقاف" : "Deactivate"}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <StaffScheduleModal
        ar={ar}
        isOpen={showCreate || !!editing}
        existing={editing}
        onClose={() => {
          setShowCreate(false);
          setEditing(null);
        }}
      />
    </section>
  );
}
