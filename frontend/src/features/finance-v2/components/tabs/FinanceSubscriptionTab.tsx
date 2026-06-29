import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Power, PowerOff, User, Receipt, Hash, Calendar, StickyNote, AlertCircle } from "lucide-react";
import { useUsersQuery } from "../../../users/users.hooks";
import { useCentersQuery } from "../../../org/org.hooks";
import {
  useFinanceV2TuitionPlansQuery,
  useCreateFinanceV2TuitionPlanMutation,
  useUpdateFinanceV2TuitionPlanMutation,
  useFinanceV2StudentFeeProfilesQuery,
  useCreateFinanceV2StudentFeeProfileMutation,
  useUpdateFinanceV2StudentFeeProfileMutation
} from "../../finance-v2.hooks";
import { FinSkeleton, FinancePaginationFooter } from "../FinanceShared";
import { FinanceMoney } from "../../design";
import { FinanceDataTable } from "../../design/FinanceDataTable";
import Modal from "../../../../components/ui/Modal";
import { Button } from "../../../../components/ui/Button";
import { notifySuccess, notifyError } from "../../../../shared/ui/feedback";
import { getLocalizedApiErrorMessage } from "../../../../shared/api/error";
import useClientPagination from "../../../../shared/ui/useClientPagination";
import type { TuitionPlanV2, StudentFeeProfileV2 } from "../../types";

type Props = {
  centerId: number | undefined;
  isAdmin: boolean;
  ar: boolean;
};

