import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { DataTable } from "../../../../components/ui/DataTable";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { TableSkeleton } from "../../../../components/ui/Skeleton";
import { getLocalizedApiErrorMessage } from "../../../../shared/api/error";
import { notifyError, notifySuccess } from "../../../../shared/ui/feedback";
import {
  buildPaginationLabels,
  useClientPagination
} from "../../../../shared/ui/useClientPagination";
import { FinanceReasonConfirmModal } from "../FinanceReasonConfirmModal";
import {
  useApproveFinanceV2FundTransferMutation,
  useApproveFinanceV2PayrollBatchMutation,
  useApproveFinanceV2RewardBatchMutation,
  useApproveFinanceV2VoucherMutation,
  useApproveFinanceV2VoucherVoidMutation,
  useFinanceV2ApprovalsQuery,
  useRejectFinanceV2PayrollBatchMutation,
  useRejectFinanceV2RewardBatchMutation,
  useRejectFinanceV2VoucherMutation
} from "../../finance-v2.hooks";
import type {
  FinanceFundTransferV2,
  FinanceVoucherV2,
  PayrollBatchV2,
  RewardBatchV2
} from "../../types";
import { FinEmpty, getYemenModeStatus, money } from "../FinanceShared";

type Props = {
  isSuperAdmin: boolean;
  ar: boolean;
};

type ReasonTarget =
  | { type: "voucher"; id: number }
  | { type: "payroll"; id: number }
  | { type: "reward"; id: number }
  | null;

