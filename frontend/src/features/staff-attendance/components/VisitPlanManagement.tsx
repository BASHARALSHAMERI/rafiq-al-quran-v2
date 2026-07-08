import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, CheckCircle, Clock3, MapPin, Pencil, Plus, Target, Trash2, ChevronRight, ChevronLeft, MoreHorizontal, Calendar } from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { useCentersQuery, useCirclesQuery } from "../../org/org.hooks";
import { useUsersQuery } from "../../users/users.hooks";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import type {
  AddPlanItemPayload,
  PlanItemStatus,
  UpdatePlanItemPayload,
  VisitPlan,
  VisitPlanItem,
  VisitPlanStatus,
  VisitPriority
} from "../staff-attendance.api";
import {
  useAddPlanItem,
  useCreatePlan,
  useRemovePlanItem,
  useUpdatePlanItem,
  useUpdatePlanStatus,
  useVisitPlans
} from "../staff-attendance.api";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
import { entityFeedback, notifyError, notifySuccess, type LocalizedLabel } from "../../../shared/ui/feedback";
import { useClientPagination } from "../../../shared/ui/useClientPagination";
import { fadeUp } from "../../../shared/pageAnimations";

type CreatePlanFormState = {
  supervisorId: string;
  centerId: string;
  month: string;
  year: string;
};

type ItemFormState = {
  centerId: string;
  circleId: string;
  plannedDate: string;
  plannedTimeWindow: string;
  plannedStartTime: string;
  plannedEndTime: string;
  priority: VisitPriority;
  notes: string;
};

const VISIT_PLAN_ENTITY: LocalizedLabel = { ar: "خطة الزيارات", en: "visit plan" };
const VISIT_ITEM_ENTITY: LocalizedLabel = { ar: "الزيارة", en: "visit" };

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  labelEn: new Date(2026, index).toLocaleString("en-US", { month: "long" }),
  labelAr: new Date(2026, index).toLocaleString("ar-SA-u-nu-latn", { month: "long" })
}));

const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const getDayLabel = (date: string, ar: boolean) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(ar ? "ar-SA-u-nu-latn" : "en-US", {
    weekday: "long"
  });

const createPlanForm = (month: number, year: number): CreatePlanFormState => ({
  supervisorId: "",
  centerId: "",
  month: String(month),
  year: String(year)
});

const createItemForm = (centerId?: number, month?: number, year?: number): ItemFormState => {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1;
  const day = Math.min(now.getDate(), new Date(targetYear, targetMonth, 0).getDate());

  return {
    centerId: centerId ? String(centerId) : "",
    circleId: "",
    plannedDate: toIsoDate(targetYear, targetMonth, day),
    plannedTimeWindow: "",
    plannedStartTime: "",
    plannedEndTime: "",
    priority: "NORMAL",
    notes: ""
  };
};

const itemToForm = (item: VisitPlanItem): ItemFormState => ({
  centerId: String(item.centerId),
  circleId: item.circleId ? String(item.circleId) : "",
  plannedDate: item.plannedDate.slice(0, 10),
  plannedTimeWindow: item.plannedTimeWindow ?? "",
  plannedStartTime: item.plannedStartAt ? new Date(item.plannedStartAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "",
  plannedEndTime: item.plannedEndAt ? new Date(item.plannedEndAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "",
  priority: item.priority,
  notes: item.notes ?? ""
});

function getStatusBadge(status: VisitPlanStatus, ar: boolean) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary" size="sm">{ar ? "مسودة" : "Draft"}</Badge>;
    case "ACTIVE":
      return <Badge variant="warning" size="sm">{ar ? "نشطة" : "Active"}</Badge>;
    case "COMPLETED":
      return <Badge variant="success" size="sm">{ar ? "مكتملة" : "Completed"}</Badge>;
    default:
      return <Badge variant="secondary" size="sm">{status}</Badge>;
  }
}

