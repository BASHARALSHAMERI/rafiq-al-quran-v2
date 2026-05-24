// HR-PAYROLL-UX-COMPLETE: FinanceSalaryGradesTab with CreatableCombobox for jobTitle & gradeLevel
import { useMemo, useState, useEffect } from "react";
import { Edit, Award } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { FinSkeleton } from "../FinanceShared";
import { FinanceMoney, FinanceStatusBadge, FinanceCurrencySelect } from "../../design";
import { FinanceDataTable } from "../../design/FinanceDataTable";
import Modal from "../../../../components/ui/Modal";
import useClientPagination from "../../../../shared/ui/useClientPagination";
import {
  useFinanceV2SalaryGradesQuery,
  useCreateFinanceV2SalaryGradeMutation,
  useUpdateFinanceV2SalaryGradeMutation
} from "../../finance-v2.hooks";
import type { SalaryGradeV2 } from "../../types";

// Default curated options (shown until data loads or as suggestions)
const DEFAULT_JOB_TITLES = [
  "معلم قرآن",
  "مشرف حلقات",
  "مدير مركز",
  "محاسب",
  "إداري",
];

const DEFAULT_GRADE_LEVELS = [
  "درجة A",
  "درجة B",
  "درجة C",
  "درجة أولى",
  "درجة ثانية",
  "درجة ثالثة",
  "متعاون",
  "مكافأة شهرية",
];

type Props = {
  centerId: number | undefined;
  ar: boolean;
  canManage?: boolean;
  externalShowForm?: boolean;
  onExternalFormClose?: () => void;
};

