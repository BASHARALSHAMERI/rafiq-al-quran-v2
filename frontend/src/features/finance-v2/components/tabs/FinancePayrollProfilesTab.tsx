// HR-PAYROLL-UX-COMPLETE: FinancePayrollProfilesTab with employee search & override UX
import { useMemo, useState, useEffect } from "react";
import { User, Calculator, AlertCircle, Check } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { FinSkeleton } from "../FinanceShared";
import { FinanceMoney, FinanceStatusBadge, FinanceCurrencySelect } from "../../design";
import { FinanceDataTable } from "../../design/FinanceDataTable";
import Modal from "../../../../components/ui/Modal";
import useClientPagination from "../../../../shared/ui/useClientPagination";
import {
  useFinanceV2PayrollProfilesQuery,
  useCreateFinanceV2PayrollProfileMutation,
  useUpdateFinanceV2PayrollProfileMutation,
  useFinanceV2SalaryGradesQuery,
  useFinanceV2EligibleEmployeesQuery,
} from "../../finance-v2.hooks";
import type {
  CreatePayrollProfileV2Payload,
  PaymentMethodV2,
  PayrollProfileV2,
  EligibleEmployeeV2,
} from "../../types";

const ROLE_LABEL_AR: Record<string, string> = {
  TEACHER: "معلم",
  SUPERVISOR: "مشرف",
  CENTER_ADMIN: "مدير مركز",
  ACCOUNTANT: "محاسب",
};

type Props = {
  centerId: number | undefined;
  ar: boolean;
  centers: { id: number; name: string }[];
  externalShowForm?: boolean;
  onExternalFormClose?: () => void;
};

type FormMode = "create" | "edit";

const emptyForm = (): CreatePayrollProfileV2Payload => ({
  userId: 0,
  salaryGradeId: null,
  salarySource: "GRADE",
  overrideReason: "",
  monthlyBaseAmount: 0,
  salaryCurrencyCode: "YER",
  paymentMethodDefault: "CASH" as PaymentMethodV2,
  effectiveFrom: new Date().toISOString().slice(0, 10),
  isActive: true,
});