function getItemStatusBadge(status: PlanItemStatus, ar: boolean) {
  switch (status) {
    case "PENDING":
      return <Badge variant="warning" size="sm">{ar ? "قيد الانتظار" : "Pending"}</Badge>;
    case "COMPLETED":
      return <Badge variant="success" size="sm">{ar ? "مكتمل" : "Completed"}</Badge>;
    case "MISSED":
      return <Badge variant="error" size="sm">{ar ? "فات" : "Missed"}</Badge>;
    case "RESCHEDULED":
      return <Badge variant="info" size="sm">{ar ? "أعيدت جدولته" : "Rescheduled"}</Badge>;
    default:
      return <Badge variant="secondary" size="sm">{status}</Badge>;
  }
}

function CreatePlanModal({
  ar,
  form,
  setForm,
  onClose,
  onSubmit,
  disabled
}: {
  ar: boolean;
  form: CreatePlanFormState;
  setForm: Dispatch<SetStateAction<CreatePlanFormState>>;
  onClose: () => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const centersQuery = useCentersQuery();
  const supervisorsQuery = useUsersQuery({ role: "SUPERVISOR", page: 1, pageSize: 250 }, true);

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="sm"
      title={ar ? "إنشاء خطة زيارات" : "Create Visit Plan"}
      panelClassName="users-modal-panel staff-ops-users-modal-panel"
      bodyClassName="users-modal-body staff-ops-users-modal-body"
      footerClassName="users-modal-footer staff-ops-users-modal-footer"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="button" variant="primary" onClick={onSubmit} disabled={disabled}>
            {ar ? "إنشاء" : "Create"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 p-2">
        <Select
          value={form.supervisorId}
          onChange={(event) => setForm((current) => ({ ...current, supervisorId: event.target.value }))}
          options={[
            { value: "", label: ar ? "اختر المشرف" : "Select supervisor" },
            ...(supervisorsQuery.data?.items ?? []).map((user) => ({
              value: user.id,
              label: user.fullName
            }))
          ]}
        />
        <Select
          value={form.centerId}
          onChange={(event) => setForm((current) => ({ ...current, centerId: event.target.value }))}
          options={[
            { value: "", label: ar ? "اختر المركز" : "Select center" },
            ...(centersQuery.data?.items ?? []).map((center) => ({
              value: center.id,
              label: center.nameAr || center.name
            }))
          ]}
        />
        <Select
          value={form.month}
          onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))}
          options={MONTHS.map((month) => ({
            value: month.value,
            label: ar ? month.labelAr : month.labelEn
          }))}
        />
        <Input
          type="number"
          value={form.year}
          onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))}
        />
      </div>
    </Modal>
  );
}