export default function FinanceSalaryGradesTab({ 
  centerId, 
  ar, 
  canManage = true,
  externalShowForm, 
  onExternalFormClose 
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<SalaryGradeV2 | null>(null);

  // Sync with parent's trigger
  useEffect(() => {
    if (externalShowForm && canManage) {
      openNew();
    }
  }, [externalShowForm, canManage]);

  const gradesQ = useFinanceV2SalaryGradesQuery(centerId);
  const grades = useMemo(() => gradesQ.data ?? [], [gradesQ.data]);
  const pagination = useClientPagination(grades, { initialPageSize: 10 });

  const createGradeM = useCreateFinanceV2SalaryGradeMutation();
  const updateGradeM = useUpdateFinanceV2SalaryGradeMutation();

  const handleClose = () => {
    setFormOpen(false);
    onExternalFormClose?.();
  };

  const [formState, setFormState] = useState({
    jobTitle: "",
    gradeLevel: "",
    baseSalary: 0,
    currencyCode: "",
    isActive: true,
    notes: "",
  });

  // Build dynamic options from existing DB values + defaults (deduplicated)
  const jobTitleOptions = useMemo(() => {
    const fromDb = grades.map((g) => g.jobTitle).filter(Boolean);
    return Array.from(new Set([...DEFAULT_JOB_TITLES, ...fromDb]));
  }, [grades]);

  const gradeLevelOptions = useMemo(() => {
    const fromDb = grades.map((g) => g.gradeLevel).filter(Boolean);
    return Array.from(new Set([...DEFAULT_GRADE_LEVELS, ...fromDb]));
  }, [grades]);

  const openNew = () => {
    if (!canManage) return;
    setFormState({ jobTitle: "", gradeLevel: "", baseSalary: 0, currencyCode: "", isActive: true, notes: "" });
    setEditingGrade(null);
    setFormOpen(true);
  };

  const openEdit = (g: SalaryGradeV2) => {
    if (!canManage) return;
    setFormState({
      jobTitle: g.jobTitle,
      gradeLevel: g.gradeLevel,
      baseSalary: g.baseSalary,
      currencyCode: g.currencyCode || "",
      isActive: g.isActive,
      notes: g.notes || "",
    });
    setEditingGrade(g);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.jobTitle.trim() || !formState.gradeLevel.trim()) return;
    try {
      if (editingGrade) {
        await updateGradeM.mutateAsync({
          id: editingGrade.id,
          payload: { ...formState },
        });
      } else {
        await createGradeM.mutateAsync({
          ...formState,
          centerId,
        });
      }
      setFormOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {gradesQ.isLoading ? <FinSkeleton rows={5} /> : null}

      {!gradesQ.isLoading && grades.length === 0 ? (
        <EmptyState
          title={ar ? "لا يوجد درجات" : "No salary grades"}
          description={
            ar
              ? "أضف درجات وظيفية جديدة للبدء."
              : "Add new salary grades to start."
          }
          icon={<Award className="w-10 h-10" />}
        />
      ) : null}

      {!gradesQ.isLoading && grades.length > 0 ? (
        <div className="animate-premium mt-4">
          <FinanceDataTable<SalaryGradeV2>
            rows={pagination.pagedRows}
            columns={[
              {
                header: ar ? "المسمى الوظيفي" : "Job Title",
                render: (g) => (
                  <span className="font-bold text-slate-800">{g.jobTitle}</span>
                ),
              },
              {
                header: ar ? "المرتبة / الدرجة" : "Grade Level",
                render: (g) => (
                  <span className="font-semibold text-slate-600">
                    {g.gradeLevel}
                  </span>
                ),
              },
              {
                header: ar ? "الراتب الأساسي" : "Base Salary",
                render: (g) => (
                  <FinanceMoney
                    amount={g.baseSalary}
                    baseCurrency={g.currencyCode || "YER"}
                    className="text-lg font-black text-brand-600"
                  />
                ),
              },
              {
                header: ar ? "الحالة" : "Status",
                render: (g) => (
                  <FinanceStatusBadge
                    status={g.isActive ? "APPROVED" : "CANCELLED"}
                    label={
                      g.isActive
                        ? ar
                          ? "نشط"
                          : "Active"
                        : ar
                        ? "غير نشط"
                        : "Inactive"
                    }
                  />
                ),
              },
              {
                header: ar ? "ملاحظات" : "Notes",
                render: (g) => (
                  <span className="text-xs text-slate-400 line-clamp-1">
                    {g.notes || "—"}
                  </span>
                ),
              },
              {
                header: ar ? "الإجراءات" : "Actions",
                render: (g) => (
                  <div className="flex items-center gap-2">
                    {canManage ? (
                    <button
                      className="fin-action-btn view"
                      onClick={() => openEdit(g)}
                      title={ar ? "تعديل" : "Edit"}
                    >
                      <Edit size={16} />
                    </button>
                    ) : null}
                  </div>
                ),
              },
            ]}
            rowKey="id"
            className="fin-premium-table"
          />
        </div>
      ) : null}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={Boolean(formOpen && canManage)}
        onClose={handleClose}
        title={
          ar
            ? editingGrade
              ? "تعديل الدرجة"
              : "إضافة درجة راتب"
            : editingGrade
            ? "Edit Grade"
            : "Add Salary Grade"
        }
        titleIcon={
          <div className="circlemod-head-icon">
            <Award className="w-4 h-4" />
          </div>
        }
        size="md"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={handleClose}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="salary-grade-form"
              isLoading={createGradeM.isPending || updateGradeM.isPending}
            >
              {ar ? "حفظ" : "Save"}
            </Button>
          </div>
        }
      >
        <form
          id="salary-grade-form"
          className="circlemod-form"
          onSubmit={handleSubmit}
          dir={ar ? "rtl" : "ltr"}
        >
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Award size={15} className="circlemod-section-icon" />
              <span>{ar ? "بيانات السلم الوظيفي" : "Salary Grade Details"}</span>
            </div>
            
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="jobTitle">
                  {ar ? "المسمى الوظيفي" : "Job Title"} <span className="text-red-500">*</span>
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  list="jobTitleList"
                  className="circlemod-input"
                  value={formState.jobTitle}
                  onChange={(e) => setFormState((p) => ({ ...p, jobTitle: e.target.value }))}
                  placeholder={ar ? "اختر أو أدخل مسمى وظيفي..." : "Select or enter job title..."}
                  required
                />
                <datalist id="jobTitleList">
                  {jobTitleOptions.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="gradeLevel">
                  {ar ? "المرتبة / الدرجة" : "Grade Level"} <span className="text-red-500">*</span>
                </label>
                <input
                  id="gradeLevel"
                  type="text"
                  list="gradeLevelList"
                  className="circlemod-input"
                  value={formState.gradeLevel}
                  onChange={(e) => setFormState((p) => ({ ...p, gradeLevel: e.target.value }))}
                  placeholder={ar ? "اختر أو أدخل مرتبة..." : "Select or enter grade level..."}
                  required
                />
                <datalist id="gradeLevelList">
                  {gradeLevelOptions.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="baseSalary">
                  {ar ? "الراتب الأساسي المعتمد" : "Base Salary"} <span className="text-red-500">*</span>
                </label>
                <input
                  id="baseSalary"
                  required
                  type="number"
                  min="0"
                  className="circlemod-input"
                  value={formState.baseSalary || ""}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, baseSalary: Number(e.target.value) }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "العملة" : "Currency"}</label>
                <FinanceCurrencySelect
                  value={formState.currencyCode || ""}
                  onChange={(val) => setFormState((p) => ({ ...p, currencyCode: val }))}
                  allowEmpty={true}
                  emptyLabel={ar ? "-- العملة الافتراضية --" : "-- Default Currency --"}
                />
              </div>
            </div>

            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="notes">{ar ? "ملاحظات" : "Notes"}</label>
                <input
                  id="notes"
                  className="circlemod-input"
                  value={formState.notes}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder={ar ? "ملاحظات اختيارية..." : "Optional notes..."}
                />
              </div>
            </div>

            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="salaryGradeIsActive"
                    checked={formState.isActive}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, isActive: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="salaryGradeIsActive" className="text-sm font-semibold cursor-pointer">
                    {ar ? "نشط (مفعّل في سلم الرواتب)" : "Active (available for payroll)"}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
