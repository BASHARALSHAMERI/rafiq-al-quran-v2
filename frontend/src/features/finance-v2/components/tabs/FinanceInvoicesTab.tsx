import { useEffect, useMemo, useState } from "react";
import { Receipt, ArrowRight, Printer, FileText, AlertCircle, User, Calendar, DollarSign, StickyNote, Wallet } from "lucide-react";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { getLocalizedApiErrorMessage } from "../../../../shared/api/error";
import { entityFeedback, notifyError, notifySuccess, type LocalizedLabel } from "../../../../shared/ui/feedback";
import { useUsersQuery } from "../../../users/users.hooks";
import {
  useCreateFinanceV2InvoiceMutation,
  useFinanceV2InvoicesQuery
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
  onExternalFormClose
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

  const studentsQ = useUsersQuery({
    role: "STUDENT",
    centerId: posInt(invoiceForm.centerId) || centerId,
    circleId: undefined
  });
  const students = useMemo(() => studentsQ.data?.items ?? [], [studentsQ.data?.items]);

  const createInvoiceM = useCreateFinanceV2InvoiceMutation();

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

      if (!studentId) throw new Error(ar ? "اختر الطالب" : "Select student");
      if (!selectedCenterId) throw new Error(ar ? "اختر المركز" : "Select center");
      if (!invoiceForm.dueDate || Number.isNaN(dueDate.getTime())) throw new Error(ar ? "تاريخ الاستحقاق غير صحيح" : "Invalid due date");
      if (!Number.isFinite(amount) || amount <= 0) throw new Error(ar ? "مبلغ غير صحيح" : "Invalid amount");

      await createInvoiceM.mutateAsync({
        studentId,
        centerId: selectedCenterId,
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
        isOpen={Boolean(showInvoiceForm && isAdmin)}
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
            <Button type="submit" form="finance-invoice-form" isLoading={createInvoiceM.isPending}>
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
                  required
                />
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
                          onClick={() => window.print()} 
                          title={ar ? "طباعة الفاتورة" : "Print Invoice"}
                        >
                          <Printer size={16} />
                        </button>
                        {v.status !== 'PAID' && (
                          <button 
                            className="fin-action-btn approve" 
                            onClick={() => onSelectInvoice(v.id)}
                            title={ar ? "تحصيل دفعة" : "Collect Payment"}
                          >
                            <Wallet size={16} />
                          </button>
                        )}
                        <button className="fin-action-btn view group" onClick={() => onSelectInvoice(v.id)} title={ar ? "عرض التفاصيل" : "View Details"}>
                          <ArrowRight size={16} className="transition-transform group-hover:translate-x-[-4px] rtl:group-hover:translate-x-[4px]" />
                        </button>
                      </div>
                    )
                  }
                ]}
                rowKey="id"
                className="fin-premium-table"
                rowClassName={(v) => `fin-floating-row ${v.status === 'PAID' ? 'receipt' : v.status === 'PARTIAL' ? 'disbursement' : ''}`}
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