function PlanDetailsModal({
  ar,
  plan,
  onClose,
  onActivate,
  onAddVisit,
  onEditItem,
  onRemoveItem
}: {
  ar: boolean;
  plan: VisitPlan;
  onClose: () => void;
  onActivate: () => void;
  onAddVisit: () => void;
  onEditItem: (item: VisitPlanItem) => void;
  onRemoveItem: (itemId: number) => void;
}) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={ar ? `خطة الزيارات: ${plan.supervisor.fullName}` : `Visit Plan: ${plan.supervisor.fullName}`}
      panelClassName="users-modal-panel staff-ops-users-modal-panel"
      bodyClassName="users-modal-body staff-ops-users-modal-body !p-0 bg-slate-50/30"
    >
      <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-slate-700">
          <MapPin size={18} className="text-brand" />
          <h3 className="font-bold text-[15px]">{ar ? "جدول الزيارات اليومية" : "Daily Visit Schedule"}</h3>
        </div>
        <div className="flex gap-2">
          {plan.status === "DRAFT" && (
            <Button size="sm" variant="primary" onClick={onActivate}>
              {ar ? "تفعيل الخطة" : "Activate Plan"}
            </Button>
          )}
          {plan.status !== "COMPLETED" && (
            <Button size="sm" variant="ghost" className="bg-white border border-slate-200 shadow-sm hover:border-brand" onClick={onAddVisit}>
              <Plus size={14} className="me-1" /> {ar ? "إضافة زيارة" : "Add Visit"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
        {plan.items.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-400 text-[13px]">
            {ar ? "لم يتم إضافة زيارات لهذه الخطة بعد" : "No visits added to this plan yet"}
          </div>
        ) : (
          plan.items
            .slice()
            .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))
            .map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-brand/30 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-[13px] text-slate-800">
                      {item.center?.name || `Center #${item.centerId}`}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                      <Calendar size={10} />
                      <span>{new Date(item.plannedDate).toLocaleDateString(ar ? "ar-SA-u-nu-latn" : "en-US")}</span>
                      <span>•</span>
                      <span>{getDayLabel(item.plannedDate, ar)}</span>
                    </div>
                  </div>
                  {getItemStatusBadge(item.status, ar)}
                </div>

                <div className="flex flex-col gap-1.5 mb-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" size="sm" className="text-[10px]">
                      {item.circle?.name || (ar ? "زيارة مركز" : "Center Visit")}
                    </Badge>
                    <Badge
                      variant={item.priority === "URGENT" ? "error" : item.priority === "HIGH" ? "warning" : "secondary"}
                      size="sm"
                      className="text-[10px]"
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  {item.notes && <p className="text-[11px] text-slate-500 italic line-clamp-1 mt-1">"{item.notes}"</p>}
                </div>

                {plan.status !== "COMPLETED" && item.status !== "COMPLETED" && (
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-slate-50 mt-2">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => onEditItem(item)}>
                      <Pencil size={12} className="me-1" /> {ar ? "تعديل" : "Edit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] text-red-600 hover:bg-red-50"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 size={12} className="me-1" /> {ar ? "حذف" : "Delete"}
                    </Button>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </Modal>
  );
}

function PlanItemModal({
  ar,
  mode,
  planMonth,
  planYear,
  form,
  setForm,
  onClose,
  onSubmit,
  disabled
}: {
  ar: boolean;
  mode: "create" | "edit";
  planMonth: number;
  planYear: number;
  form: ItemFormState;
  setForm: Dispatch<SetStateAction<ItemFormState>>;
  onClose: () => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const centersQuery = useCentersQuery();
  const circlesQuery = useCirclesQuery(form.centerId ? Number(form.centerId) : undefined, {
    enabled: Boolean(form.centerId)
  });

  const daysInMonth = new Date(planYear, planMonth, 0).getDate();
  const selectedDay = String(new Date(`${form.plannedDate}T12:00:00`).getDate());

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="sm"
      title={mode === "create" ? (ar ? "إضافة زيارة يومية" : "Add Daily Visit") : ar ? "تعديل الزيارة" : "Edit Visit"}
      panelClassName="users-modal-panel staff-ops-users-modal-panel"
      bodyClassName="users-modal-body staff-ops-users-modal-body"
      footerClassName="users-modal-footer staff-ops-users-modal-footer"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="button" variant="primary" onClick={onSubmit} disabled={disabled}>
            {mode === "create" ? (ar ? "إضافة" : "Add") : ar ? "حفظ التعديل" : "Save Changes"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 p-2">
        <div className="col-span-full staff-ops-modal__info-callout">
          <Clock3 className="w-4 h-4 flex-shrink-0" />
          <span>
            {ar
              ? `هذه الزيارة ضمن شهر ${planMonth}/${planYear}. يمكنك تحديد يوم، مركز، وحلقة مستهدفة.`
              : `This visit belongs to ${planMonth}/${planYear}. Pick day, center, and optional circle.`}
          </span>
        </div>
        <Select
          value={form.centerId}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              centerId: event.target.value,
              circleId: ""
            }))
          }
          options={[
            { value: "", label: ar ? "اختر المركز" : "Select center" },
            ...(centersQuery.data?.items ?? []).map((center) => ({
              value: center.id,
              label: center.nameAr || center.name
            }))
          ]}
        />
        <Select
          value={form.circleId}
          onChange={(event) => {
            const circleId = event.target.value;
            let recommendedTime = form.plannedTimeWindow;
            let recommendedStart = form.plannedStartTime;
            let recommendedEnd = form.plannedEndTime;
            if (circleId) {
              const circle = circlesQuery.data?.items.find((c) => String(c.id) === circleId);
              if (circle?.weeklySchedule && circle.weeklySchedule.length > 0) {
                const dayOfWeekMap = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
                const dateObj = new Date(form.plannedDate);
                const dayStr = dayOfWeekMap[dateObj.getDay()];
                const row = circle.weeklySchedule.find((s) => s.dayOfWeek === dayStr) as any;
                if (row?.startTime && row?.endTime) {
                  recommendedTime = `${row.startTime} - ${row.endTime}`;
                  recommendedStart = row.startTime;
                  recommendedEnd = row.endTime;
                } else {
                  const firstRow = circle.weeklySchedule[0] as any;
                  if (firstRow?.startTime && firstRow?.endTime) {
                    recommendedTime = `${firstRow.startTime} - ${firstRow.endTime}`;
                    recommendedStart = firstRow.startTime;
                    recommendedEnd = firstRow.endTime;
                  }
                }
              }
            }
            setForm((current) => ({ ...current, circleId, plannedTimeWindow: recommendedTime, plannedStartTime: recommendedStart, plannedEndTime: recommendedEnd }));
          }}
          options={[
            { value: "", label: ar ? "زيارة مركز فقط" : "Center only (no circle)" },
            ...(circlesQuery.data?.items ?? []).map((circle) => ({
              value: circle.id,
              label: circle.nameAr || circle.name
            }))
          ]}
        />
        <Select
          value={selectedDay}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              plannedDate: toIsoDate(planYear, planMonth, Number(event.target.value))
            }))
          }
          options={Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const date = toIsoDate(planYear, planMonth, day);
            return {
              value: String(day),
              label: `${day} - ${getDayLabel(date, ar)}`
            };
          })}
        />
        <Input
          type="date"
          value={form.plannedDate}
          readOnly
          style={{ opacity: 0.6, cursor: "default", pointerEvents: "none" }}
          aria-label={ar ? "التاريخ المحسوب" : "Computed date"}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="time"
            value={form.plannedStartTime}
            onChange={(event) => {
              const newStart = event.target.value;
              setForm((current) => ({
                ...current,
                plannedStartTime: newStart,
                plannedTimeWindow: newStart && current.plannedEndTime ? `${newStart} - ${current.plannedEndTime}` : current.plannedTimeWindow
              }));
            }}
            placeholder={ar ? "وقت البداية" : "Start Time"}
            aria-label={ar ? "وقت البداية" : "Start Time"}
          />
          <Input
            type="time"
            value={form.plannedEndTime}
            onChange={(event) => {
              const newEnd = event.target.value;
              setForm((current) => ({
                ...current,
                plannedEndTime: newEnd,
                plannedTimeWindow: current.plannedStartTime && newEnd ? `${current.plannedStartTime} - ${newEnd}` : current.plannedTimeWindow
              }));
            }}
            placeholder={ar ? "وقت النهاية" : "End Time"}
            aria-label={ar ? "وقت النهاية" : "End Time"}
          />
        </div>
        <Input
          value={form.plannedTimeWindow}
          onChange={(event) => setForm((current) => ({ ...current, plannedTimeWindow: event.target.value }))}
          placeholder={ar ? "نطاق وقت الزيارة للعرض (مثال: 16:00 - 18:00)" : "Display time window (e.g. 16:00 - 18:00)"}
          aria-label={ar ? "نطاق الوقت" : "Time window"}
        />
        <Select
          value={form.priority}
          onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as VisitPriority }))}
          options={[
            { value: "LOW", label: ar ? "منخفضة" : "Low" },
            { value: "NORMAL", label: ar ? "عادية" : "Normal" },
            { value: "HIGH", label: ar ? "عالية" : "High" },
            { value: "URGENT", label: ar ? "عاجلة" : "Urgent" }
          ]}
        />
        <Input
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          placeholder={ar ? "ملاحظات" : "Notes"}
        />
      </div>
    </Modal>
  );
}

