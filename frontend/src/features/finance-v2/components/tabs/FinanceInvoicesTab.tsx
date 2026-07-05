import { useEffect, useMemo, useState } from "react";
import { Receipt, ArrowRight, Printer, FileText, AlertCircle, User, Calendar, DollarSign, StickyNote } from "lucide-react";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { getLocalizedApiErrorMessage } from "../../../../shared/api/error";
import { entityFeedback, notifyError, notifyRequiredFields, notifySuccess, type LocalizedLabel } from "../../../../shared/ui/feedback";
import { printFinanceReport, formatYemeniCurrency } from "../../../accounting/printAccounting";
import { useUsersQuery } from "../../../users/users.hooks";
import {
  useCreateFinanceV2InvoiceMutation,
  useFinanceV2InvoicesQuery,
  useFinanceV2StudentFeeProfilesQuery
} from "../../finance-v2.hooks";
import { FINANCE_YEMEN_MODE } from "../../config";
import type { InvoiceStatusV2, FinanceInvoiceV2 } from "../../types";
import { FinSkeleton, posInt, FinancePaginationFooter } from "../FinanceShared";
import {
  FinanceStatusBadge,
  FinanceMoney
} from "../../design";
import { FinanceDataTable } from "../../design/FinanceDataTable";
import Modal from "../../../../components/ui/Modal";
import { Button } from "../../../../components/ui/Button";
import useClientPagination from "../../../../shared/ui/useClientPagination";

type Props = {
  centerId: number | undefined;
  month: number;
  year: number;
  status: InvoiceStatusV2 | "";
  isAdmin: boolean;
  ar: boolean;
  centers: { id: number; name: string }[];
  onSelectInvoice: (id: number) => void;
  statusLabels: Record<InvoiceStatusV2, string>;
  externalShowForm?: boolean;
  onExternalFormClose?: () => void;
  feesEnabled?: boolean;
};

