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
import CircleScheduleEditor from "../../org/CircleScheduleEditor";
import type { PrayerName } from "../../org/types";
import {
  createEmptyScheduleDraftRows,
  serializeScheduleDraftRows,
  validateScheduleDraftRows,
  type CircleScheduleDraftRow,
} from "../../org/circleSchedule";
import {
  useStaffSchedules,
  useStaffUsersByRole,
  useCreateStaffSchedule,
  useUpdateStaffSchedule,
  useDeactivateStaffSchedule,
  type StaffScheduleAssignment,
  type CreateSchedulePayload,
} from "../staff-attendance.api";

const SCHEDULABLE_ROLES = [
  { value: "CENTER_ADMIN",    labelAr: "مدير مركز",    labelEn: "Center Admin" },
  { value: "ACCOUNTANT",      labelAr: "محاسب",        labelEn: "Accountant" },
  { value: "FINANCE_MANAGER", labelAr: "مدير مالي",   labelEn: "Finance Manager" },
  { value: "TREASURER",       labelAr: "أمين صندوق",  labelEn: "Treasurer" },
  { value: "AUDITOR",         labelAr: "مدقق حسابات", labelEn: "Auditor" },
  { value: "SUPERVISOR",      labelAr: "مشرف",         labelEn: "Supervisor" },
];

const roleLabel = (role: string, ar: boolean) =>
  SCHEDULABLE_ROLES.find((r) => r.value === role)?.[ar ? "labelAr" : "labelEn"] ?? role;

// ── Create / Edit Modal ────────────────────────────────────────────────────────
interface ScheduleModalProps {
  ar: boolean;
  existing?: StaffScheduleAssignment | null;
  onClose: () => void;
}

function ScheduleModal({ ar, existing, onClose }: ScheduleModalProps) {
  const centersQ = useCentersQuery();
  const centers = centersQ.data?.items ?? [];

  const [staffRole, setStaffRole] = useState(existing?.staffRole ?? "");
  const [centerId, setCenterId] = useState<number | "">(existing?.centerId ?? "");
  const [userId, setUserId] = useState<number | "">(existing?.userId ?? "");
  const [effectiveFrom, setEffectiveFrom] = useState(existing?.effectiveFrom?.slice(0, 10) ?? "");
  const [effectiveTo, setEffectiveTo] = useState(existing?.effectiveTo?.slice(0, 10) ?? "");
  const [rows, setRows] = useState<CircleScheduleDraftRow[]>(() => {
    if (existing?.slots?.length) {
      return existing.slots.map((s) => ({
        day: s.dayOfWeek as CircleScheduleDraftRow["day"],
        enabled: true,
        mode: s.mode as "CLOCK" | "PRAYER",
        fromTime: s.fromTime ?? "",
        toTime: s.toTime ?? "",
        fromPrayer: (s.fromPrayer ?? "MAGHRIB") as PrayerName,
        toPrayer: (s.toPrayer ?? "ISHA") as PrayerName,
      }));
    }
    return createEmptyScheduleDraftRows();
  });
  const [slotError, setSlotError] = useState<string | null>(null);

  const usersQ = useStaffUsersByRole(staffRole || undefined);
  const users = usersQ.data ?? [];

  const createM = useCreateStaffSchedule();
  const updateM = useUpdateStaffSchedule();
  const isPending = createM.isPending || updateM.isPending;
  const isError = createM.isError || updateM.isError;

  const handleSubmit = () => {
    const slotsError = validateScheduleDraftRows(rows, ar);
    if (slotsError) { setSlotError(slotsError); return; }
    setSlotError(null);
    const circleRows = serializeScheduleDraftRows(rows);
    const slots = circleRows.map((row) => ({
      dayOfWeek: row.day,
      mode: row.mode,
      fromTime: row.mode === "CLOCK" ? row.fromTime : null,
      toTime: row.mode === "CLOCK" ? row.toTime : null,
      fromPrayer: row.mode === "PRAYER" ? row.fromPrayer : null,
      toPrayer: row.mode === "PRAYER" ? row.toPrayer : null,
    }));

    if (existing) {
      updateM.mutate(
        { id: existing.id, payload: { effectiveTo: effectiveTo || null, slots } },
        { onSuccess: onClose }
      );
    } else {
      if (!staffRole || !centerId || !userId || !effectiveFrom) return;
      const payload: CreateSchedulePayload = {
        userId: Number(userId),
        staffRole,
        centerId: Number(centerId),
        effectiveFrom,
        effectiveTo: effectiveTo || null,
        slots,
      };
      createM.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4"
        dir={ar ? "rtl" : "ltr"}
      >
        <h3 className="text-base font-bold text-slate-800 mb-5">
          {existing
            ? (ar ? "تعديل الجدول" : "Edit Schedule")
            : (ar ? "إضافة جدول جديد" : "New Schedule Assignment")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Staff Role */}
          {!existing && (
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">{ar ? "الدور الوظيفي *" : "Staff Role *"}</label>
              <select
                value={staffRole}
                onChange={(e) => { setStaffRole(e.target.value); setUserId(""); }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">{ar ? "اختر الدور" : "Select role"}</option>
                {SCHEDULABLE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{ar ? r.labelAr : r.labelEn}</option>
                ))}
              </select>
            </div>
          )}

          {/* Center */}
          {!existing && (
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">{ar ? "المركز *" : "Center *"}</label>
              <select
                value={centerId}
                onChange={(e) => setCenterId(Number(e.target.value) || "")}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">{ar ? "اختر المركز" : "Select center"}</option>
                {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* User */}
          {!existing && (
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">{ar ? "الموظف *" : "Staff member *"}</label>
              <select
                value={userId}
                onChange={(e) => setUserId(Number(e.target.value) || "")}
                disabled={!staffRole}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
              >
                <option value="">{staffRole ? (ar ? "اختر الموظف" : "Select staff") : (ar ? "اختر الدور أولاً" : "Choose role first")}</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
          )}

          {/* Effective From */}
          {!existing && (
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">{ar ? "تاريخ البدء *" : "Effective From *"}</label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          )}

          {/* Effective To */}
          <div className={existing ? "sm:col-span-2" : ""}>
            <label className="text-xs font-medium text-slate-500 block mb-1">{ar ? "تاريخ الانتهاء (اختياري)" : "Effective To (optional)"}</label>
            <input
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>

        {/* Schedule Editor */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-500 block mb-2">{ar ? "أوقات الدوام *" : "Work Schedule *"}</label>
          <CircleScheduleEditor rows={rows} onChange={setRows} ar={ar} error={slotError} />
        </div>

        {isError && (
          <p className="text-xs text-rose-600 mb-3">{ar ? "فشل الحفظ. حاول مرة أخرى." : "Save failed. Please try again."}</p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={isPending || (!existing && (!staffRole || !centerId || !userId || !effectiveFrom))}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2 rounded-xl transition disabled:opacity-50"
          >
            {isPending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
          </button>
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2 rounded-xl hover:bg-slate-50 transition">
            {ar ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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

      {showCreate && <ScheduleModal ar={ar} onClose={() => setShowCreate(false)} />}
      {editing && <ScheduleModal ar={ar} existing={editing} onClose={() => setEditing(null)} />}
    </section>
  );
}