export function VisitPlanManagement() {
  const { language } = useI18n();
  const ar = language === "ar";

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [filterStatus, setFilterStatus] = useState<"ALL" | VisitPlanStatus>("ALL");
  const [filterSupervisorId, setFilterSupervisorId] = useState("");
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [itemPlan, setItemPlan] = useState<VisitPlan | null>(null);
  const [editingItem, setEditingItem] = useState<{ plan: VisitPlan; item: VisitPlanItem } | null>(null);
  const [planForm, setPlanForm] = useState<CreatePlanFormState>(
    createPlanForm(now.getMonth() + 1, now.getFullYear())
  );
  const [itemForm, setItemForm] = useState<ItemFormState>(createItemForm());

  const plansQuery = useVisitPlans({
    month: Number(filterMonth),
    year: Number(filterYear),
    supervisorId: filterSupervisorId ? Number(filterSupervisorId) : undefined,
    status: filterStatus === "ALL" ? undefined : filterStatus
  });
  const createPlan = useCreatePlan();
  const addPlanItem = useAddPlanItem();
  const updatePlanItem = useUpdatePlanItem();
  const removePlanItem = useRemovePlanItem();
  const updatePlanStatus = useUpdatePlanStatus();
  const supervisorsQuery = useUsersQuery({ role: "SUPERVISOR", page: 1, pageSize: 250 }, true);

  const plans = plansQuery.data ?? [];
  const pagination = useClientPagination(plans, { initialPageSize: 15 });
  const expandedPlan = useMemo(
    () => plans.find((plan) => plan.id === expandedPlanId) ?? null,
    [expandedPlanId, plans]
  );

  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((plan) => plan.status === "ACTIVE").length;
    const completed = plans.filter((plan) => plan.status === "COMPLETED").length;
    const averageCompletion =
      total > 0
        ? Math.round(plans.reduce((sum, plan) => sum + plan.completionRate, 0) / total)
        : 0;

    return [
      { label: ar ? "إجمالي الخطط" : "Total Plans", value: total, cls: "brand", icon: CalendarDays },
      { label: ar ? "خطط نشطة" : "Active Plans", value: active, cls: "amber", icon: Target },
      { label: ar ? "خطط مكتملة" : "Completed", value: completed, cls: "emerald", icon: CheckCircle },
      {
        label: ar ? "نسبة الإنجاز" : "Completion",
        value: `${averageCompletion}%`,
        cls: "violet",
        icon: MapPin
      }
    ];
  }, [ar, plans]);

  const handleCreatePlan = () => {
    createPlan.mutate(
      {
        supervisorId: Number(planForm.supervisorId),
        centerId: Number(planForm.centerId),
        month: Number(planForm.month),
        year: Number(planForm.year)
      },
      {
        onSuccess: () => {
          notifySuccess(entityFeedback.success(ar, "create", VISIT_PLAN_ENTITY));
          setShowCreateModal(false);
          setPlanForm(createPlanForm(Number(filterMonth), Number(filterYear)));
        },
        onError: (error) => notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: entityFeedback.error(ar, "create", VISIT_PLAN_ENTITY) }))
      }
    );
  };

  const handleAddItem = () => {
    if (!itemPlan) return;

    const payload: { planId: number } & AddPlanItemPayload = {
      planId: itemPlan.id,
      centerId: Number(itemForm.centerId),
      circleId: itemForm.circleId ? Number(itemForm.circleId) : null,
      plannedDate: itemForm.plannedDate,
      plannedTimeWindow: itemForm.plannedTimeWindow || undefined,
      plannedStartAt: itemForm.plannedStartTime ? new Date(`${itemForm.plannedDate}T${itemForm.plannedStartTime}`).toISOString() : undefined,
      plannedEndAt: itemForm.plannedEndTime ? new Date(`${itemForm.plannedDate}T${itemForm.plannedEndTime}`).toISOString() : undefined,
      priority: itemForm.priority,
      notes: itemForm.notes || undefined
    };

    addPlanItem.mutate(payload, {
      onSuccess: () => {
        notifySuccess(entityFeedback.success(ar, "create", VISIT_ITEM_ENTITY));
        setItemPlan(null);
        setItemForm(createItemForm());
      },
      onError: (error) => notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: entityFeedback.error(ar, "create", VISIT_ITEM_ENTITY) }))
    });
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    const payload: UpdatePlanItemPayload & { itemId: number } = {
      itemId: editingItem.item.id,
      centerId: Number(itemForm.centerId),
      circleId: itemForm.circleId ? Number(itemForm.circleId) : null,
      plannedDate: itemForm.plannedDate,
      plannedTimeWindow: itemForm.plannedTimeWindow || undefined,
      plannedStartAt: itemForm.plannedStartTime ? new Date(`${itemForm.plannedDate}T${itemForm.plannedStartTime}`).toISOString() : undefined,
      plannedEndAt: itemForm.plannedEndTime ? new Date(`${itemForm.plannedDate}T${itemForm.plannedEndTime}`).toISOString() : undefined,
      priority: itemForm.priority,
      notes: itemForm.notes || undefined
    };

    updatePlanItem.mutate(payload, {
      onSuccess: () => {
        notifySuccess(entityFeedback.success(ar, "update", VISIT_ITEM_ENTITY));
        setEditingItem(null);
        setItemForm(createItemForm());
      },
      onError: (error) => notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: entityFeedback.error(ar, "update", VISIT_ITEM_ENTITY) }))
    });
  };

  return (
    <section className="staff-ops-view ctr-workspace">
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
      <div className="ctr-controls mb-6 staff-ops-toolbar staff-ops-toolbar--plans staff-ops-toolbar--plans-row">
        <select
          className="ctr-search-input staff-ops-toolbar__field staff-ops-toolbar__field--supervisor"
          value={filterSupervisorId}
          onChange={(e) => {
            setFilterSupervisorId(e.target.value);
            pagination.setCurrentPage(1);
          }}
        >
          <option value="">{ar ? "كل المشرفين" : "All Supervisors"}</option>
          {supervisorsQuery.data?.items.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>

        <select
          className="ctr-search-input staff-ops-toolbar__field staff-ops-toolbar__field--status"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as any);
            pagination.setCurrentPage(1);
          }}
        >
          <option value="ALL">{ar ? "كل الحالات" : "All Status"}</option>
          <option value="DRAFT">{ar ? "مسودة" : "Draft"}</option>
          <option value="ACTIVE">{ar ? "نشطة" : "Active"}</option>
          <option value="COMPLETED">{ar ? "مكتملة" : "Completed"}</option>
        </select>

        <div className="staff-ops-toolbar__period">
          <select
            className="ctr-search-input staff-ops-toolbar__period-input !w-[100px] text-center text-xs font-semibold cursor-pointer"
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(e.target.value);
              pagination.setCurrentPage(1);
            }}
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
          <span className="staff-ops-toolbar__period-sep">/</span>
          <input
            type="number"
            className="ctr-search-input staff-ops-toolbar__period-input staff-ops-toolbar__period-input--year"
            value={filterYear}
            onChange={(e) => {
              setFilterYear(e.target.value);
              pagination.setCurrentPage(1);
            }}
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          className="h-9 px-4 staff-ops-toolbar__action-btn staff-ops-toolbar__action-btn--inline-end"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} className="me-1.5" /> {ar ? "إنشاء خطة" : "Create Plan"}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {plansQuery.isError ? (
          <ErrorState title={ar ? "تعذر تحميل الخطط" : "Unable to load plans"} onRetry={() => void plansQuery.refetch()} />
        ) : plansQuery.isLoading ? (
          <div className="ctr-grid-modern">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="ctr-card-modern animate-pulse h-40 opacity-50" />
            ))}
          </div>
        ) : pagination.pagedRows.length === 0 ? (
          <EmptyState title={ar ? "لا توجد خطط" : "No plans found"} />
        ) : (
          <div className="space-y-6">
            <div className="ctr-grid-modern">
              {pagination.pagedRows.map((plan) => {
                const isExpanded = expandedPlanId === plan.id;
                return (
                  <motion.div
                    key={plan.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className={`ctr-card-modern transition-all ${isExpanded ? "ring-2 ring-brand border-brand shadow-lg" : "hover:border-brand/30"}`}
                  >
                    <div className="ctr-card-header">
                      <div className="ctr-card-icon-box bg-slate-100 text-slate-700 font-black text-xs">
                        {plan.supervisor.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ctr-card-title-wrap">
                        <h3 className="ctr-card-title text-[15px] font-bold">{plan.supervisor.fullName}</h3>
                        <div className="ctr-card-subtitle flex items-center gap-1.5">
                          <Target size={12} className="text-slate-400" />
                          <span className="text-slate-500 font-medium text-[11px]">{plan.center?.name || "N/A"}</span>
                        </div>
                      </div>
                      <div className="ctr-card-status-row">
                        {getStatusBadge(plan.status, ar)}
                      </div>
                    </div>

                    <div className="ctr-card-details bg-slate-50/30 p-3 rounded-xl mt-3 space-y-2">
                      <div className="ctr-card-detail-row">
                        <span className="ctr-card-detail-label text-[10px]">{ar ? "الفترة الزمنية" : "Plan Period"}</span>
                        <Badge variant="secondary" size="sm" className="font-bold text-[10px]">
                          {plan.month}/{plan.year}
                        </Badge>
                      </div>

                      <div className="ctr-card-detail-row">
                        <span className="ctr-card-detail-label text-[10px]">{ar ? "عدد الزيارات" : "Visits Count"}</span>
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-brand" />
                          <span className="text-[11px] font-black">{plan.items.length}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] text-slate-500 font-medium">{ar ? "نسبة الإنجاز" : "Completion"}</span>
                          <span className="text-[10px] font-black text-emerald-600">{plan.completionRate}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${plan.completionRate}%` }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="ctr-card-actions mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-[11px] font-bold text-brand hover:bg-brand/5"
                        onClick={() => setExpandedPlanId(plan.id)}
                      >
                        {ar ? "عرض الزيارات" : "View Visits"}
                      </Button>
                      
                      <div className="flex gap-1">
                         <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-slate-400">
                           <MoreHorizontal size={14} />
                         </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>


          </div>
        )}
      </AnimatePresence>

      {/* ── Pagination ── */}
      {!plansQuery.isLoading && pagination.totalItems > 0 && (
        <div className="ctr-footer mt-6">
          <div className="ctr-page-size">
            <span>{ar ? "الصفوف:" : "Rows:"}</span>
            <select value={pagination.pageSize} onChange={(e) => pagination.setPageSize(Number(e.target.value))}>
              {[15, 30, 50].map((sz) => <option key={sz} value={sz}>{sz}</option>)}
            </select>
          </div>
          <div className="ctr-page-info text-slate-500">
            {ar ? `عرض ${pagination.currentPage} من ${pagination.totalPages}` : `Page ${pagination.currentPage} of ${pagination.totalPages}`}
          </div>
          <div className="ctr-page-controls">
            <button className="ctr-page-btn" disabled={pagination.currentPage === 1} onClick={() => pagination.setCurrentPage(p => p - 1)}><ChevronRight size={16} /></button>
            <button className="ctr-page-btn active">{pagination.currentPage}</button>
            <button className="ctr-page-btn" disabled={pagination.currentPage === pagination.totalPages} onClick={() => pagination.setCurrentPage(p => p + 1)}><ChevronLeft size={16} /></button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {expandedPlan && (
        <PlanDetailsModal
          ar={ar}
          plan={expandedPlan}
          onClose={() => setExpandedPlanId(null)}
          onActivate={() => updatePlanStatus.mutate({ planId: expandedPlan.id, status: 'ACTIVE' })}
          onAddVisit={() => {
            setItemPlan(expandedPlan);
            setItemForm(createItemForm(expandedPlan.centerId, expandedPlan.month, expandedPlan.year));
          }}
          onEditItem={(item) => {
            setEditingItem({ plan: expandedPlan, item });
            setItemForm(itemToForm(item));
          }}
          onRemoveItem={(itemId) => removePlanItem.mutate(itemId)}
        />
      )}

      {showCreateModal && (
        <CreatePlanModal
          ar={ar}
          form={planForm}
          setForm={setPlanForm}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePlan}
          disabled={createPlan.isPending || !planForm.supervisorId || !planForm.centerId}
        />
      )}

      {itemPlan && (
        <PlanItemModal
          ar={ar}
          mode="create"
          planMonth={itemPlan.month}
          planYear={itemPlan.year}
          form={itemForm}
          setForm={setItemForm}
          onClose={() => setItemPlan(null)}
          onSubmit={handleAddItem}
          disabled={addPlanItem.isPending || !itemForm.centerId || !itemForm.plannedDate}
        />
      )}

      {editingItem && (
        <PlanItemModal
          ar={ar}
          mode="edit"
          planMonth={editingItem.plan.month}
          planYear={editingItem.plan.year}
          form={itemForm}
          setForm={setItemForm}
          onClose={() => setEditingItem(null)}
          onSubmit={handleUpdateItem}
          disabled={updatePlanItem.isPending || !itemForm.centerId || !itemForm.plannedDate}
        />
      )}
    </section>
  );
}
