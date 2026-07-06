import { useEffect, useState } from "react";
import { Edit3, Info, Save, Settings } from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Input } from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { notifyError, notifySuccess } from "../../../shared/ui/feedback";
import type { DeductionCalcType, DeductionRule, DeductionTrigger } from "../staff-attendance.api";
import { useDeductionRules, useUpsertRule } from "../staff-attendance.api";

const ALL_TRIGGERS: DeductionTrigger[] = [
  "UNEXCUSED_ABSENCE",
  "LATE_THRESHOLD",
  "EARLY_DEPARTURE",
  "UNPAID_LEAVE",
  "MISSED_VISIT"
];

const CALC_TYPES: DeductionCalcType[] = ["FIXED", "PER_DAY", "PER_OCCURRENCE"];

const getTriggerLabel = (trigger: DeductionTrigger, ar: boolean) => {
  switch (trigger) {
    case "UNEXCUSED_ABSENCE":
      return ar ? "غياب غير مبرر" : "Unexcused Absence";
    case "LATE_THRESHOLD":
      return ar ? "تجاوز حد التأخير" : "Late Threshold";
    case "EARLY_DEPARTURE":
      return ar ? "انصراف مبكر" : "Early Departure";
    case "UNPAID_LEAVE":
      return ar ? "غياب بعذر غير مدفوع" : "Unpaid Leave";
    case "MISSED_VISIT":
      return ar ? "زيارة فائتة" : "Missed Visit";
    default:
      return trigger;
  }
};

const getCalcTypeLabel = (type: DeductionCalcType, ar: boolean) => {
  switch (type) {
    case "FIXED":
      return ar ? "مبلغ ثابت" : "Fixed Amount";
    case "PER_DAY":
      return ar ? "لكل يوم" : "Per Day";
    case "PER_OCCURRENCE":
      return ar ? "لكل تكرار" : "Per Occurrence";
    default:
      return type;
  }
};

// ---------- Tooltip + FieldLabel (same pattern as AttendancePolicySettings) ----------
function DeductionTooltip({ text }: { text: string }) {
  return (
    <span className="staff-ops-policy-tooltip">
      <button type="button" className="staff-ops-policy-tooltip__trigger" aria-label={text}>
        <Info className="w-3.5 h-3.5" />
      </button>
      <span className="staff-ops-policy-tooltip__bubble" role="tooltip">{text}</span>
    </span>
  );
}

function DeductionFieldLabel({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="staff-ops-policy-field__label">
      <span>
        {label}
        <DeductionTooltip text={hint} />
      </span>
    </div>
  );
}
// -------------------------------------------------------------------------------------

type RuleEditorState = {
  thresholdCount: string;
  amount: string;
  deductionType: DeductionCalcType;
  isActive: boolean;
  description: string;
};

const toEditorState = (rule?: DeductionRule): RuleEditorState => ({
  thresholdCount: rule?.thresholdCount != null ? String(rule.thresholdCount) : "",
  amount: rule ? String(rule.amount) : "",
  deductionType: rule?.deductionType ?? "FIXED",
  isActive: rule?.isActive ?? true,
  description: rule?.description ?? ""
});