export default function FinanceSubscriptionTab({ centerId, isAdmin, ar }: Props) {
  const [planModal, setPlanModal] = useState<{ mode: "create" | "edit"; id?: number } | null>(null);
  const [profileModal, setProfileModal] = useState<{ mode: "create" | "edit"; id?: number } | null>(null);
  const [planForm, setPlanForm] = useState({ name: "", monthlyAmount: "", planKind: "MONTHLY" });
  const [profileForm, setProfileForm] = useState({
    centerId: "", studentId: "", feeMode: "FREE", tuitionPlanId: "",
    symbolicAmount: "", startDate: new Date().toISOString().split('T')[0],
    endDate: "", notes: ""
  });
  const [formError, setFormError] = useState("");

  const plansQ = useFinanceV2TuitionPlansQuery(centerId);
  const plans = useMemo(() => plansQ.data?.items ?? [], [plansQ.data]);
  const plansPagination = useClientPagination(plans, { initialPageSize: 10 });

  const profilesQ = useFinanceV2StudentFeeProfilesQuery(centerId);
  const profiles = useMemo(() => profilesQ.data?.items ?? [], [profilesQ.data]);
  const profilesPagination = useClientPagination(profiles, { initialPageSize: 10 });

  const centersQ = useCentersQuery();
  const centers = useMemo(() => centersQ.data?.items ?? [], [centersQ.data?.items]);
  const studentsQ = useUsersQuery({ role: "STUDENT", centerId: centerId, circleId: undefined });
  const students = useMemo(() => studentsQ.data?.items ?? [], [studentsQ.data?.items]);

  const createPlanM = useCreateFinanceV2TuitionPlanMutation();
  const updatePlanM = useUpdateFinanceV2TuitionPlanMutation();
  const createProfileM = useCreateFinanceV2StudentFeeProfileMutation();
  const updateProfileM = useUpdateFinanceV2StudentFeeProfileMutation();

  const openPlanModal = (mode: "create" | "edit", plan?: TuitionPlanV2) => {
    setFormError("");
    if (mode === "create") {
      setPlanForm({ name: "", monthlyAmount: "", planKind: "MONTHLY" });
      setPlanModal({ mode: "create" });
    } else if (plan) {
      setPlanForm({ name: plan.name, monthlyAmount: String(plan.monthlyAmount), planKind: plan.planKind });
      setPlanModal({ mode: "edit", id: plan.id });
    }
  };

  const handleSavePlan = async () => {
    setFormError("");
    try {
      if (!planForm.name.trim()) throw new Error(ar ? "الاسم مطلوب" : "Name is required");
      const amt = Number(planForm.monthlyAmount);
      if (!amt || amt <= 0) throw new Error(ar ? "المبلغ غير صحيح" : "Invalid amount");
      if (!centerId) throw new Error(ar ? "اختر مركزاً أولاً" : "Select a center first");

      if (planModal?.mode === "create") {
        await createPlanM.mutateAsync({ centerId, name: planForm.name, monthlyAmount: amt, planKind: planForm.planKind });
      } else if (planModal?.mode === "edit" && planModal.id) {
        await updatePlanM.mutateAsync({ id: planModal.id, payload: { name: planForm.name, monthlyAmount: amt, planKind: planForm.planKind } });
      }
      notifySuccess(ar ? "تم حفظ الخطة" : "Plan saved");
      setPlanModal(null);
    } catch (err) {
      setFormError(getLocalizedApiErrorMessage(err, { ar, fallback: String(err) }));
    }
  };

  const togglePlanStatus = async (plan: TuitionPlanV2) => {
    try {
      await updatePlanM.mutateAsync({ id: plan.id, payload: { isActive: !plan.isActive } });
    } catch { }
  };

  const openProfileModal = (mode: "create" | "edit", profile?: StudentFeeProfileV2) => {
    setFormError("");
    if (mode === "create") {
      setProfileForm({
        centerId: String(centerId ?? ""), studentId: "", feeMode: "FREE",
        tuitionPlanId: "", symbolicAmount: "",
        startDate: new Date().toISOString().split('T')[0], endDate: "", notes: ""
      });
      setProfileModal({ mode: "create" });
    } else if (profile) {
      setProfileForm({
        centerId: String(profile.centerId), studentId: String(profile.studentId),
        feeMode: profile.feeMode, tuitionPlanId: String(profile.tuitionPlanId ?? ""),
        symbolicAmount: String(profile.symbolicAmount ?? ""),
        startDate: profile.startDate?.split('T')[0] ?? "",
        endDate: profile.endDate?.split('T')[0] ?? "", notes: profile.notes ?? ""
      });
      setProfileModal({ mode: "edit", id: profile.id });
    }
  };

  const handleSaveProfile = async () => {
    setFormError("");
    try {
      const pCenterId = profileForm.centerId ? Number(profileForm.centerId) : centerId;
      if (!pCenterId) throw new Error(ar ? "المركز مطلوب" : "Center is required");
      if (!profileForm.studentId) throw new Error(ar ? "الطالب مطلوب" : "Student is required");
      if (!profileForm.startDate) throw new Error(ar ? "تاريخ البداية مطلوب" : "Start date is required");

      const payload: any = {
        centerId: pCenterId,
        studentId: Number(profileForm.studentId),
        feeMode: profileForm.feeMode,
        startDate: profileForm.startDate,
        ...(profileForm.endDate ? { endDate: profileForm.endDate } : {}),
        ...(profileForm.notes ? { notes: profileForm.notes } : {})
      };

      if (profileForm.feeMode === "PLAN_MONTHLY") {
        if (!profileForm.tuitionPlanId) throw new Error(ar ? "اختر خطة اشتراك" : "Select a plan");
        payload.tuitionPlanId = Number(profileForm.tuitionPlanId);
      }
      if (profileForm.feeMode === "SYMBOLIC_ONE_TIME") {
        const sym = Number(profileForm.symbolicAmount);
        if (!sym || sym <= 0) throw new Error(ar ? "المبلغ الرمزي مطلوب" : "Symbolic amount is required");
        payload.symbolicAmount = sym;
      }

      if (profileModal?.mode === "create") {
        await createProfileM.mutateAsync(payload);
      } else if (profileModal?.mode === "edit" && profileModal.id) {
        await updateProfileM.mutateAsync({ id: profileModal.id, payload });
      }
      notifySuccess(ar ? "تم حفظ الاشتراك" : "Subscription saved");
      setProfileModal(null);
    } catch (err) {
      setFormError(getLocalizedApiErrorMessage(err, { ar, fallback: String(err) }));
    }
  };

  const profileFeeModeLabel = (mode: string) => {
    const labels: Record<string, string> = { FREE: ar ? "مجاني" : "Free", PLAN_MONTHLY: ar ? "اشتراك شهري" : "Monthly", SYMBOLIC_ONE_TIME: ar ? "رمزي" : "Symbolic" };
    return labels[mode] ?? mode;
  };

  return (
    <div className="flex flex-col gap-8 animate-premium mt-4">
      {/* ─── Plans Section ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Receipt className="text-brand-500" size={20} />
            {ar ? "خطط الاشتراكات" : "Subscription Plans"}
          </h3>
          {isAdmin && (
            <Button size="sm" variant="primary" leftIcon={<Plus size={16} />} onClick={() => openPlanModal("create")}>
              {ar ? "إضافة خطة" : "Add Plan"}
            </Button>
          )}
        </div>
        {plansQ.isLoading ? <FinSkeleton rows={3} /> : (
          <FinanceDataTable<TuitionPlanV2>
            rows={plansPagination.pagedRows}
            columns={[
              { header: ar ? "الاسم" : "Name", render: (p) => <span className="font-bold">{p.name}</span> },
              { header: ar ? "المبلغ" : "Amount", render: (p) => <FinanceMoney amount={p.monthlyAmount} baseCurrency="YER" /> },
              { header: ar ? "النوع" : "Type", render: (p) => <span className="text-sm text-text-secondary">{p.planKind === "MONTHLY" ? (ar ? "شهري" : "Monthly") : (ar ? "تسجيل" : "Registration")}</span> },
              { header: ar ? "الحالة" : "Status", render: (p) => <span className={`fin-status-pill ${p.isActive ? 'fin-status--success' : 'fin-status--error'}`}>{p.isActive ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Inactive")}</span> },
              ...(isAdmin ? [{
                header: ar ? "إجراءات" : "Actions",
                render: (p: TuitionPlanV2) => (
                  <div className="flex items-center gap-2">
                    <button className="fin-action-btn view" onClick={() => openPlanModal("edit", p)} title={ar ? "تعديل" : "Edit"}><Pencil size={16} /></button>
                    <button className="fin-action-btn view" onClick={() => togglePlanStatus(p)} title={p.isActive ? (ar ? "تعطيل" : "Deactivate") : (ar ? "تفعيل" : "Activate")}>{p.isActive ? <PowerOff size={16} /> : <Power size={16} />}</button>
                  </div>
                )
              } as any] : [])
            ]}
            rowKey="id"
            className="fin-premium-table"
          />
        )}
        <FinancePaginationFooter ar={ar} pageSize={plansPagination.pageSize} setPageSize={plansPagination.setPageSize} currentPage={plansPagination.currentPage} setPage={plansPagination.setCurrentPage} totalFilteredCount={plansPagination.totalItems} pages={plansPagination.totalPages} />
      </div>

      {/* ─── Plan Modal ─── */}
      <Modal isOpen={Boolean(planModal)} onClose={() => setPlanModal(null)} title={planModal?.mode === "create" ? (ar ? "إضافة خطة" : "Add Plan") : (ar ? "تعديل الخطة" : "Edit Plan")} size="sm" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setPlanModal(null)} disabled={createPlanM.isPending || updatePlanM.isPending}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={handleSavePlan} isLoading={createPlanM.isPending || updatePlanM.isPending}>{ar ? "حفظ" : "Save"}</Button>
        </div>
      }>
        <div className="circlemod-form">
          <div className="circlemod-section">
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--full">
                <label>{ar ? "اسم الخطة" : "Plan Name"}</label>
                <input className="circlemod-input" value={planForm.name} onChange={(e) => setPlanForm(p => ({ ...p, name: e.target.value }))} placeholder={ar ? "مثال: اشتراك شهري" : "Ex: Monthly Subscription"} />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "المبلغ" : "Amount"}</label>
                <input className="circlemod-input" type="number" min={1} value={planForm.monthlyAmount} onChange={(e) => setPlanForm(p => ({ ...p, monthlyAmount: e.target.value }))} />
              </div>
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "النوع" : "Type"}</label>
                <select className="circlemod-select" value={planForm.planKind} onChange={(e) => setPlanForm(p => ({ ...p, planKind: e.target.value }))}>
                  <option value="MONTHLY">{ar ? "شهري" : "Monthly"}</option>
                  <option value="ONE_TIME_REGISTRATION">{ar ? "تسجيل لمرة واحدة" : "One-time Registration"}</option>
                </select>
              </div>
            </div>
          </div>
          {formError ? <div className="circlemod-error" role="alert"><AlertCircle size={14} /><span>{formError}</span></div> : null}
        </div>
      </Modal>

      {/* ─── Student Fee Profiles Section ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <User className="text-brand-500" size={20} />
            {ar ? "اشتراكات الطلاب" : "Student Subscriptions"}
          </h3>
          {isAdmin && (
            <Button size="sm" variant="primary" leftIcon={<Plus size={16} />} onClick={() => openProfileModal("create")}>
              {ar ? "تعيين اشتراك" : "Assign Subscription"}
            </Button>
          )}
        </div>
        {profilesQ.isLoading ? <FinSkeleton rows={3} /> : (
          <FinanceDataTable<StudentFeeProfileV2>
            rows={profilesPagination.pagedRows}
            columns={[
              { header: ar ? "الطالب" : "Student", render: (p) => <span className="font-bold">{p.student?.fullName ?? `#${p.studentId}`}</span> },
              { header: ar ? "الوضع" : "Mode", render: (p) => <span className="text-sm text-text-secondary">{profileFeeModeLabel(p.feeMode)}</span> },
              { header: ar ? "الخطة" : "Plan", render: (p) => <span className="text-sm">{p.tuitionPlan?.name ?? "-"}</span> },
              { header: ar ? "المبلغ" : "Amount", render: (p) => <FinanceMoney amount={p.feeMode === "FREE" ? 0 : (p.symbolicAmount ?? p.tuitionPlan?.monthlyAmount ?? 0)} baseCurrency="YER" /> },
              { header: ar ? "من" : "From", render: (p) => <span className="text-xs text-text-tertiary">{p.startDate?.split('T')[0] ?? "-"}</span> },
              { header: ar ? "الحالة" : "Status", render: (p) => <span className={`fin-status-pill ${p.isActive ? 'fin-status--success' : 'fin-status--error'}`}>{p.isActive ? (ar ? "نشط" : "Active") : (ar ? "منتهي" : "Ended")}</span> },
              ...(isAdmin ? [{
                header: ar ? "إجراءات" : "Actions",
                render: (p: StudentFeeProfileV2) => (
                  <div className="flex items-center gap-2">
                    <button className="fin-action-btn view" onClick={() => openProfileModal("edit", p)} title={ar ? "تعديل" : "Edit"}><Pencil size={16} /></button>
                  </div>
                )
              } as any] : [])
            ]}
            rowKey="id"
            className="fin-premium-table"
          />
        )}
        <FinancePaginationFooter ar={ar} pageSize={profilesPagination.pageSize} setPageSize={profilesPagination.setPageSize} currentPage={profilesPagination.currentPage} setPage={profilesPagination.setCurrentPage} totalFilteredCount={profilesPagination.totalItems} pages={profilesPagination.totalPages} />
      </div>

      {/* ─── Student Fee Profile Modal ─── */}
      <Modal isOpen={Boolean(profileModal)} onClose={() => setProfileModal(null)} title={profileModal?.mode === "create" ? (ar ? "تعيين اشتراك طالب" : "Assign Subscription") : (ar ? "تعديل الاشتراك" : "Edit Subscription")} size="lg" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footerClassName="circlemod-footer-wrap" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setProfileModal(null)} disabled={createProfileM.isPending || updateProfileM.isPending}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={handleSaveProfile} isLoading={createProfileM.isPending || updateProfileM.isPending}>{ar ? "حفظ" : "Save"}</Button>
        </div>
      }>
        <div className="circlemod-form">
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <User size={15} className="circlemod-section-icon" />
              <span>{ar ? "بيانات الطالب" : "Student Data"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "المركز" : "Center"}</label>
                <select className="circlemod-select" value={profileForm.centerId || String(centerId ?? "")} onChange={(e) => setProfileForm(p => ({ ...p, centerId: e.target.value }))}>
                  {(centers || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "الطالب" : "Student"}</label>
                <select className="circlemod-select" value={profileForm.studentId} onChange={(e) => setProfileForm(p => ({ ...p, studentId: e.target.value }))}>
                  <option value="">{ar ? "اختر الطالب..." : "Select student..."}</option>
                  {(students || []).map((s: any) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Receipt size={15} className="circlemod-section-icon" />
              <span>{ar ? "تفاصيل الاشتراك" : "Subscription Details"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "الوضع" : "Mode"}</label>
                <select className="circlemod-select" value={profileForm.feeMode} onChange={(e) => setProfileForm(p => ({ ...p, feeMode: e.target.value }))}>
                  <option value="FREE">{ar ? "مجاني" : "Free"}</option>
                  <option value="PLAN_MONTHLY">{ar ? "اشتراك شهري" : "Monthly Subscription"}</option>
                  <option value="SYMBOLIC_ONE_TIME">{ar ? "مبلغ رمزي لمرة واحدة" : "One-time Symbolic"}</option>
                </select>
              </div>
              {profileForm.feeMode === "PLAN_MONTHLY" ? (
                <div className="circlemod-field circlemod-field--lg">
                  <label>{ar ? "الخطة" : "Plan"}</label>
                  <select className="circlemod-select" value={profileForm.tuitionPlanId} onChange={(e) => setProfileForm(p => ({ ...p, tuitionPlanId: e.target.value }))}>
                    <option value="">{ar ? "اختر الخطة..." : "Select plan..."}</option>
                    {(plans || []).map((plan: TuitionPlanV2) => <option key={plan.id} value={plan.id}>{plan.name} - {plan.monthlyAmount}</option>)}
                  </select>
                </div>
              ) : profileForm.feeMode === "SYMBOLIC_ONE_TIME" ? (
                <div className="circlemod-field circlemod-field--sm">
                  <label>{ar ? "المبلغ الرمزي" : "Symbolic Amount"}</label>
                  <input className="circlemod-input" type="number" min={1} value={profileForm.symbolicAmount} onChange={(e) => setProfileForm(p => ({ ...p, symbolicAmount: e.target.value }))} />
                </div>
              ) : null}
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label><Calendar size={12} className="inline-block ml-1 opacity-60" />{ar ? "تاريخ البدء" : "Start Date"}</label>
                <input className="circlemod-input" type="date" value={profileForm.startDate} onChange={(e) => setProfileForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label><Calendar size={12} className="inline-block ml-1 opacity-60" />{ar ? "تاريخ الانتهاء" : "End Date"}</label>
                <input className="circlemod-input" type="date" value={profileForm.endDate} onChange={(e) => setProfileForm(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--full">
                <label><StickyNote size={12} className="inline-block ml-1 opacity-60" />{ar ? "ملاحظات" : "Notes"}</label>
                <input className="circlemod-input" value={profileForm.notes} onChange={(e) => setProfileForm(p => ({ ...p, notes: e.target.value }))} placeholder={ar ? "ملاحظات اختيارية" : "Optional notes"} />
              </div>
            </div>
          </div>
          {formError ? <div className="circlemod-error" role="alert"><AlertCircle size={14} /><span>{formError}</span></div> : null}
        </div>
      </Modal>
    </div>
  );
}