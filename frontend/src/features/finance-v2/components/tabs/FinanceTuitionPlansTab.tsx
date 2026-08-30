import { useMemo, useState } from "react";
import { Plus, Pencil, Power, PowerOff, Receipt } from "lucide-react";
import {
  useFinanceV2TuitionPlansQuery,
  useCreateFinanceV2TuitionPlanMutation,
  useUpdateFinanceV2TuitionPlanMutation,
} from "../../finance-v2.hooks";
import { FinSkeleton, FinancePaginationFooter } from "../FinanceShared";
import { FinanceMoney } from "../../design";
import { FinanceDataTable } from "../../design/FinanceDataTable";
import Modal from "../../../../components/ui/Modal";
import { Button } from "../../../../components/ui/Button";
import { notifySuccess, notifyError } from "../../../../shared/ui/feedback";
import { getLocalizedApiErrorMessage } from "../../../../shared/api/error";
import useClientPagination from "../../../../shared/ui/useClientPagination";
import { useCentersQuery } from "../../../org/org.hooks";
import type { TuitionPlanV2 } from "../../types";

type Props = {
  centerId: number | undefined;
  isAdmin: boolean;
  ar: boolean;
};

export default function FinanceTuitionPlansTab({ centerId, isAdmin, ar }: Props) {
  const [planModal, setPlanModal] = useState<{ mode: "create" | "edit"; id?: number } | null>(null);
  const [planForm, setPlanForm] = useState({ name: "", monthlyAmount: "", planKind: "MONTHLY", centerId: "" });

  const plansQ = useFinanceV2TuitionPlansQuery(centerId);
  const plans = useMemo(() => plansQ.data?.rows ?? [], [plansQ.data]);
  const plansPagination = useClientPagination(plans, { initialPageSize: 10 });

  const centersQ = useCentersQuery();
  const centers = useMemo(() => centersQ.data?.items ?? [], [centersQ.data?.items]);

  const createPlanM = useCreateFinanceV2TuitionPlanMutation();
  const updatePlanM = useUpdateFinanceV2TuitionPlanMutation();

  const openPlanModal = (mode: "create" | "edit", plan?: TuitionPlanV2) => {
    if (mode === "create") {
      setPlanForm({ name: "", monthlyAmount: "", planKind: "MONTHLY", centerId: String(centerId ?? "") });
      setPlanModal({ mode: "create" });
    } else if (plan) {
      setPlanForm({ name: plan.name, monthlyAmount: String(plan.monthlyAmount), planKind: plan.planKind, centerId: String(plan.centerId) });
      setPlanModal({ mode: "edit", id: plan.id });
    }
  };

  const handleSavePlan = async () => {
    try {
      if (!planForm.name.trim()) { notifyError(ar ? "الاسم مطلوب" : "Name is required"); return; }
      const amt = Number(planForm.monthlyAmount);
      if (!amt || amt <= 0) { notifyError(ar ? "المبلغ غير صحيح" : "Invalid amount"); return; }
      const pCenterId = Number(planForm.centerId);
      if (!pCenterId) { notifyError(ar ? "اختر مركزاً" : "Select a center"); return; }

      if (planModal?.mode === "create") {
        await createPlanM.mutateAsync({ centerId: pCenterId, name: planForm.name, monthlyAmount: amt, planKind: planForm.planKind });
      } else if (planModal?.mode === "edit" && planModal.id) {
        await updatePlanM.mutateAsync({ id: planModal.id, payload: { name: planForm.name, monthlyAmount: amt, planKind: planForm.planKind } });
      }
      notifySuccess(ar ? "تم حفظ الخطة" : "Plan saved");
      setPlanModal(null);
    } catch (err) {
      notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: String(err) }));
    }
  };

  const togglePlanStatus = async (plan: TuitionPlanV2) => {
    try {
      await updatePlanM.mutateAsync({ id: plan.id, payload: { isActive: !plan.isActive } });
    } catch (err) {
      notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: String(err) }));
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-premium mt-4">
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
              { header: ar ? "المركز" : "Center", render: (p) => <span className="text-sm text-text-secondary">{p.center?.name ?? `#${p.centerId}`}</span> },
              { header: ar ? "الاسم" : "Name", render: (p) => <span className="font-bold">{p.name}</span> },
              { header: ar ? "المبلغ" : "Amount", render: (p) => <FinanceMoney amount={p.monthlyAmount} baseCurrency="YER" /> },
              {
                header: ar ? "النوع" : "Kind",
                render: (p: TuitionPlanV2) => (
                  <span className="text-sm">
                    {p.planKind === "MONTHLY" ? (ar ? "شهري" : "Monthly") : 
                     p.planKind === "TERM" ? (ar ? "فصلي" : "Term") :
                     p.planKind === "QUARTERLY" ? (ar ? "ربع سنوي" : "Quarterly") :
                     p.planKind === "SEMESTERLY" || p.planKind === "HALF_YEARLY" ? (ar ? "نصف سنوي" : "Half-Yearly") :
                     p.planKind === "YEARLY" ? (ar ? "سنوي" : "Yearly") :
                     (ar ? "لمرة واحدة" : "One-time")}
                  </span>
                )
              },
              { header: ar ? "الحالة" : "Status", render: (p) => <span className={`fin-status-pill ${p.isActive ? 'fin-status--success' : 'fin-status--error'}`}>{p.isActive ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Inactive")}</span> },
              ...(isAdmin ? [{
                header: ar ? "إجراءات" : "Actions",
                render: (p: TuitionPlanV2) => (
                  <div className="flex items-center gap-2">
                    <button className="fin-action-btn view" onClick={() => openPlanModal("edit", p)} title={ar ? "تعديل" : "Edit"}><Pencil size={16} /></button>
                    <button className="fin-action-btn view" onClick={() => togglePlanStatus(p)} title={p.isActive ? (ar ? "تعطيل" : "Deactivate") : (ar ? "تفعيل" : "Activate")}>{p.isActive ? <PowerOff size={16} /> : <Power size={16} />}</button>
                  </div>
                )
              }] : [])
            ]}
            rowKey="id"
            emptyState={<div className="p-4 text-center text-text-tertiary">{ar ? "لا توجد خطط" : "No plans"}</div>}
          />
        )}
        <FinancePaginationFooter ar={ar} pageSize={plansPagination.pageSize} setPageSize={plansPagination.setPageSize} currentPage={plansPagination.currentPage} setPage={plansPagination.setCurrentPage} totalFilteredCount={plansPagination.totalItems} pages={plansPagination.totalPages} />
      </div>

      {planModal && (
        <Modal
          isOpen
          onClose={() => setPlanModal(null)}
          title={planModal.mode === "create" ? (ar ? "إضافة خطة اشتراك" : "Add Plan") : (ar ? "تعديل خطة" : "Edit Plan")}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "المركز" : "Center"}</label>
              <select className="w-full fin-input" value={planForm.centerId} disabled={planModal?.mode === "edit"} onChange={(e) => setPlanForm({ ...planForm, centerId: e.target.value })}>
                <option value="">{ar ? "اختر المركز..." : "Select center..."}</option>
                {centers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "اسم الخطة" : "Plan Name"}</label>
              <input className="w-full fin-input" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "المبلغ الشهري" : "Monthly Amount"}</label>
              <input type="number" className="w-full fin-input" value={planForm.monthlyAmount} onChange={(e) => setPlanForm({ ...planForm, monthlyAmount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "النوع" : "Type"}</label>
              <select className="w-full fin-input" value={planForm.planKind} onChange={(e) => setPlanForm({ ...planForm, planKind: e.target.value })}>
                <option value="MONTHLY">{ar ? "اشتراك شهري" : "Monthly"}</option>
                <option value="TERM">{ar ? "فصلي (كل ترم)" : "Per Term"}</option>
                <option value="QUARTERLY">{ar ? "ربع سنوي" : "Quarterly"}</option>
                <option value="SEMESTERLY">{ar ? "نصف سنوي (كل فصلين)" : "Semesterly"}</option>
                <option value="HALF_YEARLY">{ar ? "نصف سنوي (سنة ميلادية)" : "Half-Yearly"}</option>
                <option value="YEARLY">{ar ? "سنوي" : "Yearly"}</option>
                <option value="ONE_TIME_REGISTRATION">{ar ? "تسجيل لمرة واحدة" : "One-time Registration"}</option>
              </select>
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t dark:border-gray-800">
              <Button variant="secondary" onClick={() => setPlanModal(null)}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button
                variant="primary"
                isLoading={createPlanM.isPending || updatePlanM.isPending}
                onClick={handleSavePlan}
              >
                {ar ? "حفظ" : "Save"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
