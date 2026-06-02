import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Target,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Star,
  Building2,
  BookOpen
} from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { useAuthStore } from "../../auth/auth.store";
import {
  useSupervisorDashboard,
  useUpdateSupervisorTargets,
  type SupervisorDashboard
} from "../staff-attendance.api";

const MONTH_NAMES_AR = [
  "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];
const MONTH_NAMES_EN = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface ProgressRingProps {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
}

function ProgressRing({ pct, size = 80, stroke = 7, color = "#10b981" }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  progressPct?: number;
  progressColor?: string;
}

function StatCard({ icon, label, value, sub, color = "teal", progressPct, progressColor }: StatCardProps) {
  const colorMap: Record<string, string> = {
    teal: "from-teal-500/10 to-emerald-500/10 border-teal-200",
    blue: "from-blue-500/10 to-indigo-500/10 border-blue-200",
    amber: "from-amber-500/10 to-orange-500/10 border-amber-200",
    rose: "from-rose-500/10 to-pink-500/10 border-rose-200"
  };
  const iconColorMap: Record<string, string> = {
    teal: "text-teal-600 bg-teal-50",
    blue: "text-blue-600 bg-blue-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50"
  };
  return (
    <div className={`relative rounded-2xl border bg-gradient-to-br p-5 ${colorMap[color] ?? colorMap.teal}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 ${iconColorMap[color] ?? iconColorMap.teal}`}>
            {icon}
          </div>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">{label}</div>
          {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
        </div>
        {progressPct !== undefined && (
          <div className="relative flex-shrink-0">
            <ProgressRing pct={progressPct} color={progressColor ?? "#10b981"} />
            <div className="absolute inset-0 flex items-center justify-center rotate-90">
              <span className="text-[11px] font-bold text-slate-600">{progressPct}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface EditTargetsModalProps {
  profile: SupervisorDashboard["profile"];
  onClose: () => void;
  ar: boolean;
}

function EditTargetsModal({ profile, onClose, ar }: EditTargetsModalProps) {
  const [hours, setHours] = useState(profile.monthlyHoursTarget);
  const [visits, setVisits] = useState(profile.monthlyVisitsTarget);
  const mutation = useUpdateSupervisorTargets();

  const handleSave = () => {
    mutation.mutate(
      { userId: profile.userId, monthlyHoursTarget: hours, monthlyVisitsTarget: visits },
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
        <h3 className="text-base font-bold text-slate-800 mb-5">
          {ar ? "تعديل الأهداف الشهرية" : "Edit Monthly Targets"}
        </h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">
              {ar ? "الهدف الشهري للساعات" : "Monthly Hours Target"}
            </label>
            <input
              type="number" min={1} max={400} value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">
              {ar ? "الهدف الشهري للزيارات" : "Monthly Visits Target"}
            </label>
            <input
              type="number" min={1} max={200} value={visits}
              onChange={(e) => setVisits(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave} disabled={mutation.isPending}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2 rounded-xl transition"
          >
            {mutation.isPending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2 rounded-xl hover:bg-slate-50 transition"
          >
            {ar ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface Props {
  supervisorId?: number;
}

export function SupervisorDashboardView({ supervisorId }: Props) {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((s) => s.user);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showEditTargets, setShowEditTargets] = useState(false);
  const [showUnvisited, setShowUnvisited] = useState(false);

  const isOpsAdmin = user?.role === "SUPER_ADMIN" || user?.role === "CENTER_ADMIN";

  const { data, isLoading, isError } = useSupervisorDashboard(
    { supervisorId, month, year }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center text-slate-400 py-16 text-sm">
        {ar ? "تعذّر تحميل بيانات المشرف" : "Could not load supervisor data"}
      </div>
    );
  }

  const monthNames = ar ? MONTH_NAMES_AR : MONTH_NAMES_EN;

  return (
    <div className="flex flex-col gap-6" dir={ar ? "rtl" : "ltr"}>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {ar ? "لوحة المشرف الإشرافية" : "Supervisor Dashboard"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {data.profile.fullName} — {monthNames[month]} {year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month/Year Selectors */}
          <select
            value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            {monthNames.slice(1).map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {isOpsAdmin && (
            <button
              onClick={() => setShowEditTargets(true)}
              className="text-xs font-semibold text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl transition"
            >
              {ar ? "تعديل الأهداف" : "Edit Targets"}
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label={ar ? "زيارات مكتملة" : "Completed Visits"}
          value={`${data.visits.completed} / ${data.visits.target}`}
          sub={ar ? `${data.visits.inProgress} جارية حالياً` : `${data.visits.inProgress} in progress`}
          color="teal"
          progressPct={data.visits.progressPct}
          progressColor="#10b981"
        />
        <StatCard
          icon={<Clock size={18} />}
          label={ar ? "ساعات العمل" : "Work Hours"}
          value={`${data.hours.worked}h`}
          sub={ar ? `الهدف: ${data.hours.target} ساعة` : `Target: ${data.hours.target}h`}
          color="blue"
          progressPct={data.hours.progressPct}
          progressColor="#3b82f6"
        />
        <StatCard
          icon={<Building2 size={18} />}
          label={ar ? "المراكز المكلّفة" : "Assigned Centers"}
          value={data.assignments.centersCount}
          sub={
            data.unvisitedCenters.length > 0
              ? ar
                ? `${data.unvisitedCenters.length} لم تُزر`
                : `${data.unvisitedCenters.length} not visited`
              : ar ? "جميعها زُورت ✓" : "All visited ✓"
          }
          color={data.unvisitedCenters.length > 0 ? "amber" : "teal"}
        />
        <StatCard
          icon={<BookOpen size={18} />}
          label={ar ? "الحلقات المكلّفة" : "Assigned Circles"}
          value={data.assignments.circlesCount}
          sub={
            data.unvisitedCircles.length > 0
              ? ar
                ? `${data.unvisitedCircles.length} لم تُزر`
                : `${data.unvisitedCircles.length} not visited`
              : ar ? "جميعها زُورت ✓" : "All visited ✓"
          }
          color={data.unvisitedCircles.length > 0 ? "rose" : "teal"}
        />
      </div>

      {/* ── Visit Plans Overview ── */}
      {data.visitPlans.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Target size={15} className="text-teal-600" />
            {ar ? "خطط الزيارات الشهرية" : "Monthly Visit Plans"}
          </h3>
          <div className="flex flex-col gap-3">
            {data.visitPlans.map((plan) => {
              const pct = plan.itemsCount > 0
                ? Math.round((plan.completedItems / plan.itemsCount) * 100)
                : 0;
              return (
                <div key={plan.id} className="flex items-center gap-3">
                  <div className="text-xs text-slate-600 font-medium w-36 truncate">{plan.centerName}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-teal-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 w-20 text-start">
                    {plan.completedItems}/{plan.itemsCount} {ar ? "بند" : "items"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Plan item status summary */}
          {(data.visits.planPending > 0 || data.visits.planMissed > 0) && (
            <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
                ⏳ {data.visits.planPending} {ar ? "معلقة" : "pending"}
              </span>
              {data.visits.planMissed > 0 && (
                <span className="text-xs text-rose-600 bg-rose-50 rounded-lg px-2 py-1">
                  ✗ {data.visits.planMissed} {ar ? "فائتة" : "missed"}
                </span>
              )}
              {data.visits.planCompleted > 0 && (
                <span className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1">
                  ✓ {data.visits.planCompleted} {ar ? "مكتملة" : "completed"}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Unvisited Circles (collapsible) ── */}
      {data.unvisitedCircles.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowUnvisited((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-amber-800"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-600" />
              {ar
                ? `${data.unvisitedCircles.length} حلقة لم تُزر هذا الشهر`
                : `${data.unvisitedCircles.length} circles not visited this month`}
            </span>
            {showUnvisited ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showUnvisited && (
            <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.unvisitedCircles.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-amber-100"
                >
                  <MapPin size={12} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-700">{c.name}</div>
                    <div className="text-[10px] text-slate-400">{c.centerName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Recent Visits ── */}
      {data.recentVisits.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <MapPin size={15} className="text-teal-600" />
            {ar ? "آخر الزيارات" : "Recent Visits"}
          </h3>
          <div className="flex flex-col divide-y divide-slate-100">
            {data.recentVisits.map((v) => {
              const started = new Date(v.startedAt);
              const duration = v.durationMinutes
                ? `${Math.floor(v.durationMinutes / 60)}h ${v.durationMinutes % 60}m`
                : null;
              return (
                <div key={v.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${v.endedAt ? "bg-emerald-500" : "bg-amber-400"}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-700 truncate">{v.centerName}</div>
                      {v.circleName && (
                        <div className="text-xs text-slate-400 truncate">{v.circleName}</div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {started.toLocaleDateString(ar ? "ar-SA" : "en-US")}
                        {" · "}
                        {started.toLocaleTimeString(ar ? "ar-SA" : "en-US", {
                          hour: "2-digit", minute: "2-digit", hour12: false
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {duration && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={11} /> {duration}
                      </span>
                    )}
                    {v.rating !== null && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <Star size={11} fill="currentColor" /> {v.rating}/5
                      </span>
                    )}
                    {!v.endedAt && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-lg px-1.5 py-0.5">
                        {ar ? "جارية" : "Active"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.recentVisits.length === 0 && data.unvisitedCircles.length === 0 && (
        <div className="text-center text-slate-400 py-10 text-sm">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          {ar ? "لا توجد زيارات مسجّلة لهذا الشهر" : "No visits recorded for this month"}
        </div>
      )}

      {showEditTargets && (
        <EditTargetsModal
          profile={data.profile}
          onClose={() => setShowEditTargets(false)}
          ar={ar}
        />
      )}
    </div>
  );
}