export default function FinanceApprovalsTab({ isSuperAdmin, ar }: Props) {
  const approvalsQ = useFinanceV2ApprovalsQuery(isSuperAdmin);

  const approveVoucherM = useApproveFinanceV2VoucherMutation();
  const rejectVoucherM = useRejectFinanceV2VoucherMutation();
  const approveVoucherVoidM = useApproveFinanceV2VoucherVoidMutation();

  const approveTransferM = useApproveFinanceV2FundTransferMutation();

  const approvePayrollBatchM = useApproveFinanceV2PayrollBatchMutation();
  const rejectPayrollBatchM = useRejectFinanceV2PayrollBatchMutation();

  const approveRewardBatchM = useApproveFinanceV2RewardBatchMutation();
  const rejectRewardBatchM = useRejectFinanceV2RewardBatchMutation();

  const vouchers = approvalsQ.data?.vouchers ?? [];
  const transfers = approvalsQ.data?.transfers ?? [];
  const payrollBatches = approvalsQ.data?.payrollBatches ?? [];
  const rewardBatches = approvalsQ.data?.rewardBatches ?? [];

  const vouchersPagination = useClientPagination(vouchers);
  const transfersPagination = useClientPagination(transfers);
  const payrollPagination = useClientPagination(payrollBatches);
  const rewardsPagination = useClientPagination(rewardBatches);

  const [reasonTarget, setReasonTarget] = useState<ReasonTarget>(null);
  const [reasonValue, setReasonValue] = useState("");

  const closeReasonModal = () => {
    setReasonTarget(null);
    setReasonValue("");
  };

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
    errorMessage: string
  ) => {
    try {
      await action();
      notifySuccess(successMessage);
      return true;
    } catch (error) {
      notifyError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: errorMessage
        })
      );
      return false;
    }
  };

  const handleConfirmReason = async (reason: string) => {
    if (!reasonTarget) {
      return;
    }

    if (reasonTarget.type === "voucher") {
      const didSucceed = await runAction(
        () => rejectVoucherM.mutateAsync({ voucherId: reasonTarget.id, reason }),
        ar ? "تم رفض السند" : "Voucher rejected successfully",
        ar ? "تعذر رفض السند" : "Failed to reject voucher"
      );
      if (didSucceed) {
        closeReasonModal();
      }
    }

    if (reasonTarget.type === "payroll") {
      const didSucceed = await runAction(
        () => rejectPayrollBatchM.mutateAsync({ batchId: reasonTarget.id, reason }),
        ar ? "تم رفض دفعة الرواتب" : "Payroll batch rejected successfully",
        ar ? "تعذر رفض دفعة الرواتب" : "Failed to reject payroll batch"
      );
      if (didSucceed) {
        closeReasonModal();
      }
    }

    if (reasonTarget.type === "reward") {
      const didSucceed = await runAction(
        () => rejectRewardBatchM.mutateAsync({ batchId: reasonTarget.id, reason }),
        ar ? "تم رفض دفعة المكافآت" : "Reward batch rejected successfully",
        ar ? "تعذر رفض دفعة المكافآت" : "Failed to reject reward batch"
      );
      if (didSucceed) {
        closeReasonModal();
      }
    }
  };

  if (!isSuperAdmin) {
    return <FinEmpty icon={ShieldCheck} text={ar ? "غير مصرح لك" : "Unauthorized"} />;
  }

  const voucherColumns = [
    {
      id: "voucher",
      header: ar ? "السند" : "Voucher",
      cell: (voucher: FinanceVoucherV2) => voucher.voucherNo
    },
    {
      id: "type",
      header: ar ? "النوع" : "Type",
      cell: (voucher: FinanceVoucherV2) => voucher.voucherType
    },
    {
      id: "status",
      header: ar ? "الحالة" : "Status",
      cell: (voucher: FinanceVoucherV2) => getYemenModeStatus(voucher.status, ar)
    },
    {
      id: "amount",
      header: ar ? "المبلغ" : "Amount",
      cell: (voucher: FinanceVoucherV2) => money(voucher.amount, ar)
    },
    {
      id: "actions",
      header: ar ? "الإجراء" : "Action",
      isActions: true,
      cell: (voucher: FinanceVoucherV2) => (
        <div className="fin-inline-actions">
          {voucher.status === "SUBMITTED" ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  void runAction(
                    () => approveVoucherM.mutateAsync({ voucherId: voucher.id }),
                    ar ? "تم اعتماد السند" : "Voucher approved successfully",
                    ar ? "تعذر اعتماد السند" : "Failed to approve voucher"
                  )
                }
              >
                {ar ? "اعتماد" : "Approve"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setReasonTarget({ type: "voucher", id: voucher.id })}
              >
                {ar ? "رفض" : "Reject"}
              </Button>
            </>
          ) : null}
          {voucher.status === "VOID_REQUESTED" ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                void runAction(
                  () => approveVoucherVoidM.mutateAsync({ voucherId: voucher.id }),
                  ar ? "تم اعتماد عكس السند" : "Voucher void approved successfully",
                  ar ? "تعذر اعتماد عكس السند" : "Failed to approve voucher void"
                )
              }
            >
              {ar ? "اعتماد العكس" : "Approve Void"}
            </Button>
          ) : null}
        </div>
      )
    }
  ];

  const transferColumns = [
    {
      id: "transfer",
      header: ar ? "التحويل" : "Transfer",
      cell: (transfer: FinanceFundTransferV2) => `#${transfer.id}`
    },
    {
      id: "from",
      header: ar ? "من" : "From",
      cell: (transfer: FinanceFundTransferV2) => transfer.fromCenter?.name ?? "-"
    },
    {
      id: "to",
      header: ar ? "إلى" : "To",
      cell: (transfer: FinanceFundTransferV2) => transfer.toCenter?.name ?? "-"
    },
    {
      id: "amount",
      header: ar ? "المبلغ" : "Amount",
      cell: (transfer: FinanceFundTransferV2) => money(transfer.amount, ar)
    },
    {
      id: "actions",
      header: ar ? "الإجراء" : "Action",
      isActions: true,
      cell: (transfer: FinanceFundTransferV2) => (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            void runAction(
              () => approveTransferM.mutateAsync({ transferId: transfer.id }),
              ar ? "تم اعتماد التحويل" : "Transfer approved successfully",
              ar ? "تعذر اعتماد التحويل" : "Failed to approve transfer"
            )
          }
        >
          {ar ? "اعتماد" : "Approve"}
        </Button>
      )
    }
  ];

  const payrollColumns = [
    {
      id: "batch",
      header: ar ? "دفعة الرواتب" : "Payroll Batch",
      cell: (batch: PayrollBatchV2) => `#${batch.id}`
    },
    {
      id: "period",
      header: ar ? "الفترة" : "Period",
      cell: (batch: PayrollBatchV2) => `${batch.periodMonth}/${batch.periodYear}`
    },
    {
      id: "center",
      header: ar ? "المركز" : "Center",
      cell: (batch: PayrollBatchV2) => batch.center?.name ?? "-"
    },
    {
      id: "total",
      header: ar ? "الإجمالي" : "Total",
      cell: (batch: PayrollBatchV2) => money(batch.totalNetAmount, ar)
    },
    {
      id: "actions",
      header: ar ? "الإجراء" : "Action",
      isActions: true,
      cell: (batch: PayrollBatchV2) => (
        <div className="fin-inline-actions">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              void runAction(
                () => approvePayrollBatchM.mutateAsync({ batchId: batch.id }),
                ar ? "تم اعتماد دفعة الرواتب" : "Payroll batch approved successfully",
                ar ? "تعذر اعتماد دفعة الرواتب" : "Failed to approve payroll batch"
              )
            }
          >
            {ar ? "اعتماد" : "Approve"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setReasonTarget({ type: "payroll", id: batch.id })}
          >
            {ar ? "رفض" : "Reject"}
          </Button>
        </div>
      )
    }
  ];

  const rewardColumns = [
    {
      id: "batch",
      header: ar ? "دفعة المكافآت" : "Reward Batch",
      cell: (batch: RewardBatchV2) => `#${batch.id}`
    },
    {
      id: "cycle",
      header: ar ? "الدورة" : "Cycle",
      cell: (batch: RewardBatchV2) =>
        batch.cycle === "MONTHLY" ? (ar ? "شهري" : "Monthly") : ar ? "ربع سنوي" : "Quarterly"
    },
    {
      id: "period",
      header: ar ? "الفترة" : "Period",
      cell: (batch: RewardBatchV2) =>
        batch.periodMonth
          ? `${batch.periodMonth}/${batch.periodYear}`
          : `Q${batch.periodQuarter}/${batch.periodYear}`
    },
    {
      id: "total",
      header: ar ? "الإجمالي" : "Total",
      cell: (batch: RewardBatchV2) => money(batch.totalAmount, ar)
    },
    {
      id: "actions",
      header: ar ? "الإجراء" : "Action",
      isActions: true,
      cell: (batch: RewardBatchV2) => (
        <div className="fin-inline-actions">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              void runAction(
                () => approveRewardBatchM.mutateAsync({ batchId: batch.id }),
                ar ? "تم اعتماد دفعة المكافآت" : "Reward batch approved successfully",
                ar ? "تعذر اعتماد دفعة المكافآت" : "Failed to approve reward batch"
              )
            }
          >
            {ar ? "اعتماد" : "Approve"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setReasonTarget({ type: "reward", id: batch.id })}
          >
            {ar ? "رفض" : "Reject"}
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <FinanceReasonConfirmModal
        isOpen={Boolean(reasonTarget)}
        title={ar ? "سبب الرفض" : "Rejection Reason"}
        description={
          ar
            ? "أدخل سبب الرفض قبل متابعة الإجراء."
            : "Provide a rejection reason before continuing."
        }
        value={reasonValue}
        onValueChange={setReasonValue}
        onClose={closeReasonModal}
        onConfirm={handleConfirmReason}
        confirmLabel={ar ? "تأكيد الرفض" : "Confirm Reject"}
        cancelLabel={ar ? "إلغاء" : "Cancel"}
        placeholder={ar ? "اكتب السبب" : "Enter reason"}
        label={ar ? "السبب" : "Reason"}
        isConfirming={
          rejectVoucherM.isPending ||
          rejectPayrollBatchM.isPending ||
          rejectRewardBatchM.isPending
        }
      />

      {approvalsQ.isLoading ? (
        <TableSkeleton rows={4} columns={5} />
      ) : approvalsQ.isError ? (
        <ErrorState
          title={ar ? "تعذر تحميل الاعتمادات" : "Unable to load approvals"}
          description={getLocalizedApiErrorMessage(approvalsQ.error, {
            ar,
            fallback: ar ? "تعذر تحميل الاعتمادات. يرجى المحاولة مرة أخرى." : "Unable to load approvals. Please try again."
          })}
          onRetry={() => void approvalsQ.refetch()}
          retryLabel={ar ? "إعادة المحاولة" : "Retry"}
        />
      ) : (
        <>
          <div className="fin-cards">
            <div className="fin-inv">
              <div className="fin-inv__body">
                <h4 className="fin-inv__student">{ar ? "الإجمالي المعلّق" : "Total Pending"}</h4>
                <span className="fin-inv__center">{approvalsQ.data?.counts.total ?? 0}</span>
              </div>
            </div>
            <div className="fin-inv">
              <div className="fin-inv__body">
                <h4 className="fin-inv__student">{ar ? "السندات" : "Vouchers"}</h4>
                <span className="fin-inv__center">{approvalsQ.data?.counts.vouchers ?? 0}</span>
              </div>
            </div>
            <div className="fin-inv">
              <div className="fin-inv__body">
                <h4 className="fin-inv__student">{ar ? "التحويلات" : "Transfers"}</h4>
                <span className="fin-inv__center">{approvalsQ.data?.counts.transfers ?? 0}</span>
              </div>
            </div>
            <div className="fin-inv">
              <div className="fin-inv__body">
                <h4 className="fin-inv__student">{ar ? "الرواتب/المكافآت" : "Payroll/Rewards"}</h4>
                <span className="fin-inv__center">
                  {(approvalsQ.data?.counts.payrollBatches ?? 0) +
                    (approvalsQ.data?.counts.rewardBatches ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {vouchers.length > 0 ? (
            <DataTable
              columns={voucherColumns}
              rows={vouchersPagination.pagedRows}
              rowKey="id"
              caption={ar ? "اعتمادات السندات" : "Voucher approvals"}
              emptyState={<EmptyState title={ar ? "لا توجد سندات" : "No vouchers"} />}
              pagination={
                vouchersPagination.totalItems > 0
                  ? vouchersPagination.getPaginationProps({
                      labels: buildPaginationLabels(ar),
                      rtl: ar
                    })
                  : undefined
              }
            />
          ) : null}

          {transfers.length > 0 ? (
            <DataTable
              columns={transferColumns}
              rows={transfersPagination.pagedRows}
              rowKey="id"
              caption={ar ? "اعتمادات التحويلات" : "Transfer approvals"}
              emptyState={<EmptyState title={ar ? "لا توجد تحويلات" : "No transfers"} />}
              pagination={
                transfersPagination.totalItems > 0
                  ? transfersPagination.getPaginationProps({
                      labels: buildPaginationLabels(ar),
                      rtl: ar
                    })
                  : undefined
              }
            />
          ) : null}

          {payrollBatches.length > 0 ? (
            <DataTable
              columns={payrollColumns}
              rows={payrollPagination.pagedRows}
              rowKey="id"
              caption={ar ? "اعتمادات الرواتب" : "Payroll approvals"}
              emptyState={<EmptyState title={ar ? "لا توجد دفعات رواتب" : "No payroll batches"} />}
              pagination={
                payrollPagination.totalItems > 0
                  ? payrollPagination.getPaginationProps({
                      labels: buildPaginationLabels(ar),
                      rtl: ar
                    })
                  : undefined
              }
            />
          ) : null}

          {rewardBatches.length > 0 ? (
            <DataTable
              columns={rewardColumns}
              rows={rewardsPagination.pagedRows}
              rowKey="id"
              caption={ar ? "اعتمادات المكافآت" : "Reward approvals"}
              emptyState={<EmptyState title={ar ? "لا توجد دفعات مكافآت" : "No reward batches"} />}
              pagination={
                rewardsPagination.totalItems > 0
                  ? rewardsPagination.getPaginationProps({
                      labels: buildPaginationLabels(ar),
                      rtl: ar
                    })
                  : undefined
              }
            />
          ) : null}

          {vouchers.length === 0 &&
          transfers.length === 0 &&
          payrollBatches.length === 0 &&
          rewardBatches.length === 0 ? (
            <EmptyState
              title={ar ? "لا توجد اعتمادات معلقة" : "No pending approvals"}
              description={
                ar
                  ? "جميع عناصر الاعتماد تمت معالجتها حالياً."
                  : "There are no pending approval items right now."
              }
              icon={<ShieldCheck className="w-10 h-10" />}
            />
          ) : null}
        </>
      )}
    </>
  );
}
