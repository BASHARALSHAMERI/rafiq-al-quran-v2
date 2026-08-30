import { useEffect, useMemo, useState } from "react";
import { Gift, Printer, Calendar, Eye, CreditCard, Receipt, User, Search, Check, ChevronLeft, ChevronRight, Plus, Trash2, Send, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { getLocalizedApiErrorMessage } from "../../../../shared/api/error";
import {
  entityFeedback,
  notifyError,
  notifyRequiredFields,
  notifySuccess,
  type LocalizedLabel
} from "../../../../shared/ui/feedback";
import {
  useApproveFinanceV2RewardBatchMutation,
  useCreateFinanceV2RewardBatchMutation,
  useDeleteFinanceV2RewardBatchMutation,
  useFailFinanceV2RewardItemMutation,
  useFinanceV2AccountsQuery,
  useFinanceV2RewardBatchesQuery,
  usePayFinanceV2RewardBatchMutation,
  useRejectFinanceV2RewardBatchMutation,
  useSubmitFinanceV2RewardBatchMutation
} from "../../finance-v2.hooks";
import type { PaymentMethodV2, RewardBatchV2, RewardBeneficiaryRoleV2, RewardCycleV2, RewardItemV2, RewardTypeV2 } from "../../types";
import { printRewardsReport } from "../../../accounting/printAccounting";
import { useOrgBrandingQuery } from "../../../org/org.hooks";
import { FinSkeleton, voucherStatusLabels, FinancePaginationFooter } from "../FinanceShared";
import { 
  FinanceMoney,
  FinanceStatusBadge
} from "../../design";
import { FinanceDataTable } from "../../design/FinanceDataTable";
import Modal from "../../../../components/ui/Modal";
import useClientPagination from "../../../../shared/ui/useClientPagination";
import { useStaffUsersByRole } from "../../../staff-attendance/staff-attendance.api";

type Props = {
  centerId: number | undefined;
  year: number;
  month: number;
  cycle: string;
  quarter: number;
  status?: string;
  canPayReward: boolean;
  canReadFinance: boolean;
  isSuperAdmin: boolean;
  canCreateBatch?: boolean;
  canApproveBatch?: boolean;
  ar: boolean;
  centers: { id: number; name: string }[];
  externalShowBatchForm?: boolean;
  onExternalBatchFormClose?: () => void;
};

const REWARD_BATCH_ENTITY: LocalizedLabel = { ar: "دفعة المكافآت", en: "reward batch" };

const REWARD_METHOD_LABELS: Record<PaymentMethodV2, string> = {
  CASH: "Cash",
  TRANSFER: "Transfer"
};

const REWARD_CYCLE_LABELS: Record<RewardCycleV2, { ar: string; en: string }> = {
  MONTHLY: { ar: "شهري", en: "Monthly" },
  QUARTERLY: { ar: "ربع سنوي", en: "Quarterly" },
  ANNUAL: { ar: "سنوي", en: "Annual" }
};

const REWARD_TYPE_LABELS: Record<RewardTypeV2, { ar: string; en: string }> = {
  GENERAL: { ar: "عامة", en: "General" },
  PERFORMANCE: { ar: "أداء", en: "Performance" },
  ATTENDANCE: { ar: "حضور", en: "Attendance" },
  COMPETITION: { ar: "مسابقة", en: "Competition" },
  OTHER: { ar: "أخرى", en: "Other" }
};

const ROLE_LABELS: Record<string, { ar: string; en: string }> = {
  SUPER_ADMIN: { ar: "مدير عام", en: "Super Admin" },
  CENTER_ADMIN: { ar: "مدير مركز", en: "Center Admin" },
  SUPERVISOR: { ar: "مشرف", en: "Supervisor" },
  TEACHER: { ar: "معلم", en: "Teacher" },
  STUDENT: { ar: "طالب", en: "Student" },
  ACCOUNTANT: { ar: "محاسب", en: "Accountant" },
  FINANCE_MANAGER: { ar: "مدير مالي", en: "Finance Manager" },
  TREASURER: { ar: "أمين صندوق", en: "Treasurer" },
  AUDITOR: { ar: "مدقق", en: "Auditor" }
};

const ARABIC_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const ENGLISH_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ARABIC_QUARTERS = ["الربع الأول", "الربع الثاني", "الربع الثالث", "الربع الرابع"];
const ENGLISH_QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

const formatCycle = (batch: RewardBatchV2, ar: boolean): string => {
  const cycleLabel = REWARD_CYCLE_LABELS[batch.cycle as RewardCycleV2];
  const cycleStr = cycleLabel ? (ar ? cycleLabel.ar : cycleLabel.en) : batch.cycle;
  if (batch.cycle === "MONTHLY" && batch.periodMonth) {
    const monthName = ar ? ARABIC_MONTHS[batch.periodMonth - 1] : ENGLISH_MONTHS[batch.periodMonth - 1];
    return `${cycleStr} · ${monthName} ${batch.periodYear}`;
  }
  if (batch.cycle === "QUARTERLY" && batch.periodQuarter) {
    return `${cycleStr} · ${ar ? ARABIC_QUARTERS[batch.periodQuarter - 1] : ENGLISH_QUARTERS[batch.periodQuarter - 1]} ${batch.periodYear}`;
  }
  return `${cycleStr} · ${batch.periodYear}`;
};

const PAYABLE_REWARD_STATUSES = new Set(["APPROVED", "IN_PROGRESS", "PARTIALLY_PAID"]);

const rewardStatusLabel = (status: RewardItemV2["status"], ar: boolean) => {
  if (!ar) return status;
  if (status === "PAID") return "مصروف";
  if (status === "FAILED") return "فشل الصرف";
  if (status === "VOIDED") return "ملغى";
  return "بانتظار الصرف";
};

const rewardSummary = (batch: RewardBatchV2 | null) => {
  const items = batch?.items ?? [];
  return items.reduce(
    (summary, item) => {
      const paid = item.status === "PAID";
      const failed = item.status === "FAILED";
      const pending = item.status === "PENDING";
      summary.total += item.amount;
      summary.paidAmount += paid ? item.amount : 0;
      summary.remainingAmount += pending || failed ? item.amount : 0;
      summary.paidCount += paid ? 1 : 0;
      summary.failedCount += failed ? 1 : 0;
      summary.pendingCount += pending ? 1 : 0;
      return summary;
    },
    { total: 0, paidAmount: 0, remainingAmount: 0, paidCount: 0, failedCount: 0, pendingCount: 0, totalCount: items.length }
  );
};

const ALL_BENEFICIARY_ROLES = "SUPER_ADMIN,CENTER_ADMIN,SUPERVISOR,TEACHER,STUDENT,ACCOUNTANT,FINANCE_MANAGER,TREASURER,AUDITOR";

type WizardBeneficiary = {
  beneficiaryUserId: number;
  beneficiaryRole: RewardBeneficiaryRoleV2;
  centerId: number;
  amount: number;
  notes: string;
  fullName: string;
  roleLabel: string;
};

export default function FinanceRewardsTab({ 
  centerId, 
  year, 
  month,
  cycle,
  quarter,
  status,
  canPayReward,
  canReadFinance,
  isSuperAdmin,
  canCreateBatch = canPayReward,
  canApproveBatch = isSuperAdmin,
  ar, 
  centers,
  externalShowBatchForm, 
  onExternalBatchFormClose 
}: Props) {
  const [selectedBatch, setSelectedBatch] = useState<RewardBatchV2 | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<{
    batch: RewardBatchV2;
    item: RewardItemV2;
    method: PaymentMethodV2;
    reference: string;
    overrideAccountId?: number | null;
  } | null>(null);
  const [failureDraft, setFailureDraft] = useState<{
    batch: RewardBatchV2;
    item: RewardItemV2;
    reason: string;
  } | null>(null);

  const [rejectingBatchId, setRejectingBatchId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState({
    cycle: "MONTHLY" as RewardCycleV2,
    rewardType: "GENERAL" as RewardTypeV2,
    selectedCenterId: centerId ?? 0,
    periodMonth: month,
    periodQuarter: 1
  });
  const [wizardBeneficiaries, setWizardBeneficiaries] = useState<WizardBeneficiary[]>([]);
  const [addBeneficiaryRole, setAddBeneficiaryRole] = useState<string>("STUDENT");
  const [addBeneficiaryId, setAddBeneficiaryId] = useState<number>(0);
  const [addBeneficiaryAmount, setAddBeneficiaryAmount] = useState(0);

  useEffect(() => {
    if (externalShowBatchForm) {
      setWizardOpen(true);
      setWizardStep(1);
    }
  }, [externalShowBatchForm]);

  const queryParams = useMemo(() => ({
    centerId: centerId || undefined,
    cycle: (cycle || undefined) as "MONTHLY" | "QUARTERLY" | "ANNUAL" | undefined,
    periodYear: year,
    periodMonth: cycle === "MONTHLY" ? month : undefined,
    periodQuarter: cycle === "QUARTERLY" ? quarter : undefined,
    status: (status || undefined) as "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "PARTIALLY_PAID" | "PAID" | "CLOSED" | undefined
  }), [centerId, cycle, year, month, quarter, status]);

  const brandingQ = useOrgBrandingQuery();
  const batchesQ = useFinanceV2RewardBatchesQuery(queryParams);
  const batches = useMemo(() => batchesQ.data?.rows ?? [], [batchesQ.data?.rows]);
  const pagination = useClientPagination(batches, { initialPageSize: 10 });

  const allUsersQ = useStaffUsersByRole(ALL_BENEFICIARY_ROLES);
  const allBeneficiaryUsers = useMemo(
    () => (allUsersQ.data ?? []).filter((u) => u.role !== "PARENT").sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [allUsersQ.data]
  );
  const roleFilteredUsers = useMemo(
    () => allBeneficiaryUsers.filter(u => u.role === addBeneficiaryRole),
    [allBeneficiaryUsers, addBeneficiaryRole]
  );
  const isLoadingUsers = allUsersQ.isLoading;

  const createBatchM = useCreateFinanceV2RewardBatchMutation();
  const submitBatchM = useSubmitFinanceV2RewardBatchMutation();
  const approveBatchM = useApproveFinanceV2RewardBatchMutation();
  const rejectBatchM = useRejectFinanceV2RewardBatchMutation();
  const payBatchM = usePayFinanceV2RewardBatchMutation();
  const { data: fundAccounts = [] } = useFinanceV2AccountsQuery();
  const failItemM = useFailFinanceV2RewardItemMutation();
  const deleteBatchM = useDeleteFinanceV2RewardBatchMutation();
  const selectedSummary = useMemo(() => rewardSummary(selectedBatch), [selectedBatch]);

  const closeWizard = () => {
    if (createBatchM.isPending) return;
    setWizardOpen(false);
    setWizardStep(1);
    setWizardBeneficiaries([]);
    onExternalBatchFormClose?.();
  };

  const handleWizardCreate = async () => {
    if (wizardBeneficiaries.length === 0) {
      notifyError(ar ? "يجب إضافة مستفيد واحد على الأقل" : "At least one beneficiary is required");
      return;
    }
    try {
      await createBatchM.mutateAsync({
        centerId: wizardForm.selectedCenterId || undefined,
        periodYear: year,
        cycle: wizardForm.cycle,
        rewardType: wizardForm.rewardType,
        periodMonth: wizardForm.cycle === "MONTHLY" ? wizardForm.periodMonth : undefined,
        periodQuarter: wizardForm.cycle === "QUARTERLY" ? wizardForm.periodQuarter : undefined,
        sourceMode: "MANUAL",
        items: wizardBeneficiaries.map((b) => ({
          beneficiaryUserId: b.beneficiaryUserId,
          beneficiaryRole: b.beneficiaryRole,
          centerId: b.centerId,
          amount: b.amount,
          notes: b.notes || undefined
        }))
      });
      notifySuccess(entityFeedback.success(ar, "create", REWARD_BATCH_ENTITY));
      closeWizard();
    } catch (err) {
      const message = getLocalizedApiErrorMessage(err, {
        ar,
        fallback: ar ? "تعذر إنشاء دفعة المكافآت." : "Unable to create the reward batch."
      });
      notifyError(message);
    }
  };

  const addWizardBeneficiary = () => {
    if (!addBeneficiaryId) {
      notifyError(ar ? "يرجى اختيار مستفيد" : "Please select a beneficiary");
      return;
    }
    if (addBeneficiaryAmount <= 0) {
      notifyError(ar ? "المبلغ يجب أن يكون أكبر من صفر" : "Amount must be greater than zero");
      return;
    }
    if (wizardBeneficiaries.some(b => b.beneficiaryUserId === addBeneficiaryId)) {
      notifyError(ar ? "هذا المستفيد مضاف بالفعل" : "Beneficiary already added");
      return;
    }
    const user = allBeneficiaryUsers.find(u => u.id === addBeneficiaryId);
    if (!user) return;

    setWizardBeneficiaries(prev => [...prev, {
      beneficiaryUserId: user.id,
      beneficiaryRole: user.role as RewardBeneficiaryRoleV2,
      centerId: wizardForm.selectedCenterId || 0,
      amount: addBeneficiaryAmount,
      notes: "",
      fullName: user.fullName,
      roleLabel: ROLE_LABELS[user.role] ? (ar ? ROLE_LABELS[user.role].ar : ROLE_LABELS[user.role].en) : user.role
    }]);
    setAddBeneficiaryId(0);
    setAddBeneficiaryAmount(0);
  };

  const removeWizardBeneficiary = (userId: number) => {
    setWizardBeneficiaries(prev => prev.filter(b => b.beneficiaryUserId !== userId));
  };

  // Existing handlers
  const handleOpenPayment = (batch: RewardBatchV2, item: RewardItemV2) => {
    setPaymentDraft({
      batch,
      item,
      method: item.paymentMethod ?? "CASH",
      reference: item.paymentReference ?? ""
    });
  };

  const handlePayItem = async () => {
    if (!paymentDraft) return;
    try {
      const updated = await payBatchM.mutateAsync({
        batchId: paymentDraft.batch.id,
        accountId: paymentDraft.overrideAccountId ?? undefined,
        payments: [{
          itemId: paymentDraft.item.id,
          method: paymentDraft.method,
          manualReferenceNo: paymentDraft.reference || undefined,
          externalTransferRef: paymentDraft.method === "TRANSFER" ? paymentDraft.reference || undefined : undefined
        }]
      });
      setSelectedBatch(updated);
      setPaymentDraft(null);
      notifySuccess(ar ? "تم صرف المكافأة" : "Reward paid");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر صرف المكافأة." : "Unable to pay the reward."
      }));
    }
  };

  const handleFailItem = async () => {
    if (!failureDraft || !failureDraft.reason.trim()) {
      notifyRequiredFields(ar);
      return;
    }
    try {
      const updated = await failItemM.mutateAsync({
        itemId: failureDraft.item.id,
        failureReason: failureDraft.reason
      });
      setSelectedBatch(updated);
      setFailureDraft(null);
      notifySuccess(ar ? "تم تسجيل فشل الصرف" : "Reward payment failure recorded");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر تسجيل فشل صرف المكافأة." : "Unable to record the reward payment failure."
      }));
    }
  };

  const handleSubmitBatch = async (batchId: number) => {
    try {
      await submitBatchM.mutateAsync({ batchId });
      notifySuccess(ar ? "تم إرسال دفعة المكافآت للاعتماد" : "Reward batch submitted for approval");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر إرسال دفعة المكافآت للاعتماد." : "Unable to submit the reward batch for approval."
      }));
    }
  };

  const handleApproveBatch = async (batchId: number) => {
    try {
      await approveBatchM.mutateAsync({ batchId });
      notifySuccess(ar ? "تم اعتماد دفعة المكافآت" : "Reward batch approved");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر اعتماد دفعة المكافآت." : "Unable to approve the reward batch."
      }));
    }
  };

  const handleDeleteBatch = async (batchId: number) => {
    if (!window.confirm(ar ? "هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this batch? This action cannot be undone.")) return;
    try {
      await deleteBatchM.mutateAsync({ batchId });
      notifySuccess(ar ? "تم حذف الدفعة" : "Batch deleted");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر حذف الدفعة" : "Unable to delete batch"
      }));
    }
  };

  const handleConfirmReject = async () => {
    if (rejectingBatchId === null || !rejectReason.trim()) {
      notifyRequiredFields(ar);
      return;
    }
    try {
      await rejectBatchM.mutateAsync({ batchId: rejectingBatchId, reason: rejectReason.trim() });
      notifySuccess(ar ? "تم رفض دفعة المكافآت" : "Reward batch rejected");
      setRejectingBatchId(null);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر رفض دفعة المكافآت." : "Unable to reject the reward batch."
      }));
    }
  };

  const wizardTotal = useMemo(() => wizardBeneficiaries.reduce((sum, b) => sum + b.amount, 0), [wizardBeneficiaries]);

  return (
    <>
      {/* Wizard: Step 1 - Batch Details + Step 2 - Beneficiaries + Step 3 - Review */}
      <Modal
        isOpen={wizardOpen && canCreateBatch}
        onClose={closeWizard}
        title={ar ? "إنشاء دفعة مكافآت جديدة" : "New Reward Batch"}
        titleIcon={
          <div className="circlemod-head-icon">
            <Gift className="w-4 h-4" />
          </div>
        }
        size={wizardStep === 2 ? "xl" : "lg"}
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            {wizardStep > 1 && (
              <Button variant="secondary" onClick={() => setWizardStep(s => s - 1)} disabled={createBatchM.isPending}
                leftIcon={ar ? undefined : <ChevronLeft className="w-4 h-4" />}
                rightIcon={ar ? <ChevronRight className="w-4 h-4" /> : undefined}
              >
                {ar ? "السابق" : "Back"}
              </Button>
            )}
            <div className="flex-1" />
            {wizardStep < 3 ? (
              <Button variant="primary" onClick={() => setWizardStep(s => s + 1)}
                disabled={wizardStep === 2 && wizardBeneficiaries.length === 0}
                leftIcon={ar ? <ChevronLeft className="w-4 h-4" /> : undefined}
                rightIcon={ar ? undefined : <ChevronRight className="w-4 h-4" />}
              >
                {ar ? "التالي" : "Next"}
              </Button>
            ) : (
              <Button variant="primary" onClick={handleWizardCreate} isLoading={createBatchM.isPending}>
                {ar ? "حفظ الدفعة" : "Save Batch"}
              </Button>
            )}
            {wizardStep === 1 && (
              <Button variant="ghost" onClick={closeWizard} disabled={createBatchM.isPending}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            )}
          </div>
        }
      >
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 px-1" dir={ar ? "rtl" : "ltr"}>
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                wizardStep >= step ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
              }`}>
                {wizardStep > step ? <Check className="w-4 h-4" /> : step}
              </div>
              <span className={`text-xs font-medium ${wizardStep >= step ? "text-brand-700" : "text-slate-400"}`}>
                {step === 1 ? (ar ? "بيانات الدفعة" : "Batch Details") : step === 2 ? (ar ? "المستفيدون" : "Beneficiaries") : (ar ? "مراجعة" : "Review")}
              </span>
              {step < 3 && <div className="w-8 h-px bg-slate-200 mx-1" />}
            </div>
          ))}
        </div>

        {wizardStep === 1 && (
          <div className="circlemod-form">
            <div className="circlemod-section">
              <div className="circlemod-section-head">
                <Calendar size={15} className="circlemod-section-icon" />
                <span>{ar ? "الفترة الزمنية" : "Period"}</span>
              </div>
              <div className="circlemod-row">
                <div className="circlemod-field circlemod-field--sm">
                  <label>{ar ? "السنة" : "Year"}</label>
                  <div className="circlemod-input flex items-center font-bold" style={{ cursor: 'default' }}>
                    {year}
                  </div>
                </div>
                <div className="circlemod-field circlemod-field--lg">
                  <label htmlFor="wz-cycle">{ar ? "دورة المكافأة" : "Reward Cycle"}</label>
                  <select
                    id="wz-cycle"
                    className="circlemod-select"
                    value={wizardForm.cycle}
                    onChange={(e) => setWizardForm(prev => ({ ...prev, cycle: e.target.value as RewardCycleV2 }))}
                  >
                    <option value="MONTHLY">{ar ? "شهري" : "Monthly"}</option>
                    <option value="QUARTERLY">{ar ? "ربع سنوي" : "Quarterly"}</option>
                    <option value="ANNUAL">{ar ? "سنوي" : "Annual"}</option>
                  </select>
                </div>
                <div className="circlemod-field circlemod-field--lg">
                  <label htmlFor="wz-type">{ar ? "نوع المكافأة" : "Reward Type"}</label>
                  <select
                    id="wz-type"
                    className="circlemod-select"
                    value={wizardForm.rewardType}
                    onChange={(e) => setWizardForm(prev => ({ ...prev, rewardType: e.target.value as RewardTypeV2 }))}
                  >
                    {(Object.keys(REWARD_TYPE_LABELS) as RewardTypeV2[]).map((type) => (
                      <option key={type} value={type}>{ar ? REWARD_TYPE_LABELS[type].ar : REWARD_TYPE_LABELS[type].en}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="circlemod-row">
                {wizardForm.cycle === "MONTHLY" ? (
                  <div className="circlemod-field circlemod-field--lg">
                    <label htmlFor="wz-month">{ar ? "الشهر" : "Month"}</label>
                    <select
                      id="wz-month"
                      className="circlemod-select"
                      value={wizardForm.periodMonth}
                      onChange={(e) => setWizardForm(prev => ({ ...prev, periodMonth: parseInt(e.target.value) }))}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{ar ? ARABIC_MONTHS[i] : ENGLISH_MONTHS[i]}</option>
                      ))}
                    </select>
                  </div>
                ) : wizardForm.cycle === "QUARTERLY" ? (
                  <div className="circlemod-field circlemod-field--lg">
                    <label htmlFor="wz-quarter">{ar ? "الربع" : "Quarter"}</label>
                    <select
                      id="wz-quarter"
                      className="circlemod-select"
                      value={wizardForm.periodQuarter}
                      onChange={(e) => setWizardForm(prev => ({ ...prev, periodQuarter: parseInt(e.target.value) }))}
                    >
                      <option value={1}>{ar ? "الربع الأول" : "Q1"}</option>
                      <option value={2}>{ar ? "الربع الثاني" : "Q2"}</option>
                      <option value={3}>{ar ? "الربع الثالث" : "Q3"}</option>
                      <option value={4}>{ar ? "الربع الرابع" : "Q4"}</option>
                    </select>
                  </div>
                ) : (
                  <div className="circlemod-field circlemod-field--lg">
                    <label>{ar ? "النطاق" : "Scope"}</label>
                    <div className="circlemod-input flex items-center font-bold" style={{ cursor: "default" }}>
                      {ar ? "كامل السنة" : "Full year"}
                    </div>
                  </div>
                )}
                <div className="circlemod-field circlemod-field--lg">
                  <label htmlFor="wz-center">{ar ? "المركز" : "Center"}</label>
                  <select
                    id="wz-center"
                    className="circlemod-select"
                    value={wizardForm.selectedCenterId}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWizardForm(prev => ({ ...prev, selectedCenterId: val }));
                    }}
                  >
                    <option value={0}>{ar ? "الكل" : "All"}</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="circlemod-form">
            {/* Add beneficiary form */}
            <div className="circlemod-section">
              <div className="circlemod-section-head">
                <User size={15} className="circlemod-section-icon" />
                <span>{ar ? "إضافة مستفيد جديد" : "New Beneficiary"}</span>
              </div>
              <div className="circlemod-row">
                <div className="circlemod-field circlemod-field--lg">
                  <label>{ar ? "الدور" : "Role"}</label>
                  <select
                    className="circlemod-select"
                    value={addBeneficiaryRole}
                    onChange={(e) => { setAddBeneficiaryRole(e.target.value); setAddBeneficiaryId(0); }}
                  >
                    {(Object.keys(ROLE_LABELS) as Array<keyof typeof ROLE_LABELS>).map((role) => (
                      <option key={role} value={role}>{ar ? ROLE_LABELS[role].ar : ROLE_LABELS[role].en}</option>
                    ))}
                  </select>
                </div>
                <div className="circlemod-field circlemod-field--lg">
                  <label>{ar ? "المبلغ" : "Amount"}</label>
                  <input
                    className="circlemod-input"
                    type="number" min={1} step="0.01"
                    value={addBeneficiaryAmount || ""}
                    onChange={(e) => setAddBeneficiaryAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="circlemod-field">
                <label>{ar ? "المستفيد" : "Beneficiary"}</label>
                <div className="relative">
                  <select
                    className="circlemod-select"
                    style={{ paddingInlineEnd: '2.5rem' }}
                    value={addBeneficiaryId || ""}
                    onChange={(e) => setAddBeneficiaryId(parseInt(e.target.value) || 0)}
                    disabled={isLoadingUsers}
                  >
                    {isLoadingUsers ? (
                      <option value="">{ar ? "-- جاري التحميل --" : "-- Loading --"}</option>
                    ) : (
                      <>
                        <option value="">{ar ? "-- اختر المستفيد --" : "-- Select --"}</option>
                        {roleFilteredUsers.map((u) => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                      </>
                    )}
                  </select>
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                </div>
              </div>
              <Button size="sm" variant="primary" onClick={addWizardBeneficiary}
                className="w-full"
                leftIcon={<Plus className="w-4 h-4" />}
                disabled={!addBeneficiaryId || addBeneficiaryAmount <= 0}
              >
                {ar ? "إضافة إلى القائمة" : "Add to List"}
              </Button>
            </div>

            {/* Added beneficiaries list */}
            <div className="circlemod-section">
              <div className="circlemod-section-head">
                <User size={15} className="circlemod-section-icon" />
                <span>{ar ? "قائمة المستفيدين" : "Beneficiary List"}</span>
                <span className="circlemod-section-hint">{wizardBeneficiaries.length}</span>
              </div>
              {wizardBeneficiaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-[#94a3b8]">
                  <User size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">{ar ? "لم تتم إضافة أي مستفيد بعد" : "No beneficiaries added yet"}</p>
                </div>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto space-y-2 -mx-1 px-1">
                    {wizardBeneficiaries.map((b) => (
                      <div key={b.beneficiaryUserId}
                        className="flex items-center justify-between p-3 rounded-[10px] border border-[#eef2f6] bg-white hover:border-[#dce2ea] hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-[10px] bg-[#f8fafc] flex items-center justify-center shrink-0 border border-[#eef2f6]">
                            <User size={16} className="text-[#64748b]" />
                          </div>
                          <div className="min-w-0 flex flex-col gap-[2px]">
                            <span className="text-sm font-bold text-[#1e293b] truncate">{b.fullName}</span>
                            <span className="text-[0.68rem] font-medium text-[#94a3b8]">{b.roleLabel}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-black text-[#0f766e]">{b.amount.toLocaleString()} YER</span>
                          <button onClick={() => removeWizardBeneficiary(b.beneficiaryUserId)}
                            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#94a3b8] hover:text-[#e11d48] hover:bg-[#fff1f2] border border-transparent hover:border-[#fecdd3] transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-[#f1f5f9]">
                    <span className="text-xs font-bold text-[#64748b]">
                      {ar ? "الإجمالي" : "Total"}: <span className="text-[#1e293b]">{wizardBeneficiaries.length}</span>
                    </span>
                    <span className="text-base font-black text-[#0f766e]">{wizardTotal.toLocaleString()} YER</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {wizardStep === 3 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="circlemod-form">
              <div className="circlemod-section">
                <div className="circlemod-section-head">
                  <Calendar size={15} className="circlemod-section-icon" />
                  <span>{ar ? "تفاصيل الدفعة" : "Batch Details"}</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="block text-[0.65rem] font-bold text-slate-500">{ar ? "الدورة" : "Cycle"}</span>
                    <span className="text-sm font-black">{ar ? REWARD_CYCLE_LABELS[wizardForm.cycle].ar : REWARD_CYCLE_LABELS[wizardForm.cycle].en}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="block text-[0.65rem] font-bold text-slate-500">{ar ? "النوع" : "Type"}</span>
                    <span className="text-sm font-black">{ar ? REWARD_TYPE_LABELS[wizardForm.rewardType].ar : REWARD_TYPE_LABELS[wizardForm.rewardType].en}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="block text-[0.65rem] font-bold text-slate-500">{ar ? "السنة" : "Year"}</span>
                    <span className="text-sm font-black">{year}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="block text-[0.65rem] font-bold text-slate-500">{ar ? "الفترة" : "Period"}</span>
                    <span className="text-sm font-black">
                      {wizardForm.cycle === "MONTHLY" ? (ar ? ARABIC_MONTHS[wizardForm.periodMonth - 1] : ENGLISH_MONTHS[wizardForm.periodMonth - 1])
                        : wizardForm.cycle === "QUARTERLY" ? (ar ? ARABIC_QUARTERS[wizardForm.periodQuarter - 1] : ENGLISH_QUARTERS[wizardForm.periodQuarter - 1])
                        : (ar ? "كامل السنة" : "Full Year")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="circlemod-form">
              <div className="circlemod-section">
                <div className="circlemod-section-head">
                  <User size={15} className="circlemod-section-icon" />
                  <span>{ar ? "المستفيدون" : "Beneficiaries"}</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {wizardBeneficiaries.map((b) => (
                    <div key={b.beneficiaryUserId} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-bold text-sm">{b.fullName}</span>
                        <span className="text-[0.6rem] text-slate-500 mr-2">{b.roleLabel}</span>
                      </div>
                      <FinanceMoney amount={b.amount} baseCurrency="YER" className="!text-sm !font-black" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t">
                  <span className="text-sm font-bold">{ar ? "الإجمالي" : "Total"}: {wizardBeneficiaries.length} {ar ? "مستفيد" : "beneficiaries"}</span>
                  <FinanceMoney amount={wizardTotal} baseCurrency="YER" className="!text-lg !font-black" />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectingBatchId !== null}
        onClose={() => setRejectingBatchId(null)}
        title={ar ? "رفض دفعة المكافآت" : "Reject Reward Batch"}
        size="md"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={() => { setRejectingBatchId(null); }} disabled={rejectBatchM.isPending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="danger" onClick={handleConfirmReject} isLoading={rejectBatchM.isPending} disabled={!rejectReason.trim()}>
              {ar ? "تأكيد الرفض" : "Confirm Reject"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            {ar ? "يرجى كتابة سبب الرفض:" : "Please enter the rejection reason:"}
          </p>
          <textarea
            className="circlemod-input min-h-[100px]"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={ar ? "سبب الرفض..." : "Rejection reason..."}
            dir={ar ? "rtl" : "ltr"}
          />
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title={ar ? "تفاصيل دفعة المكافآت" : "Reward Batch Details"}
        description={selectedBatch ? formatCycle(selectedBatch, ar) : undefined}
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => setSelectedBatch(null)}>
            {ar ? "إغلاق" : "Close"}
          </Button>
        }
      >
        <div className="circlemod-form">
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-100 bg-white p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-text-tertiary">{ar ? "إجمالي المكافآت" : "Total rewards"}</span>
              <FinanceMoney amount={selectedSummary.total} baseCurrency="YER" className="text-sm font-black text-text-primary" />
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-emerald-700">{ar ? "المصروف" : "Paid"}</span>
              <FinanceMoney amount={selectedSummary.paidAmount} baseCurrency="YER" className="text-sm font-black text-emerald-700" />
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-amber-700">{ar ? "المتبقي" : "Remaining"}</span>
              <FinanceMoney amount={selectedSummary.remainingAmount} baseCurrency="YER" className="text-sm font-black text-amber-700" />
            </div>
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-rose-700">{ar ? "فشل الصرف" : "Failed"}</span>
              <strong className="text-lg text-rose-700">{selectedSummary.failedCount}</strong>
            </div>
          </div>

          <FinanceDataTable<any>
            rows={selectedBatch?.items ?? []}
            columns={[
              {
                header: ar ? "المستفيد" : "Beneficiary",
                render: (item) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <User size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-text-primary">{item.beneficiary?.fullName}</span>
                      <span className="text-[0.65rem] text-text-tertiary font-medium">
                        {ROLE_LABELS[item.beneficiaryRole as string] ? (ar ? ROLE_LABELS[item.beneficiaryRole as string].ar : ROLE_LABELS[item.beneficiaryRole as string].en) : item.beneficiaryRole}
                      </span>
                    </div>
                  </div>
                )
              },
              {
                header: ar ? "المبلغ" : "Amount",
                render: (item) => <FinanceMoney amount={item.amount} baseCurrency="YER" className="text-sm font-black text-brand-600" />
              },
              {
                header: ar ? "الحالة" : "Status",
                render: (item) => (
                  <div className="flex flex-col gap-1">
                    <FinanceStatusBadge status={item.status} label={rewardStatusLabel(item.status, ar)} />
                    {item.failureReason ? (
                      <span className="max-w-[140px] truncate text-[0.65rem] font-semibold text-rose-500" title={item.failureReason}>
                        {item.failureReason}
                      </span>
                    ) : null}
                  </div>
                )
              },
              {
                header: ar ? "طريقة الصرف" : "Payment method",
                render: (item) => <span className="text-xs font-bold text-text-secondary">{item.paymentMethod ? REWARD_METHOD_LABELS[item.paymentMethod as PaymentMethodV2] : "-"}</span>
              },
              {
                header: ar ? "السند" : "Voucher",
                render: (item) => item.voucherId ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600">
                    <Receipt size={13} />
                    {item.voucher?.voucherNo ?? `#${item.voucherId}`}
                  </span>
                ) : <span className="text-xs font-semibold text-text-tertiary">-</span>
              },
              {
                header: "الإجراء",
                render: (item) => (
                  <div className="flex items-center gap-2">
                    {canPayReward && selectedBatch && PAYABLE_REWARD_STATUSES.has(selectedBatch.status) && item.status !== "PAID" && item.status !== "VOIDED" ? (
                      <>
                        <button className="fin-action-btn submit" title="صرف" onClick={() => handleOpenPayment(selectedBatch, item)}>
                          <CreditCard size={18} />
                        </button>
                        {item.status === "PENDING" && (
                          <button className="fin-action-btn delete" title="تسجيل فشل" onClick={() => setFailureDraft({ batch: selectedBatch, item, reason: "" })}>
                            <XCircle size={18} />
                          </button>
                        )}
                      </>
                    ) : null}
                  </div>
                )
              }
            ]}
            rowKey="id"
            className="fin-premium-table--compact"
          />
        </div>
      </Modal>

      {/* Pay Modal */}
      <Modal
        isOpen={Boolean(paymentDraft && canPayReward)}
        onClose={() => setPaymentDraft(null)}
        title={ar ? "صرف مكافأة" : "Pay Reward"}
        description={paymentDraft?.item.beneficiary?.fullName}
        size="md"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="ghost" onClick={() => setPaymentDraft(null)} disabled={payBatchM.isPending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="primary" onClick={handlePayItem} isLoading={payBatchM.isPending} leftIcon={<CreditCard className="w-4 h-4" />}>
              {ar ? "صرف" : "Pay"}
            </Button>
          </div>
        }
      >
        {paymentDraft ? (
          <div className="circlemod-form">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
              <span className="text-sm font-bold text-emerald-800 block mb-1">{ar ? "مبلغ المكافأة" : "Reward Amount"}</span>
              <FinanceMoney amount={paymentDraft.item.amount} baseCurrency="YER" className="text-2xl font-black text-emerald-600" />
            </div>

            {/* Fund selector */}
            <div className="circlemod-section" style={{ padding: '0.85rem 1rem' }}>
              <div className="circlemod-section-head" style={{ paddingBottom: '0.5rem', marginBottom: 0, borderBottom: '1.5px solid #f1f5f9' }}>
                <CreditCard size={14} className="circlemod-section-icon" />
                <span>{ar ? "مصدر الصرف" : "Payment Source"}</span>
              </div>
              <div className="pt-3 circlemod-field">
                <label>{ar ? "الصندوق" : "Fund"}</label>
                <select
                  className="circlemod-select"
                  value={paymentDraft.overrideAccountId ?? ""}
                  onChange={(e) => setPaymentDraft((current) => current ? { ...current, overrideAccountId: e.target.value ? parseInt(e.target.value) : null } : current)}
                >
                  <option value="">{ar ? "-- تلقائي --" : "-- Auto --"}</option>
                  {fundAccounts
                    .filter((a) => a.accountType === "ORG_FUND" || a.accountType === "CENTER_FUND")
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || (a.accountType === "ORG_FUND" ? (ar ? "الصندوق الرئيسي" : "Main Fund") : a.center?.name || (ar ? `صندوق مركز ${a.centerId}` : `Center ${a.centerId} Fund`))} — {a.currentBalance.toLocaleString()} YER
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Payment method */}
            <div className="circlemod-section" style={{ padding: '0.85rem 1rem' }}>
              <div className="circlemod-section-head" style={{ paddingBottom: '0.5rem', marginBottom: 0, borderBottom: '1.5px solid #f1f5f9' }}>
                <CreditCard size={14} className="circlemod-section-icon" />
                <span>{ar ? "طريقة الصرف" : "Payment Method"}</span>
              </div>
              <div className="pt-3 circlemod-field">
                <label>{ar ? "الطريقة" : "Method"}</label>
                <select
                  className="circlemod-select"
                  value={paymentDraft.method}
                  onChange={(event) => setPaymentDraft((current) => current ? { ...current, method: event.target.value as PaymentMethodV2, reference: event.target.value === "CASH" ? "" : current.reference } : current)}
                >
                  <option value="CASH">{ar ? "نقداً" : "Cash"}</option>
                  <option value="TRANSFER">{ar ? "تحويل بنكي" : "Bank Transfer"}</option>
                </select>
              </div>
            </div>

            {paymentDraft.method === "TRANSFER" && (
              <div className="circlemod-section" style={{ padding: '0.85rem 1rem' }}>
                <div className="circlemod-field">
                  <label>{ar ? "رقم الحوالة" : "Transfer Reference"}</label>
                  <input
                    className="circlemod-input"
                    value={paymentDraft.reference}
                    onChange={(event) => setPaymentDraft((current) => current ? { ...current, reference: event.target.value } : current)}
                    placeholder={ar ? "رقم إثبات التحويل" : "Transfer reference number"}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Fail Modal */}
      <Modal
        isOpen={Boolean(failureDraft && canPayReward)}
        onClose={() => setFailureDraft(null)}
        title={ar ? "تسجيل فشل صرف" : "Record Payment Failure"}
        description={failureDraft?.item.beneficiary?.fullName}
        size="sm"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="ghost" onClick={() => setFailureDraft(null)} disabled={failItemM.isPending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="danger" onClick={handleFailItem} isLoading={failItemM.isPending} disabled={!failureDraft?.reason.trim()}>
              {ar ? "تسجيل فشل" : "Record Failure"}
            </Button>
          </div>
        }
      >
        {failureDraft ? (
          <div className="circlemod-form">
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 flex gap-2 items-start text-sm text-rose-800">
              <span>{ar ? "لن يتم إنشاء أي سند محاسبي وتبقى المكافأة معلقة حتى يتم صرفها بنجاح." : "No accounting voucher will be created. The reward remains pending until successfully paid."}</span>
            </div>
            <div className="circlemod-field">
              <label>{ar ? "سبب فشل الصرف" : "Failure Reason"}</label>
              <textarea
                className="circlemod-input min-h-[80px]"
                value={failureDraft.reason}
                onChange={(event) => setFailureDraft((current) => current ? { ...current, reason: event.target.value } : current)}
                placeholder={ar ? "مثال: رقم الحساب البنكي غير صحيح" : "e.g. Bank account number is incorrect"}
                required
              />
            </div>
          </div>
        ) : null}
      </Modal>

      {batchesQ.isLoading ? <FinSkeleton rows={5} /> : null}

      {!batchesQ.isLoading && batches.length === 0 ? (
        <EmptyState 
          title={ar ? "لا توجد مكافآت" : "No rewards"} 
          description={ar ? "أنشئ دفعة مكافآت جديدة للبدء." : "Create a new reward batch to start."} 
          icon={<Gift className="w-10 h-10" />} 
        />
      ) : null}

      {!batchesQ.isLoading && batches.length > 0 ? (
        <div className="animate-premium mt-4">
          <FinanceDataTable<any>
            rows={pagination.pagedRows}
            columns={[
              {
                header: ar ? "رقم الدفعة" : "Batch ID",
                render: (b) => <span className="font-bold text-brand-600">#{b.id}</span>
              },
              {
                header: ar ? "الدورة" : "Cycle",
                render: (b) => <span className="text-sm font-bold text-text-secondary">{formatCycle(b, ar)}</span>
              },
              {
                header: ar ? "النوع" : "Type",
                render: (b) => (
                  <span className="text-sm font-bold text-text-secondary">
                    {b.rewardType ? (ar ? REWARD_TYPE_LABELS[b.rewardType as RewardTypeV2].ar : REWARD_TYPE_LABELS[b.rewardType as RewardTypeV2].en) : "-"}
                  </span>
                )
              },
              {
                header: ar ? "عدد المستفيدين" : "Beneficiaries",
                render: (b) => (
                  <span className={`text-sm font-medium ${b.totalItems === 0 ? "text-amber-500" : "text-text-secondary"}`}>
                    {b.totalItems}
                  </span>
                )
              },
              {
                header: ar ? "إجمالي المبلغ" : "Total Amount",
                render: (b) => (
                  <FinanceMoney amount={b.totalAmount} baseCurrency="YER" className="!text-lg !font-extrabold" />
                )
              },
              {
                header: ar ? "الحالة" : "Status",
                render: (b) => {
                  if (b.status === "DRAFT" && b.totalItems === 0) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.65rem] font-bold bg-amber-100 text-amber-700">
                        {ar ? "مسودة غير مكتملة" : "Incomplete Draft"}
                      </span>
                    );
                  }
                  return <FinanceStatusBadge status={b.status} label={voucherStatusLabels[b.status as string] || b.status} />;
                }
              },
              {
                header: ar ? "الإجراءات" : "Actions",
                render: (b) => {
                  const isDraft = b.status === "DRAFT";
                  const isSubmitted = b.status === "SUBMITTED";
                  const isApproved = b.status === "APPROVED";
                  const isInProgress = b.status === "IN_PROGRESS" || b.status === "PARTIALLY_PAID";
                  const isRejected = b.status === "REJECTED";
                  const isPaid = b.status === "PAID" || b.status === "CLOSED";
                  const isEmptyDraft = isDraft && b.totalItems === 0;

                  return (
                    <div className="flex items-center gap-2">
                      {/* DRAFT with items */}
                      {isDraft && !isEmptyDraft && canCreateBatch && b.totalAmount > 0 && (
                        <>
                          <button className="fin-action-btn submit" title={ar ? "إرسال للاعتماد" : "Submit"}
                            onClick={() => void handleSubmitBatch(b.id)} disabled={submitBatchM.isPending}
                          >
                            <Send size={18} />
                          </button>
                          <button className="fin-action-btn view" onClick={() => setSelectedBatch(b)} title={ar ? "عرض" : "View"}>
                            <Eye size={18} />
                          </button>
                          <button className="fin-action-btn delete" title={ar ? "حذف" : "Delete"} onClick={() => void handleDeleteBatch(b.id)}>
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}

                      {/* Empty DRAFT */}
                      {isEmptyDraft && canCreateBatch && (
                        <>
                          <button className="fin-action-btn submit" title={ar ? "إضافة مستفيدين" : "Add Beneficiaries"}
                            onClick={() => setSelectedBatch(b)}
                          >
                            <Plus size={18} />
                          </button>
                          <button className="fin-action-btn delete" title={ar ? "حذف" : "Delete"} onClick={() => void handleDeleteBatch(b.id)}>
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}

                      {/* SUBMITTED */}
                      {isSubmitted && (
                        <>
                          {canApproveBatch && (
                            <>
                              <button className="fin-action-btn approve" title={ar ? "اعتماد" : "Approve"} onClick={() => void handleApproveBatch(b.id)}>
                                <CheckCircle size={18} />
                              </button>
                              <button className="fin-action-btn delete" title={ar ? "رفض" : "Reject"} onClick={() => { setRejectingBatchId(b.id); }}>
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          <button className="fin-action-btn view" onClick={() => setSelectedBatch(b)} title={ar ? "عرض" : "View"}>
                            <Eye size={18} />
                          </button>
                        </>
                      )}

                      {/* APPROVED */}
                      {isApproved && (
                        <>
                          {canPayReward && (
                            <button className="fin-action-btn submit" title={ar ? "صرف" : "Pay"} onClick={() => setSelectedBatch(b)}>
                              <CreditCard size={18} />
                            </button>
                          )}
                          <button className="fin-action-btn view" onClick={() => setSelectedBatch(b)} title={ar ? "عرض" : "View"}>
                            <Eye size={18} />
                          </button>
                        </>
                      )}

                      {/* IN_PROGRESS / PARTIALLY_PAID */}
                      {isInProgress && (
                        <>
                          {canPayReward && (
                            <button className="fin-action-btn submit" title={ar ? "متابعة الصرف" : "Continue"} onClick={() => setSelectedBatch(b)}>
                              <CreditCard size={18} />
                            </button>
                          )}
                          <button className="fin-action-btn view" onClick={() => setSelectedBatch(b)} title={ar ? "عرض" : "View"}>
                            <Eye size={18} />
                          </button>
                        </>
                      )}

                      {/* REJECTED */}
                      {isRejected && (
                        <>
                          <button className="fin-action-btn view" onClick={() => setSelectedBatch(b)} title={ar ? "عرض" : "View"}>
                            <Eye size={18} />
                          </button>
                          <button className="fin-action-btn delete" title={ar ? "حذف" : "Delete"} onClick={() => void handleDeleteBatch(b.id)}>
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}

                      {/* PAID / CLOSED */}
                      {isPaid && (
                        <>
                          <button className="fin-action-btn view" onClick={() => setSelectedBatch(b)} title={ar ? "عرض" : "View"}>
                            <Eye size={18} />
                          </button>
                          {canReadFinance && (
                            <button className="fin-action-btn print" onClick={() => printRewardsReport([b], ar, brandingQ.data?.logoUrl || undefined, brandingQ.data?.name || undefined)} title={ar ? "طباعة" : "Print"}>
                              <Printer size={18} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                }
              }
            ]}
            rowKey="id"
            className="fin-premium-table"
          />
          <FinancePaginationFooter
            ar={ar}
            pageSize={pagination.pageSize}
            setPageSize={pagination.setPageSize}
            currentPage={pagination.currentPage}
            setPage={pagination.setCurrentPage}
            totalFilteredCount={pagination.totalItems}
            pages={pagination.totalPages}
          />
        </div>
      ) : null}
    </>
  );
}
