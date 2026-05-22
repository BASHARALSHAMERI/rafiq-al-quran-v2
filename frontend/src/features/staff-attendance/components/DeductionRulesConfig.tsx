import { useEffect, useState } from "react";
import { Edit3, Save, Settings } from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Input } from "../../../components/ui/Input";
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
      return ar ? "إجازة غير مدفوعة" : "Unpaid Leave";
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

type RuleEditorState = {
  thresholdCount: string;
  deductionAmountSAR: string;
  deductionType: DeductionCalcType;
  isActive: boolean;
  description: string;
};

const toEditorState = (rule?: DeductionRule): RuleEditorState => ({
  thresholdCount: rule?.thresholdCount != null ? String(rule.thresholdCount) : "",
  deductionAmountSAR: rule ? String(rule.deductionAmountSAR) : "",
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
    setEditor(toEditorState(rule));
  };

  const resetEditor = () => {
    setEditingTrigger(null);
    setShowNew(false);
    setEditor(toEditorState());
    setNewTrigger("UNEXCUSED_ABSENCE");
  };

  const saveRule = (triggerType: DeductionTrigger) => {
    if (!editor.deductionAmountSAR) {
      notifyError(ar ? "قيمة الخصم مطلوبة." : "Deduction amount is required.");
      return;
    }

    upsertRule.mutate(
      {
        triggerType,
        thresholdCount: editor.thresholdCount ? Number(editor.thresholdCount) : null,
        deductionAmountSAR: Number(editor.deductionAmountSAR),
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
            const isEditing = editingTrigger === rule.triggerType;
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

                {isEditing ? (
                  <RuleEditor
                    ar={ar}
                    editor={editor}
                    setEditor={setEditor}
                    onCancel={resetEditor}
                    onSave={() => saveRule(rule.triggerType)}
                    isPending={upsertRule.isPending}
                  />
                ) : (
                  <div className="staff-ops-rule-card__detail">
                    <div className="staff-ops-rule-card__field">
                      <span className="staff-ops-person__sub">{ar ? "المبلغ" : "Amount"}</span>
                      <strong className="text-rose-600">{rule.deductionAmountSAR.toFixed(2)} SAR</strong>
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
                )}
              </div>
            );
          })
        )}
      </div>

      {showNew ? (
        <div className="staff-ops-modal-overlay" onClick={resetEditor}>
          <div className="staff-ops-modal staff-ops-modal--deduction-rule" onClick={(event) => event.stopPropagation()}>
            <div className="staff-ops-modal__header">
              <h3>{ar ? "قاعدة خصم جديدة" : "New Deduction Rule"}</h3>
              <button type="button" className="staff-ops-modal__close" onClick={resetEditor}>
                ×
              </button>
            </div>
            <div className="staff-ops-modal__body">
              <div className="staff-ops-modal__field">
                <label className="input-label">{ar ? "نوع المخالفة" : "Trigger Type"}</label>
                <Select
                  value={newTrigger}
                  onChange={(event) => setNewTrigger(event.target.value as DeductionTrigger)}
                  options={ALL_TRIGGERS.map((trigger) => ({
                    value: trigger,
                    label: getTriggerLabel(trigger, ar)
                  }))}
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
              />
            </div>
          </div>
        </div>
      ) : null}
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
  compact = false
}: {
  ar: boolean;
  editor: RuleEditorState;
  setEditor: React.Dispatch<React.SetStateAction<RuleEditorState>>;
  onCancel: () => void;
  onSave: () => void;
  isPending: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "staff-ops-rule-card__form staff-ops-rule-card__form--compact" : "staff-ops-rule-card__form"}>
      <Input
        type="number"
        value={editor.deductionAmountSAR}
        onChange={(event) =>
          setEditor((current) => ({ ...current, deductionAmountSAR: event.target.value }))
        }
        label={ar ? "قيمة الخصم" : "Deduction Amount"}
        helperText={ar ? "بالريال السعودي" : "Amount in SAR"}
      />
      <Input
        type="number"
        value={editor.thresholdCount}
        onChange={(event) =>
          setEditor((current) => ({ ...current, thresholdCount: event.target.value }))
        }
        label={ar ? "الحد الأدنى للتفعيل" : "Threshold Count"}
        helperText={
          ar
            ? "اتركه فارغاً إذا كان الخصم يبدأ من أول حالة."
            : "Leave empty to apply from the first occurrence."
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
        label={ar ? "طريقة الاحتساب" : "Calculation Method"}
        options={CALC_TYPES.map((type) => ({
          value: type,
          label: getCalcTypeLabel(type, ar)
        }))}
      />
      <Input
        value={editor.description}
        onChange={(event) =>
          setEditor((current) => ({ ...current, description: event.target.value }))
        }
        label={ar ? "وصف توضيحي" : "Description"}
        helperText={
          ar
            ? "يظهر للمراجع المالي عند دراسة الحدث."
            : "Shown to reviewers during deduction review."
        }
      />
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
    </div>
  );
}
