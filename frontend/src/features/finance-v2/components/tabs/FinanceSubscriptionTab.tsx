import { useMemo, useState } from "react";
import { Plus, Pencil, Power, PowerOff, User, Receipt, Calendar, StickyNote, AlertCircle } from "lucide-react";
import { useUsersQuery } from "../../../users/users.hooks";
import { useCentersQuery } from "../../../org/org.hooks";
import {
  useFinanceV2TuitionPlansQuery,
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
  const [profileModal, setProfileModal] = useState<{ mode: "create" | "edit"; id?: number } | null>(null);
  const [profileForm, setProfileForm] = useState({
    centerId: "", studentId: "", feeMode: "FREE", tuitionPlanId: "",
    symbolicAmount: "", startDate: new Date().toISOString().split('T')[0],
    endDate: "", notes: ""
  });

  const plansQ = useFinanceV2TuitionPlansQuery(centerId);
  const plans = useMemo(() => plansQ.data?.rows ?? [], [plansQ.data]);

  const profilesQ = useFinanceV2StudentFeeProfilesQuery(centerId);
  const profiles = useMemo(() => profilesQ.data?.rows ?? [], [profilesQ.data]);
  const profilesPagination = useClientPagination(profiles, { initialPageSize: 10 });

  const centersQ = useCentersQuery();
  const centers = useMemo(() => centersQ.data?.items ?? [], [centersQ.data?.items]);
  const queryCenterId = profileForm.centerId ? Number(profileForm.centerId) : centerId;
  const studentsQ = useUsersQuery({ role: "STUDENT", centerId: queryCenterId, circleId: undefined });
  const students = useMemo(() => studentsQ.data?.items ?? [], [studentsQ.data?.items]);

  const createProfileM = useCreateFinanceV2StudentFeeProfileMutation();
  const updateProfileM = useUpdateFinanceV2StudentFeeProfileMutation();

  const toggleProfileStatus = async (profile: StudentFeeProfileV2) => {
    try {
      await updateProfileM.mutateAsync({ id: profile.id, payload: { isActive: !profile.isActive } });
    } catch (err) {
      notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: String(err) }));
    }
  };

  const openProfileModal = (mode: "create" | "edit", profile?: StudentFeeProfileV2) => {
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
    try {
      const pCenterId = profileForm.centerId ? Number(profileForm.centerId) : centerId;
      if (!pCenterId) { notifyError(ar ? "المركز مطلوب" : "Center is required"); return; }
      if (!profileForm.studentId) { notifyError(ar ? "الطالب مطلوب" : "Student is required"); return; }
      if (!profileForm.startDate) { notifyError(ar ? "تاريخ البداية مطلوب" : "Start date is required"); return; }
      if (profileForm.endDate && profileForm.endDate < profileForm.startDate) { notifyError(ar ? "تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية" : "End date cannot be before start date"); return; }

      const payload: any = {
        centerId: pCenterId,
        studentId: Number(profileForm.studentId),
        feeMode: profileForm.feeMode,
        startDate: profileForm.startDate,
        ...(profileForm.endDate ? { endDate: profileForm.endDate } : {}),
        ...(profileForm.notes ? { notes: profileForm.notes } : {})
      };

      if (profileForm.feeMode === "PLAN_MONTHLY") {
        if (!profileForm.tuitionPlanId) { notifyError(ar ? "اختر خطة اشتراك" : "Select a plan"); return; }
        payload.tuitionPlanId = Number(profileForm.tuitionPlanId);
      }
      if (profileForm.feeMode === "SYMBOLIC_ONE_TIME") {
        const sym = Number(profileForm.symbolicAmount);
        if (!sym || sym <= 0) { notifyError(ar ? "المبلغ الرمزي مطلوب" : "Symbolic amount is required"); return; }
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
      notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: String(err) }));
    }
  };

  const profileFeeModeLabel = (mode: string) => {
    const labels: Record<string, string> = { FREE: ar ? "مجاني" : "Free", PLAN_MONTHLY: ar ? "اشتراك شهري" : "Monthly", SYMBOLIC_ONE_TIME: ar ? "رمزي" : "Symbolic" };
    return labels[mode] ?? mode;
  };

  return (
    <div className="flex flex-col gap-8 animate-premium mt-4">
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
                    <button className="fin-action-btn view" onClick={() => toggleProfileStatus(p)} title={p.isActive ? (ar ? "تعطيل" : "Deactivate") : (ar ? "تفعيل" : "Activate")}>{p.isActive ? <PowerOff size={16} /> : <Power size={16} />}</button>
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
              {profileForm.feeMode === "FREE" && (
                <div className="w-full mt-2 text-sm text-amber-800 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{ar ? "تنبيه: باختيار 'مجاني'، لن تصدر أي فواتير إطلاقاً لهذا الطالب وسيتم إعفاؤه بالكامل. تأكد من أن المركز يسمح بذلك." : "Warning: By selecting 'Free', no invoices will be generated for this student. Make sure the center allows it."}</span>
                </div>
              )}
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
                <p className="text-[10px] text-text-tertiary mt-1">
                  {ar ? "اختياري (إذا تُرك فارغاً يعتبر اشتراكاً مستمراً)" : "Optional (leave empty for continuous)"}
                </p>
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--full">
                <label><StickyNote size={12} className="inline-block ml-1 opacity-60" />{ar ? "ملاحظات" : "Notes"}</label>
                <input className="circlemod-input" value={profileForm.notes} onChange={(e) => setProfileForm(p => ({ ...p, notes: e.target.value }))} placeholder={ar ? "ملاحظات اختيارية" : "Optional notes"} />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