export function DeductionRulesConfig({ openNewSignal = 0 }: { openNewSignal?: number }) {
  const { language } = useI18n();
  const ar = language === "ar";

  const rulesQuery = useDeductionRules();
  const upsertRule = useUpsertRule();
  const rules = rulesQuery.data ?? [];

  const [editingTrigger, setEditingTrigger] = useState<DeductionTrigger | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTrigger, setNewTrigger] = useState<DeductionTrigger>("UNEXCUSED_ABSENCE");
  const [editor, setEditor] = useState<RuleEditorState>(toEditorState());

  const openNewRuleComposer = () => {
    setShowNew(true);
    setEditingTrigger(null);
    setNewTrigger("UNEXCUSED_ABSENCE");
    setEditor(toEditorState());
  };

  useEffect(() => {
    if (openNewSignal > 0) {
      openNewRuleComposer();
    }
  }, [openNewSignal]);

  const openEdit = (rule: DeductionRule) => {
    setEditingTrigger(rule.triggerType);
    setNewTrigger(rule.triggerType);
    setShowNew(true);
    setEditor(toEditorState(rule));
  };

  const resetEditor = () => {
    setEditingTrigger(null);
    setShowNew(false);
    setEditor(toEditorState());
    setNewTrigger("UNEXCUSED_ABSENCE");
  };

  const saveRule = (triggerType: DeductionTrigger) => {
    if (!editor.amount || Number(editor.amount) < 500) {
      notifyError(ar ? "قيمة الخصم مطلوبة ويجب ألا تقل عن 500 ريال." : "Deduction amount is required and must be at least 500.");
      return;
    }
    
    if (!editor.thresholdCount || Number(editor.thresholdCount) < 1) {
      notifyError(ar ? "الحد الأدنى للتفعيل مطلوب ويجب أن يكون 1 على الأقل." : "Threshold count is required and must be at least 1.");
      return;
    }

    if (!editor.description || editor.description.trim() === "") {
      notifyError(ar ? "الوصف التوضيحي مطلوب." : "Description is required.");
      return;
    }


    upsertRule.mutate(
      {
        triggerType,
        thresholdCount: editor.thresholdCount ? Number(editor.thresholdCount) : null,
        amount: Number(editor.amount),
        deductionType: editor.deductionType,
        isActive: editor.isActive,
        description: editor.description.trim() || null
      },
      {
        onSuccess: () => {
          notifySuccess(ar ? "تم حفظ قاعدة الخصم" : "Deduction rule saved");
          resetEditor();
        },
        onError: () => notifyError(ar ? "تعذر حفظ قاعدة الخصم. يرجى المحاولة مرة أخرى." : "Unable to save the deduction rule. Please try again.")
      }
    );
  };

  if (rulesQuery.isError) {
    return (
      <ErrorState
        title={ar ? "تعذر تحميل قواعد الخصم" : "Unable to load deduction rules"}
        description={
          ar
            ? "حدث خطأ أثناء تحميل قواعد الخصومات المالية."
            : "An error occurred while loading deduction rules."
        }
        onRetry={() => void rulesQuery.refetch()}
        retryLabel={ar ? "إعادة المحاولة" : "Retry"}
      />
    );
  }

  return (
    <section className="staff-ops-view">
      <div className="staff-ops-rules-grid">
        {rulesQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="staff-ops-skeleton-block" />
          ))
        ) : rules.length === 0 ? (
          <div className="staff-ops-rules-empty">
            <Settings className="w-8 h-8 text-slate-400" />
            <p>
              {ar
                ? "لا توجد قواعد خصم معرفة بعد."
                : "No deduction rules have been configured yet."}
            </p>
          </div>
        ) : (
          rules.map((rule) => {
            return (
              <div
                key={rule.id}
                className={`staff-ops-rule-card ${!rule.isActive ? "staff-ops-rule-card--inactive" : ""}`}
              >
                <div className="staff-ops-rule-card__header">
                  <Badge variant={rule.isActive ? "warning" : "secondary"} size="sm">
                    {getTriggerLabel(rule.triggerType, ar)}
                  </Badge>
                  <Badge variant="info" size="sm">
                    {getCalcTypeLabel(rule.deductionType, ar)}
                  </Badge>
                </div>
                
                <div className="staff-ops-rule-card__detail">
                    <div className="staff-ops-rule-card__field">
                      <span className="staff-ops-person__sub">{ar ? "المبلغ" : "Amount"}</span>
                      <strong className="text-rose-600">{rule.amount.toFixed(2)} YER</strong>
                    </div>
                    <div className="staff-ops-rule-card__field">
                      <span className="staff-ops-person__sub">{ar ? "الحد الأدنى" : "Threshold"}</span>
                      <strong>{rule.thresholdCount ?? (ar ? "فوري" : "Immediate")}</strong>
                    </div>
                    <div className="staff-ops-rule-card__field">
                      <span className="staff-ops-person__sub">{ar ? "الحالة" : "Status"}</span>
                      <strong>{rule.isActive ? (ar ? "مفعلة" : "Active") : ar ? "معطلة" : "Inactive"}</strong>
                    </div>
                    {rule.description ? (
                      <p className="staff-ops-person__sub">{rule.description}</p>
                    ) : (
                      <p className="staff-ops-person__sub">
                        {ar
                          ? "أضف وصفاً قصيراً لشرح القاعدة للمراجعة المالية."
                          : "Add a short description so finance reviewers understand the rule."}
                      </p>
                    )}
                    <div className="staff-ops-rule-card__actions">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        onClick={() => openEdit(rule)}
                      >
                        {ar ? "تعديل" : "Edit"}
                      </Button>
                    </div>
                  </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={showNew}
        onClose={resetEditor}
        size="lg"
        title={
          editingTrigger
            ? ar ? "تعديل قاعدة خصم" : "Edit Deduction Rule"
            : ar ? "إضافة قاعدة خصم" : "New Deduction Rule"
        }
        titleIcon={
          <div className="ctr-modal-head-icon">
            <Settings className="w-5 h-5" />
          </div>
        }
        panelClassName="ctr-center-modal-panel lib-style"
        bodyClassName="ctr-center-modal-body"
        footerClassName="ctr-center-modal-footer"
        footer={
          <>
            <Button variant="ghost" onClick={resetEditor} disabled={upsertRule.isPending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="primary" isLoading={upsertRule.isPending} onClick={() => saveRule(newTrigger)}>
              {ar ? "حفظ" : "Save"}
            </Button>
          </>
        }
      >
        <div className="ctr-center-modal">
          <div className="glass-form-section mb-6">
            <div className="ctr-form-section__head mb-4 text-emerald-600 dark:text-emerald-400">
              <Settings className="w-5 h-5" />
              <span>{ar ? "تفاصيل القاعدة" : "Rule Details"}</span>
            </div>
            <div className="flex flex-col gap-5">
              <div className="ctr-fg">
                <label className="text-emerald-700 font-semibold mb-2 block">{ar ? "نوع المخالفة *" : "Trigger Type *"}</label>
                <Select
                  className="ctr-form-input glass-input w-full"
                  value={newTrigger}
                  onChange={(event) => setNewTrigger(event.target.value as DeductionTrigger)}
                  options={ALL_TRIGGERS.map((trigger) => ({
                    value: trigger,
                    label: getTriggerLabel(trigger, ar)
                  }))}
                  disabled={!!editingTrigger}
                />
              </div>
              <RuleEditor
                ar={ar}
                editor={editor}
                setEditor={setEditor}
                onCancel={resetEditor}
                onSave={() => saveRule(newTrigger)}
                isPending={upsertRule.isPending}
                compact
                hideActions
              />
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
}

function RuleEditor({
  ar,
  editor,
  setEditor,
  onCancel,
  onSave,
  isPending,
  compact = false,
  hideActions = false
}: {
  ar: boolean;
  editor: RuleEditorState;
  setEditor: React.Dispatch<React.SetStateAction<RuleEditorState>>;
  onCancel: () => void;
  onSave: () => void;
  isPending: boolean;
  compact?: boolean;
  hideActions?: boolean;
}) {
  return (
    <div className={compact ? "staff-ops-rule-card__form staff-ops-rule-card__form--compact" : "staff-ops-rule-card__form"}>

      {/* قيمة الخصم */}
      <div className="staff-ops-policy-field">
        <DeductionFieldLabel
          label={ar ? "قيمة الخصم" : "Deduction Amount"}
          hint={
            ar
              ? "المبلغ بالريال اليمني (YER). عند طريقة الاحتساب ‘لكل يوم’ أو ‘لكل تكرار’ يضرب هذا المبلغ في عدد الحالات. عند ‘مبلغ ثابت’ يُخصم هذا المبلغ مرة واحدة بغض النظر عن عدد الحالات."
              : "Amount in Yemeni Rial (YER). For 'Per Day'/'Per Occurrence', this is multiplied by the count. For 'Fixed', this is deducted once regardless of count."
          }
        />
        <Input
          type="number"
          min={500}
          step="any"
          required
          value={editor.amount}
          onChange={(event) =>
            setEditor((current) => ({ ...current, amount: event.target.value }))
          }
        />
      </div>

      {/* الحد الأدنى للتفعيل */}
      <div className="staff-ops-policy-field">
        <DeductionFieldLabel
          label={ar ? "الحد الأدنى للتفعيل" : "Threshold Count"}
          hint={
            ar
              ? "عدد الحالات المسموح بها مجاناً قبل تفعيل الخصم. أدخل 1 لتطبيق الخصم من أول حالة."
              : "Number of free occurrences before deduction starts. Enter 1 to deduct from the first occurrence."
          }
        />
        <Input
          type="number"
          min={1}
          step={1}
          required
          value={editor.thresholdCount}
          onChange={(event) =>
            setEditor((current) => ({ ...current, thresholdCount: event.target.value }))
          }
        />
      </div>

      {/* طريقة الاحتساب */}
      <div className="staff-ops-policy-field">
        <DeductionFieldLabel
          label={ar ? "طريقة الاحتساب" : "Calculation Method"}
          hint={
            ar
              ? "‘مبلغ ثابت’: يُخصم المبلغ مرة واحدة بغض النظر عن عدد الحالات. ‘لكل يوم’: مناسب للإجازات غير المدفوعة. ‘لكل تكرار’: مناسب للغياب والتأخر والزيارات الفائتة."
              : "'Fixed': deduct once regardless of count. 'Per Day': multiplied by days (ideal for unpaid leave). 'Per Occurrence': multiplied by events (ideal for absences, lates, missed visits)."
          }
        />
        <Select
          value={editor.deductionType}
          onChange={(event) =>
            setEditor((current) => ({
              ...current,
              deductionType: event.target.value as DeductionCalcType
            }))
          }
          options={CALC_TYPES.map((type) => ({
            value: type,
            label: getCalcTypeLabel(type, ar)
          }))}
        />
      </div>

      {/* وصف توضيحي */}
      <div className="staff-ops-policy-field">
        <DeductionFieldLabel
          label={ar ? "وصف توضيحي" : "Description"}
          hint={
            ar
              ? "مطلوب. يظهر للمراجع المالي عند دراسة حدث الخصم لتسهيل اتخاذ قرار الاعتماد أو الإعفاء."
              : "Required. Shown to the finance reviewer when studying the deduction event to help decide approval or waiver."
          }
        />
        <Input
          type="text"
          maxLength={255}
          required
          value={editor.description}
          onChange={(event) =>
            setEditor((current) => ({ ...current, description: event.target.value }))
          }
        />
      </div>

      <label className="staff-ops-weekend-checkbox">
        <input
          type="checkbox"
          checked={editor.isActive}
          onChange={(event) =>
            setEditor((current) => ({ ...current, isActive: event.target.checked }))
          }
        />
        <span>{ar ? "القاعدة مفعلة" : "Rule is active"}</span>
      </label>
      
      {!hideActions && (
        <div className="staff-ops-rule-card__actions">
          <Button
            type="button"
            size="sm"
            variant="success"
            leftIcon={<Save className="w-3.5 h-3.5" />}
            onClick={onSave}
            isLoading={isPending}
          >
            {ar ? "حفظ" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      )}
    </div>
  );
}