export default function FinancePayrollProfilesTab({ 
  centerId, 
  ar, 
  externalShowForm, 
  onExternalFormClose 
}: Props) {
  const profilesQ = useFinanceV2PayrollProfilesQuery(centerId);
  const profiles = useMemo(() => profilesQ.data?.rows ?? [], [profilesQ.data?.rows]);
  const pagination = useClientPagination(profiles, { initialPageSize: 10 });

  const gradesQ = useFinanceV2SalaryGradesQuery(centerId, true);
  const grades = useMemo(() => gradesQ.data ?? [], [gradesQ.data]);

  const [empSearch, setEmpSearch] = useState("");
  const empQ = useFinanceV2EligibleEmployeesQuery({ centerId, search: empSearch || undefined });
  const employees = useMemo(() => empQ.data ?? [], [empQ.data]);

  const createProfileM = useCreateFinanceV2PayrollProfileMutation();
  const updateProfileM = useUpdateFinanceV2PayrollProfileMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");

  // Sync with parent's trigger
  useEffect(() => {
    if (externalShowForm) {
      openNew();
    }
  }, [externalShowForm]);

  const handleClose = () => {
    setFormOpen(false);
    onExternalFormClose?.();
  };
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formState, setFormState] = useState<CreatePayrollProfileV2Payload>(emptyForm());
  const [isOverride, setIsOverride] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EligibleEmployeeV2 | null>(null);

  const selectedGrade = useMemo(
    () => grades.find((g) => g.id === formState.salaryGradeId),
    [grades, formState.salaryGradeId]
  );

  // When grade changes → auto-fill monthlyBaseAmount if not override
  useEffect(() => {
    if (!isOverride && selectedGrade) {
      setFormState((p) => ({
        ...p,
        monthlyBaseAmount: selectedGrade.baseSalary,
        salarySource: "GRADE",
      }));
    }
  }, [selectedGrade, isOverride]);

  const openNew = () => {
    setFormState(emptyForm());
    setIsOverride(false);
    setSelectedEmployee(null);
    setEmpSearch("");
    setFormMode("create");
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (p: PayrollProfileV2) => {
    const override = p.salarySource === "OVERRIDE";
    setIsOverride(override);
    setEditingId(p.id);
    setFormMode("edit");
    setFormState({
      userId: p.userId,
      salaryGradeId: p.salaryGradeId ?? null,
      salarySource: p.salarySource ?? "GRADE",
      overrideReason: p.overrideReason ?? "",
      monthlyBaseAmount: p.monthlyBaseAmount,
      salaryCurrencyCode: p.salaryCurrencyCode ?? "YER",
      paymentMethodDefault: p.paymentMethodDefault ?? "CASH",
      effectiveFrom: p.effectiveFrom?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      effectiveTo: p.effectiveTo?.slice(0, 10),
      isActive: p.isActive,
    });
    // Set a synthetic employee object from existing profile data
    if (p.user) {
      setSelectedEmployee({
        id: p.userId,
        fullName: p.user.fullName,
        role: p.user.role as EligibleEmployeeV2["role"],
        phone: null,
        username: null,
        center: null,
      });
    } else {
      setSelectedEmployee(null);
    }
    setEmpSearch("");
    setFormOpen(true);
  };

  const handleOverrideToggle = (checked: boolean) => {
    setIsOverride(checked);
    if (!checked) {
      // Revert to grade salary
      setFormState((p) => ({
        ...p,
        salarySource: "GRADE",
        overrideReason: "",
        monthlyBaseAmount: selectedGrade ? selectedGrade.baseSalary : p.monthlyBaseAmount,
      }));
    } else {
      setFormState((p) => ({ ...p, salarySource: "OVERRIDE" }));
    }
  };

  const handleGradeChange = (gId: number | null) => {
    const grade = grades.find((g) => g.id === gId);
    setFormState((p) => ({
      ...p,
      salaryGradeId: gId,
      salarySource: gId && !isOverride ? "GRADE" : p.salarySource,
      monthlyBaseAmount: grade && !isOverride ? grade.baseSalary : p.monthlyBaseAmount,
      salaryCurrencyCode: grade && !isOverride ? grade.currencyCode : p.salaryCurrencyCode,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.userId) return;
    if (isOverride && !formState.overrideReason?.trim()) return;
    try {
      const payload = {
        ...formState,
        salarySource: isOverride ? "OVERRIDE" : "GRADE",
        overrideReason: isOverride ? formState.overrideReason : undefined,
      } as CreatePayrollProfileV2Payload;

      if (formMode === "edit" && editingId) {
        await updateProfileM.mutateAsync({ id: editingId, payload });
      } else {
        await createProfileM.mutateAsync({ ...payload, centerId });
      }
      setFormOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const isPending = createProfileM.isPending || updateProfileM.isPending;

  return (
    <>
      {profilesQ.isLoading ? <FinSkeleton rows={5} /> : null}

      {!profilesQ.isLoading && profiles.length === 0 ? (
        <EmptyState
          title={ar ? "لا يوجد ملفات رواتب" : "No payroll profiles"}
          description={ar ? "أضف ملف راتب للموظف لتتمكن من إنشاء دفعات راتب له." : "Add a payroll profile for staff to disburse payroll."}
          icon={<Calculator className="w-10 h-10" />}
        />
      ) : null}

      {!profilesQ.isLoading && profiles.length > 0 ? (
        <div className="animate-premium mt-4">
          <FinanceDataTable<PayrollProfileV2>
            rows={pagination.pagedRows}
            columns={[
              {
                header: ar ? "الموظف" : "Employee",
                render: (p) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <User size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-text-primary">{p.user?.fullName || `#${p.userId}`}</span>
                      <span className="text-[0.65rem] text-text-tertiary font-medium">
                        {p.user?.role ? (ROLE_LABEL_AR[p.user.role] ?? p.user.role) : "—"}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                header: ar ? "المرتبة / الوظيفة" : "Grade / Job",
                render: (p) => (
                  <span className="font-semibold text-slate-600">
                    {p.salaryGrade
                      ? `${p.salaryGrade.jobTitle} · ${p.salaryGrade.gradeLevel}`
                      : "—"}
                  </span>
                ),
              },
              {
                header: ar ? "الراتب المعتمد" : "Approved Salary",
                render: (p) => (
                  <FinanceMoney
                    amount={p.monthlyBaseAmount}
                    baseCurrency={p.salaryCurrencyCode || "YER"}
                    className="text-lg font-black text-brand-600"
                  />
                ),
              },
              {
                header: ar ? "مصدر الراتب" : "Source",
                render: (p) => (
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${
                        p.salarySource === "OVERRIDE"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {p.salarySource === "OVERRIDE"
                        ? ar ? "استثناء" : "Override"
                        : ar ? "من الدرجة" : "Grade"}
                    </span>
                    {p.salarySource === "OVERRIDE" && p.overrideReason && (
                      <span
                        className="text-[0.6rem] text-slate-400 mt-0.5 line-clamp-1 cursor-help"
                        title={p.overrideReason}
                      >
                        {p.overrideReason}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                header: ar ? "تاريخ السريان" : "Effective",
                render: (p) => (
                  <span className="text-xs text-slate-600">
                    {p.effectiveFrom?.slice(0, 10) || "—"}
                    {p.effectiveTo ? ` ← ${p.effectiveTo.slice(0, 10)}` : ""}
                  </span>
                ),
              },
              {
                header: ar ? "الحالة" : "Status",
                render: (p) => (
                  <FinanceStatusBadge
                    status={p.isActive ? "APPROVED" : "CANCELLED"}
                    label={p.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive")}
                  />
                ),
              },
              {
                header: ar ? "الإجراءات" : "Actions",
                render: (p) => (
                  <button className="fin-action-btn view" onClick={() => openEdit(p)} title={ar ? "تعديل" : "Edit"}>
                    <Calculator size={16} />
                  </button>
                ),
              },
            ]}
            rowKey="id"
            className="fin-premium-table"
          />
        </div>
      ) : null}

      {/* Modal */}
      <Modal
        isOpen={formOpen}
        onClose={handleClose}
        title={
          ar
            ? formMode === "edit" ? "تعديل ملف الراتب" : "إنشاء ملف راتب"
            : formMode === "edit" ? "Edit Payroll Profile" : "Create Payroll Profile"
        }
        titleIcon={
          <div className="circlemod-head-icon">
            <Calculator className="w-4 h-4" />
          </div>
        }
        size="lg"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={handleClose}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button variant="primary" type="submit" form="payroll-profile-form" isLoading={isPending}>
              {ar ? "حفظ ملف الراتب" : "Save Profile"}
            </Button>
          </div>
        }
      >
        <form id="payroll-profile-form" className="circlemod-form" onSubmit={handleSubmit} dir={ar ? "rtl" : "ltr"}>

          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <User size={15} className="circlemod-section-icon" />
              <span>{ar ? "بيانات الموظف" : "Employee Details"}</span>
            </div>

            {/* 1. اختيار الموظف */}
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>
                  {ar ? "الموظف" : "Employee"} <span className="text-red-500">*</span>
                </label>

                {formMode === "create" ? (
                  <>
                    <input
                      type="text"
                      list="employeeList"
                      className="circlemod-input w-full"
                      placeholder={ar ? "اختر أو أدخل اسم الموظف..." : "Select or type employee name..."}
                      value={empSearch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmpSearch(val);
                        const matched = employees.find((emp) => emp.fullName === val);
                        if (matched) {
                          setFormState((p) => ({ ...p, userId: matched.id }));
                        } else {
                          setFormState((p) => ({ ...p, userId: 0 }));
                        }
                      }}
                      required
                    />
                    <datalist id="employeeList">
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.fullName}>
                          {ROLE_LABEL_AR[emp.role] ?? emp.role} {emp.center ? ` - ${emp.center.name}` : ""}
                        </option>
                      ))}
                    </datalist>
                    {formState.userId > 0 && (
                      <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check size={14} />
                        {ar ? "تم اختيار الموظف بنجاح" : "Employee selected successfully"}
                      </div>
                    )}
                  </>
                ) : (
                  // Edit mode - just show readonly input
                  <input
                    type="text"
                    disabled
                    className="circlemod-input w-full bg-slate-50 cursor-not-allowed text-slate-500"
                    value={selectedEmployee?.fullName || `#${formState.userId}`}
                  />
                )}
                <input type="hidden" required value={formState.userId || ""} />
              </div>
            </div>

            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="salaryGradeId">
                  {ar ? "المرتبة الوظيفية (سلم الرواتب)" : "Salary Grade"}
                </label>
                <select
                  id="salaryGradeId"
                  className="circlemod-select"
                  value={formState.salaryGradeId ?? ""}
                  onChange={(e) => handleGradeChange(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{ar ? "-- غير محدد (مخصص) --" : "-- None (Custom) --"}</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.jobTitle} · {g.gradeLevel} — {g.baseSalary.toLocaleString()} {g.currencyCode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Calculator size={15} className="circlemod-section-icon" />
              <span>{ar ? "تفاصيل الراتب" : "Salary Details"}</span>
            </div>

            <div className="circlemod-row">
              {/* Approved (readonly unless override) */}
              <div className="circlemod-field circlemod-field--sm">
                <label className="text-brand-600 dark:text-brand-400">{ar ? "الراتب المعتمد" : "Approved Salary"}</label>
                {isOverride ? (
                  <input
                    required
                    type="number"
                    min="0"
                    className="circlemod-input bg-amber-50/30 focus:border-amber-500 focus:ring-amber-500/20"
                    value={formState.monthlyBaseAmount || ""}
                    onChange={(e) => setFormState((p) => ({ ...p, monthlyBaseAmount: Number(e.target.value) }))}
                    placeholder={ar ? "أدخل مبلغ الراتب..." : "Enter salary amount..."}
                  />
                ) : (
                  <input
                    disabled
                    type="number"
                    className="circlemod-input bg-slate-50 cursor-not-allowed text-slate-500"
                    value={formState.monthlyBaseAmount || ""}
                    placeholder={ar ? "من الدرجة" : "From grade"}
                  />
                )}
              </div>

              {/* Currency */}
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "عملة الراتب" : "Currency"}</label>
                <FinanceCurrencySelect
                  value={formState.salaryCurrencyCode || "YER"}
                  onChange={(val) => setFormState((p) => ({ ...p, salaryCurrencyCode: val }))}
                  disabled={!isOverride && !!formState.salaryGradeId}
                />
              </div>
            </div>

            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <div className="flex flex-col gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{ar ? "مصدر الراتب:" : "Salary source:"}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isOverride ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    }`}>
                      {isOverride ? (ar ? "استثناء معتمد" : "Override") : (ar ? "من سلم الرواتب" : "Grade")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <input
                      type="checkbox"
                      id="overrideToggle"
                      checked={isOverride}
                      onChange={(e) => handleOverrideToggle(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="overrideToggle" className="text-sm font-semibold text-amber-700 dark:text-amber-400 cursor-pointer">
                      {ar ? "تفعيل استثناء معتمد (تعديل الراتب يدوياً)" : "Enable override (manual salary)"}
                    </label>
                  </div>
                  {isOverride && (
                    <div className="pt-1 mt-1">
                      <label className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {ar ? "سبب الاستثناء (مطلوب)" : "Override Reason (required)"}
                      </label>
                      <input
                        required={isOverride}
                        className="circlemod-input border-amber-300 dark:border-amber-700/50 focus:border-amber-500 text-sm"
                        value={formState.overrideReason || ""}
                        onChange={(e) => setFormState((p) => ({ ...p, overrideReason: e.target.value }))}
                        placeholder={ar ? "أدخل سبب تعديل الراتب..." : "Explain why salary differs from grade"}
                        maxLength={500}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "طريقة الدفع الافتراضية" : "Default Payment Method"}</label>
                <select
                  className="circlemod-select"
                  value={formState.paymentMethodDefault || "CASH"}
                  onChange={(e) => setFormState((p) => ({ ...p, paymentMethodDefault: e.target.value as "CASH" | "TRANSFER" }))}
                >
                  <option value="CASH">{ar ? "نقدي (Cash)" : "Cash"}</option>
                  <option value="TRANSFER">{ar ? "تحويل / بنك (Transfer)" : "Transfer"}</option>
                </select>
              </div>
            </div>
            
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="effectiveFrom">
                  {ar ? "تاريخ السريان" : "Effective From"} <span className="text-red-500">*</span>
                </label>
                <input
                  id="effectiveFrom"
                  required
                  type="date"
                  className="circlemod-input"
                  value={formState.effectiveFrom}
                  onChange={(e) => setFormState((p) => ({ ...p, effectiveFrom: e.target.value }))}
                />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="effectiveTo">
                  {ar ? "تاريخ الانتهاء" : "Effective To"} <span className="text-xs text-slate-400 ms-1">{ar ? "(اختياري)" : "(optional)"}</span>
                </label>
                <input
                  id="effectiveTo"
                  type="date"
                  className="circlemod-input"
                  value={formState.effectiveTo || ""}
                  onChange={(e) => setFormState((p) => ({ ...p, effectiveTo: e.target.value || undefined }))}
                />
              </div>
            </div>

            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="profileIsActive"
                    checked={formState.isActive}
                    onChange={(e) => setFormState((p) => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="profileIsActive" className="text-sm font-semibold cursor-pointer">
                    {ar ? "نشط (يُضمَّن في مسيرات الرواتب)" : "Active (included in payroll batches)"}
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