const INVOICE_ENTITY: LocalizedLabel = { ar: "الفاتورة", en: "invoice" };
const INVOICES_ENTITY: LocalizedLabel = { ar: "الفواتير", en: "invoices" };

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function FinanceInvoicesTab({
  centerId,
  month,
  year,
  status,
  isAdmin,
  ar,
  centers = [],
  onSelectInvoice,
  statusLabels,
  externalShowForm,
  onExternalFormClose,
  feesEnabled
}: Props) {
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    centerId: "",
    studentId: "",
    invoiceKind: "TUITION_MONTHLY",
    amount: "",
    dueDate: todayIso(),
    description: "",
    notes: ""
  });
  const [invoiceError, setInvoiceError] = useState("");

  useEffect(() => {
    if (externalShowForm) {
      setShowInvoiceForm(true);
    }
  }, [externalShowForm]);

  const invoicesQ = useFinanceV2InvoicesQuery({
    centerId,
    month,
    year,
    status: status || undefined,
    page: 1,
    pageSize: 100
  });
  const invoices = useMemo(() => invoicesQ.data?.rows ?? [], [invoicesQ.data?.rows]);
  const pagination = useClientPagination(invoices, { initialPageSize: 10 });

  const selectedCenterId = posInt(invoiceForm.centerId) ?? centerId;
  const selectedStudentId = posInt(invoiceForm.studentId);
  const studentsQ = useUsersQuery({
    role: "STUDENT",
    centerId: selectedCenterId,
    circleId: undefined
  });
  const students = useMemo(() => studentsQ.data?.items ?? [], [studentsQ.data?.items]);

  const createInvoiceM = useCreateFinanceV2InvoiceMutation();

  const profilesQ = useFinanceV2StudentFeeProfilesQuery(
    selectedCenterId,
    selectedStudentId,
    Boolean(feesEnabled && selectedCenterId && selectedStudentId)
  );
  const selectedProfile = useMemo(() => {
    const invoiceDate = /^\d{4}-\d{2}-\d{2}$/.test(invoiceForm.dueDate)
      ? `${invoiceForm.dueDate.slice(0, 7)}-01`
      : null;
    if (!feesEnabled || !selectedCenterId || !selectedStudentId || !invoiceDate) return null;
    const profiles = profilesQ.data?.rows ?? [];
    return profiles.find((p) =>
      p.centerId === selectedCenterId &&
      p.studentId === selectedStudentId &&
      p.isActive &&
      p.startDate.slice(0, 10) <= invoiceDate &&
      (!p.endDate || p.endDate.slice(0, 10) >= invoiceDate)
    ) ?? null;
  }, [feesEnabled, invoiceForm.dueDate, profilesQ.data?.rows, selectedCenterId, selectedStudentId]);

  // auto-fill amount from fee profile
  useEffect(() => {
    if (!selectedProfile) return;
    if (selectedProfile.feeMode === "PLAN_MONTHLY") {
      setInvoiceForm((prev) => ({ ...prev, amount: String(selectedProfile.tuitionPlan?.monthlyAmount ?? prev.amount) }));
    } else if (selectedProfile.feeMode === "SYMBOLIC_ONE_TIME") {
      setInvoiceForm((prev) => ({ ...prev, amount: String(selectedProfile.symbolicAmount ?? prev.amount) }));
    }
  }, [selectedProfile]);

  const closeInvoiceModal = () => {
    if (createInvoiceM.isPending) return;
    setShowInvoiceForm(false);
    setInvoiceError("");
    onExternalFormClose?.();
  };

  const handleCreateInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    setInvoiceError("");

    try {
      const studentId = posInt(invoiceForm.studentId);
      const selectedCenterId = posInt(invoiceForm.centerId) ?? centerId;
      const amount = Number(invoiceForm.amount);
      const dueDate = new Date(invoiceForm.dueDate);
      const invoiceType =
        invoiceForm.invoiceKind === "REGISTRATION_ONE_TIME" || invoiceForm.invoiceKind === "TUITION_MONTHLY"
          ? (invoiceForm.invoiceKind as any)
          : "OTHER";

      const invalidFieldId = !selectedCenterId
        ? "inv-center"
        : !studentId
          ? "inv-student"
          : !Number.isFinite(amount) || amount <= 0
            ? "inv-amount"
            : !invoiceForm.dueDate || Number.isNaN(dueDate.getTime())
              ? "inv-duedate"
              : null;
      if (invalidFieldId) {
        const message = ar ? "يرجى إكمال الحقول المطلوبة." : "Please complete the required fields.";
        setInvoiceError(message);
        notifyRequiredFields(ar);
        requestAnimationFrame(() => document.getElementById(invalidFieldId)?.focus());
        return;
      }
      const validStudentId = studentId as number;
      const validCenterId = selectedCenterId as number;

      await createInvoiceM.mutateAsync({
        studentId: validStudentId,
        centerId: validCenterId,
        month: dueDate.getMonth() + 1,
        year: dueDate.getFullYear(),
        amount,
        invoiceType,
        dueDate: invoiceForm.dueDate,
        notes: [invoiceForm.description.trim(), invoiceForm.notes.trim()].filter(Boolean).join(" - ") || undefined
      });

      notifySuccess(entityFeedback.success(ar, "create", INVOICE_ENTITY));
      setInvoiceForm((prev) => ({ ...prev, studentId: "", description: "", notes: "" }));
      closeInvoiceModal();
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, { ar, fallback: entityFeedback.error(ar, "create", INVOICE_ENTITY) });
      setInvoiceError(message);
      notifyError(message);
    }
  };

  const handlePrintInvoice = (v: FinanceInvoiceV2) => {
    printFinanceReport({
      title: ar ? "فاتورة مساهمة طالب" : "Student Contribution Invoice",
      subtitle: ar ? `رقم: #${v.id}` : `Invoice #${v.id}`,
      rows: [v],
      columns: [
        { label: ar ? "الطالب" : "Student", render: (row) => row.student?.fullName ?? String(row.studentId) },
        { label: ar ? "المركز" : "Center", render: (row) => row.center?.name ?? "-" },
        { label: ar ? "المبلغ" : "Amount", render: (row) => formatYemeniCurrency(row.amount) },
        { label: ar ? "المدفوع" : "Paid", render: (row) => formatYemeniCurrency(row.totalPaid) },
        { label: ar ? "المتبقي" : "Remaining", render: (row) => formatYemeniCurrency(row.remainingAmount) },
        { label: ar ? "الحالة" : "Status", render: (row) => statusLabels[row.status as InvoiceStatusV2] || row.status },
        { label: ar ? "ملاحظات" : "Notes", render: (row) => row.notes || "-" },
      ],
      kpis: [
        { label: ar ? "إجمالي الفاتورة" : "Total", value: formatYemeniCurrency(v.amount) },
        { label: ar ? "المدفوع" : "Paid", value: formatYemeniCurrency(v.totalPaid) },
        { label: ar ? "المتبقي" : "Remaining", value: formatYemeniCurrency(v.remainingAmount) },
      ],
      ar,
      orientation: "portrait",
    });
  };

  if (invoicesQ.isError) {
    return (
      <ErrorState
        title={ar ? "تعذر تحميل الفواتير" : "Unable to load invoices"}
        description={getLocalizedApiErrorMessage(invoicesQ.error, { ar, fallback: entityFeedback.error(ar, "load", INVOICES_ENTITY) })}
        onRetry={() => void invoicesQ.refetch()}
      />
    );
  }

  return (
    <>
      <Modal
        isOpen={Boolean(showInvoiceForm && isAdmin && feesEnabled !== false)}
        onClose={closeInvoiceModal}
        title={ar ? "إنشاء فاتورة جديدة" : "Create New Invoice"}
        titleIcon={
          <div className="circlemod-head-icon">
            <FileText className="w-4 h-4" />
          </div>
        }
        size="lg"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={closeInvoiceModal} disabled={createInvoiceM.isPending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" form="finance-invoice-form" isLoading={createInvoiceM.isPending} disabled={selectedProfile?.feeMode === "FREE"}>
              {ar ? "حفظ الفاتورة" : "Save Invoice"}
            </Button>
          </div>
        }
      >
        <form id="finance-invoice-form" className="circlemod-form" onSubmit={handleCreateInvoice}>
          {/* Section 1: Student & Center */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <User size={15} className="circlemod-section-icon" />
              <span>{ar ? "بيانات الطالب والمركز" : "Student & Center"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="inv-center">{ar ? "المركز *" : "Center *"}</label>
                <select
                  id="inv-center"
                  className="circlemod-select"
                  value={invoiceForm.centerId}
                  onChange={(event) => setInvoiceForm((prev) => ({ ...prev, centerId: event.target.value, studentId: "" }))}
                  required
                >
                  <option value="">{ar ? "اختر المركز..." : "Select center..."}</option>
                  {(centers || []).map((center) => (
                    <option key={center.id} value={center.id}>{center.name}</option>
                  ))}
                </select>
              </div>
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="inv-student">{ar ? "الطالب *" : "Student *"}</label>
                <select
                  id="inv-student"
                  className="circlemod-select"
                  value={invoiceForm.studentId}
                  onChange={(event) => setInvoiceForm((prev) => ({ ...prev, studentId: event.target.value }))}
                  required
                >
                  <option value="">{ar ? "اختر الطالب..." : "Select student..."}</option>
                  {(students || []).map((student) => (
                    <option key={student.id} value={student.id}>{student.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Fee Details */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <DollarSign size={15} className="circlemod-section-icon" />
              <span>{ar ? "تفاصيل الرسوم" : "Fee Details"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="inv-kind">{ar ? "نوع الرسوم *" : "Fee Type *"}</label>
                <select
                  id="inv-kind"
                  className="circlemod-select"
                  value={invoiceForm.invoiceKind}
                  onChange={(event) => setInvoiceForm((prev) => ({ ...prev, invoiceKind: event.target.value }))}
                  required
                >
                  <option value="REGISTRATION_ONE_TIME">{ar ? "رسوم تسجيل" : "Registration Fee"}</option>
                  <option value="TUITION_MONTHLY">{ar ? "رسوم شهرية" : "Monthly Tuition"}</option>
                  <option value="OTHER">{ar ? "رسوم أخرى" : "Other"}</option>
                </select>
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="inv-amount">{ar ? "المبلغ *" : "Amount *"}</label>
                <input
                  id="inv-amount"
                  className="circlemod-input"
                  type="number"
                  min={1}
                  value={invoiceForm.amount}
                  onChange={(event) => setInvoiceForm((prev) => ({ ...prev, amount: event.target.value }))}
                  placeholder={ar ? "المبلغ" : "Amount"}
                  disabled={Boolean(selectedProfile && selectedProfile.feeMode !== "FREE")}
                  required
                />
                {selectedProfile && selectedProfile.feeMode !== "FREE" && (
                  <p className="text-[10px] text-text-tertiary mt-1 flex items-start gap-1">
                    <AlertCircle size={10} className="mt-0.5 flex-shrink-0" />
                    <span>{ar ? "المبلغ مقفل بناءً على خطة الطالب ولا يمكن تعديله يدوياً." : "Amount is locked based on student's plan and cannot be edited manually."}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="inv-duedate">
                  <Calendar size={12} className="inline-block ml-1 opacity-60" />
                  {ar ? "تاريخ الاستحقاق *" : "Due Date *"}
                </label>
                <input
                  id="inv-duedate"
                  className="circlemod-input"
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(event) => setInvoiceForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {selectedProfile ? (
            <div className="circlemod-section">
              <div className="circlemod-section-head">
                <Receipt size={15} className="circlemod-section-icon" />
                <span>{ar ? "الاشتراك المسموح" : "Authorized Subscription"}</span>
              </div>
              {selectedProfile.feeMode === "FREE" ? (
                <div className="circlemod-error" role="alert">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{ar ? "هذا الطالب معفى من الاشتراكات" : "This student is exempt from subscriptions"}</span>
                </div>
              ) : (
                <div className="text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-lg p-3 flex items-center gap-2">
                  <span className="font-bold">{ar ? "الاشتراك المسموح:" : "Authorized:"}</span>
                  <FinanceMoney amount={selectedProfile.feeMode === "PLAN_MONTHLY" ? (selectedProfile.tuitionPlan?.monthlyAmount ?? 0) : (selectedProfile.symbolicAmount ?? 0)} baseCurrency="YER" />
                  <span className="text-xs opacity-70">({selectedProfile.tuitionPlan?.name ?? (ar ? "مبلغ رمزي" : "Symbolic")})</span>
                </div>
              )}
            </div>
          ) : feesEnabled ? (
            <div className="circlemod-section">
              <div className="circlemod-section-head">
                <Receipt size={15} className="circlemod-section-icon" />
                <span>{ar ? "الاشتراك المسموح" : "Authorized Subscription"}</span>
              </div>
              <p className="text-xs text-text-tertiary px-1">{ar ? "اختر طالباً لعرض الاشتراك المسموح به" : "Select a student to view authorized subscription"}</p>
            </div>
          ) : null}

          {/* Section 3: Notes */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <StickyNote size={15} className="circlemod-section-icon" />
              <span>{ar ? "ملاحظات إضافية" : "Additional Notes"}</span>
              <span className="circlemod-section-hint">{ar ? "اختياري" : "Optional"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="inv-desc">{ar ? "وصف الفاتورة" : "Description"}</label>
                <input
                  id="inv-desc"
                  className="circlemod-input"
                  value={invoiceForm.description}
                  onChange={(event) => setInvoiceForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder={ar ? "وصف الفاتورة" : "Invoice description"}
                />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="inv-notes">{ar ? "ملاحظات" : "Notes"}</label>
                <input
                  id="inv-notes"
                  className="circlemod-input"
                  value={invoiceForm.notes}
                  onChange={(event) => setInvoiceForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder={ar ? "ملاحظات إضافية" : "Additional notes"}
                />
              </div>
            </div>
          </div>

          {invoiceError ? (
            <div className="circlemod-error" role="alert">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{invoiceError}</span>
            </div>
          ) : null}
        </form>
      </Modal>

      {invoicesQ.isLoading ? <FinSkeleton rows={5} /> : null}

      {!invoicesQ.isLoading && invoices.length === 0 ? (
        <EmptyState
          title={ar ? "لا توجد فواتير" : "No invoices"}
          description={ar ? "أنشئ فاتورة جديدة أو غيّر الفلاتر لعرض النتائج." : "Create a new invoice or adjust filters."}
          icon={<Receipt className="w-10 h-10" />}
        />
      ) : null}

      {!invoicesQ.isLoading && invoices.length > 0 ? (
        <div className="animate-premium mt-4">
          <FinanceDataTable<FinanceInvoiceV2>
            rows={pagination.pagedRows}
                columns={[
                  {
                    header: ar ? "الفاتورة" : "ID",
                    render: (v) => <span className="font-bold">#{v.id}</span>
                  },
                  {
                    header: ar ? "الطالب" : "Student",
                    render: (v) => (
                      <div className="flex flex-col">
                        <span className="font-bold text-text-primary">{v.student?.fullName ?? v.studentId}</span>
                        <span className="text-[0.7rem] text-text-tertiary uppercase tracking-wider">{v.center?.name ?? "-"}</span>
                      </div>
                    )
                  },
                  {
                    header: ar ? "تاريخ / نوع" : "Date / Type",
                    render: (v) => (
                      <span className="text-text-tertiary text-xs font-semibold">
                        {FINANCE_YEMEN_MODE ? (v.notes === "رسوم تسجيل" ? (ar ? "رسوم تسجيل" : "Registration") : (ar ? "رسوم دراسية" : "Tuition")) : `${v.month}/${v.year}`}
                      </span>
                    )
                  },
                  {
                    header: ar ? "ملاحظات" : "Notes",
                    render: (v) => <span className="text-xs text-text-tertiary truncate max-w-[120px]" title={v.notes || ""}>{v.notes || "-"}</span>
                  },
                  {
                    header: ar ? "المبلغ" : "Amount",
                    render: (v) => <FinanceMoney amount={v.amount} baseCurrency="YER" />
                  },
                  {
                    header: ar ? "المدفوع" : "Paid",
                    render: (v) => <FinanceMoney amount={v.totalPaid} baseCurrency="YER" className="!text-emerald-600" />
                  },
                  {
                    header: ar ? "المتبقي" : "Remaining",
                    render: (v) => <FinanceMoney amount={v.remainingAmount} baseCurrency="YER" className="!text-rose-600" />
                  },
                  {
                    header: ar ? "الحالة" : "Status",
                    render: (v) => <FinanceStatusBadge status={v.status} label={statusLabels[v.status as InvoiceStatusV2] || v.status} />
                  },
                  {
                    header: ar ? "الإجراءات" : "Actions",
                    render: (v) => (
                      <div className="flex items-center gap-2">
                        <button
                          className="fin-action-btn view"
                          onClick={() => handlePrintInvoice(v)}
                          title={ar ? "طباعة الفاتورة" : "Print Invoice"}
                        >
                          <Printer size={16} />
                        </button>
                        {/* The collect payment button was moved to the top bar */}
                        <button className="fin-action-btn view group" onClick={() => onSelectInvoice(v.id)} title={ar ? "عرض التفاصيل" : "View Details"}>
                          <ArrowRight size={16} className="transition-transform group-hover:translate-x-[-4px] rtl:group-hover:translate-x-[4px]" />
                        </button>
                      </div>
                    )
                  }
                ]}
                rowKey="id"
                className="fin-premium-table"
                rowClassName={(v) => (v.status === 'PAID' ? 'receipt' : v.status === 'PARTIAL' ? 'disbursement' : '')}
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
