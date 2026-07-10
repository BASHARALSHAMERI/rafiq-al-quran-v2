import { Prisma, AccountingAccountType, FinanceAccountType, FinanceMovementDirection, FinanceMovementType, FundTransferStatus, InvoiceStatus, InvoiceType, PaymentMethod, PayrollBatchStatus, PayrollItemStatus, RewardBatchStatus, RewardCycle, RewardItemStatus, Role, VoucherAccountingCategory, VoucherSourceType, VoucherStatus, VoucherType, AuditAction, AuditEntityType, FeeMode } from "@prisma/client";
import { auditLogger } from "../../../shared/audit/audit-log";
import { prisma } from "../../../shared/db/prisma";
import type { ScopeContext } from "../../../shared/types/auth.types";
import { accountingService as globalAccountingService } from "../../accounting/accounting.service";
import { financeV2Domain } from "../finance-v2.domain";
import { resolveCurrencyAmountTx } from "./currency-amount.helper";
import {
  DEFAULT_POLICY,
  centerCoreSelect,
  studentCoreSelect,
  invoiceSelect,
  paymentSelect,
  accountSelect,
  voucherSelect,
  movementSelect,
  payrollProfileSelect,
  payrollBatchSelect,
  rewardProfileSelect,
  rewardBatchSelect,
  fundTransferSelect,
  studentFeeProfileSelect,
  normalizeDecimals,
  normalize,
  isKnownPrismaError,
  mapUniqueConflict,
  parseIdempotencyKey,
  calcInvoiceTotals,
  withInvoiceTotals,
  nextVoucherNoTx,
  ensureDate,
  assertTransferAttachment,
  resolveVoucherMovementType,
  getEffectivePolicyTx,
  ensureOrgFundAccountTx,
  ensureCenterFundAccountTx,
  ensureAccountLockTx,
  ensureInvoiceLockTx,
  updateInvoiceStatusTx,
  postVoucherTx,
  requireFinanceEntity,
  ensureVoucherScope,
  ensureFinanceCenter,
  ensureFinanceStudent,
  addAudit,
  deriveBatchStatus,
  deriveRewardBatchStatus,
  assertFinanceEntity,
  Tx
} from "../finance-v2.internal";

export const accountingService = {
  async listAccounts(
    scope: ScopeContext,
    query: {
      centerId?: number;
      accountType?: FinanceAccountType;
      isActive?: boolean;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const where: Prisma.FinanceAccountWhereInput = {
      organizationId: scope.organizationId,
      ...(centerScope?.length ? { OR: [{ centerId: { in: centerScope } }, { centerId: null }] } : {}),
      ...(query.accountType ? { accountType: query.accountType } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {})
    };

    const rows = await prisma.financeAccount.findMany({
      where,
      orderBy: [{ accountType: "asc" }, { centerId: "asc" }, { id: "asc" }],
      select: accountSelect
    });

    return normalize(rows);
  },

  async listAccountMovements(
    scope: ScopeContext,
    accountId: number,
    query: {
      from?: string;
      to?: string;
      movementType?: FinanceMovementType;
      page?: number;
      pageSize?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);

    const account = await prisma.financeAccount.findFirst({
      where: { id: accountId, organizationId: scope.organizationId },
      select: accountSelect
    });
    assertFinanceEntity(account, "Finance account not found");
    financeV2Domain.ensureCenterAllowed(scope, account.centerId);

    const range = financeV2Domain.resolveDateRange(query.from, query.to);
    const pagination = financeV2Domain.resolvePagination(query.page, query.pageSize);

    const where: Prisma.FinanceAccountMovementWhereInput = {
      organizationId: scope.organizationId,
      accountId: account.id,
      ...(query.movementType ? { movementType: query.movementType } : {}),
      ...(range ? { postedAt: { gte: range.from, lte: range.to } } : {})
    };

    const [rows, total] = await Promise.all([
      prisma.financeAccountMovement.findMany({
        where,
        orderBy: [{ postedAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        select: movementSelect
      }),
      prisma.financeAccountMovement.count({ where })
    ]);

    return normalize({
      account,
      rows,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    });
  },

  async updateAccountLedgerAccount(
    scope: ScopeContext,
    accountId: number,
    input: { accountingAccountId: number }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const account = await tx.financeAccount.findFirst({
        where: { id: accountId, organizationId: scope.organizationId },
        select: accountSelect
      });
      assertFinanceEntity(account, "Finance account not found");
      financeV2Domain.ensureCenterAllowed(scope, account.centerId);

      const ledgerAccount = await tx.accountingAccount.findFirst({
        where: {
          id: input.accountingAccountId,
          organizationId: scope.organizationId,
          type: AccountingAccountType.ASSET,
          isActive: true,
          children: { none: { isActive: true } }
        },
        select: { id: true, centerId: true, code: true }
      });
      assertFinanceEntity(ledgerAccount, "Posting asset ledger account not found");
      financeV2Domain.ensureCenterAllowed(scope, ledgerAccount.centerId);

      if (!/^(1110|1120|1130)/.test(ledgerAccount.code)) {
        throw financeV2Domain.financeError(
          "الحساب المختار لا يصلح كصندوق أو حساب بنكي.",
          400,
          "VALIDATION_ERROR"
        );
      }

      return tx.financeAccount.update({
        where: { id: account.id },
        data: { accountingAccountId: ledgerAccount.id },
        select: accountSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.FINANCE_ACCOUNT,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم ربط الحساب المالي بحساب الأستاذ"
    });

    return normalize(updated);
  },

  async listVouchers(
    scope: ScopeContext,
    query: {
      centerId?: number;
      accountId?: number;
      status?: VoucherStatus;
      voucherType?: VoucherType;
      sourceType?: VoucherSourceType;
      page?: number;
      pageSize?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const pagination = financeV2Domain.resolvePagination(query.page, query.pageSize);

    const where: Prisma.FinanceVoucherWhereInput = {
      organizationId: scope.organizationId,
      ...(centerScope?.length ? { centerId: { in: centerScope } } : {}),
      ...(query.accountId ? { accountId: query.accountId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.voucherType ? { voucherType: query.voucherType } : {}),
      ...(query.sourceType ? { sourceType: query.sourceType } : {})
    };

    const [rows, total] = await Promise.all([
      prisma.financeVoucher.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        select: voucherSelect
      }),
      prisma.financeVoucher.count({ where })
    ]);

    return normalize({
      rows,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    });
  },

  async createVoucher(
    scope: ScopeContext,
    input: {
      centerId?: number;
      accountId: number;
      voucherType: VoucherType;
      manualReferenceNo?: string;
      sourceType?: VoucherSourceType;
      sourceId?: number;
      paymentMethod?: PaymentMethod;
      amount: number;
      // FA-UX-4B: optional currency triple. amount remains the YER base amount used by JournalEntry posting.
      originalAmount?: number;
      originalCurrencyCode?: string;
      exchangeRateToBase?: number;
      accountingCategory?: VoucherAccountingCategory;
      voucherDate?: Date;
      attachmentStorageKey?: string;
      externalTransferRef?: string;
      notes?: string;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanExecute(scope);

    try {
      const voucher = await prisma.$transaction(async (tx) => {
        const account = await tx.financeAccount.findFirst({
          where: {
            id: input.accountId,
            organizationId: scope.organizationId,
            isActive: true
          },
          select: accountSelect
        });
        assertFinanceEntity(account, "Finance account not found");

        const centerId = input.centerId ?? account.centerId ?? null;
        financeV2Domain.ensureCenterAllowed(scope, centerId);

        const policy = await getEffectivePolicyTx(tx, {
          organizationId: scope.organizationId,
          centerId
        });
        assertTransferAttachment({
          method: input.paymentMethod,
          attachmentStorageKey: input.attachmentStorageKey,
          requireTransferAttachment: policy.requireTransferAttachment
        });

        // FA-UX-4B: derive YER base amount from the optional currency triple.
        // The journal-entry posting layer is unchanged and continues to use voucher.amount.
        const resolved = await resolveCurrencyAmountTx(tx, scope.organizationId, {
          amount: input.amount,
          originalAmount: input.originalAmount,
          originalCurrencyCode: input.originalCurrencyCode,
          exchangeRateToBase: input.exchangeRateToBase
        });

        const prefix = input.voucherType === VoucherType.RECEIPT ? 'RV' : 'DV';
        const voucherNo = await nextVoucherNoTx(tx, prefix, scope.organizationId);

        return tx.financeVoucher.create({
          data: {
            organizationId: scope.organizationId,
            centerId,
            accountId: account.id,
            voucherType: input.voucherType,
            voucherNo,
            sourceType: input.sourceType ?? VoucherSourceType.MANUAL,
            sourceId: input.sourceId ?? null,
            paymentMethod: input.paymentMethod ?? null,
            amount: resolved.amount,
            originalAmount: resolved.originalAmount,
            originalCurrencyCode: resolved.originalCurrencyCode,
            exchangeRateToBase: resolved.exchangeRateToBase,
            status: VoucherStatus.DRAFT,
            accountingCategory: input.accountingCategory ?? null,
            attachmentStorageKey: input.attachmentStorageKey?.trim() || null,
            externalTransferRef: input.externalTransferRef?.trim() || null,
            manualReferenceNo: input.manualReferenceNo?.trim() || null,
            voucherDate: input.voucherDate ?? null,
            notes: input.notes?.trim() || null,
            createdById: scope.userId
          },
          select: voucherSelect
        });
      });

      await addAudit({
        scope,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.VOUCHER,
        entityId: voucher.id,
        centerId: voucher.centerId,
        summary: "تم إنشاء سند مالي"
      });

      return normalize(voucher);
    } catch (error) {
      mapUniqueConflict(error, "VOUCHER_NUMBER_CONFLICT", "Voucher number conflict");
      throw error;
    }
  },

  async submitVoucher(scope: ScopeContext, voucherId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanExecute(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const voucher = await tx.financeVoucher.findFirst({
        where: { id: voucherId, organizationId: scope.organizationId },
        select: voucherSelect
      });
      assertFinanceEntity(voucher, "Voucher not found");
      ensureVoucherScope(scope, { centerId: voucher.centerId });
      financeV2Domain.assertVoucherTransition(voucher.status, VoucherStatus.SUBMITTED);

      return tx.financeVoucher.update({
        where: { id: voucher.id },
        data: {
          status: VoucherStatus.SUBMITTED,
          submittedAt: new Date(),
          notes: input.comment?.trim() || voucher.notes
        },
        select: voucherSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.VOUCHER,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم إرسال سند للاعتماد"
    });

    return normalize(updated);
  },

  async approveVoucher(scope: ScopeContext, voucherId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const voucher = await tx.financeVoucher.findFirst({
        where: { id: voucherId, organizationId: scope.organizationId },
        select: voucherSelect
      });
      assertFinanceEntity(voucher, "Voucher not found");
      financeV2Domain.assertVoucherTransition(voucher.status, VoucherStatus.APPROVED);

      return tx.financeVoucher.update({
        where: { id: voucher.id },
        data: {
          status: VoucherStatus.APPROVED,
          approvedById: scope.userId,
          approvedAt: new Date(),
          notes: input.comment?.trim() || voucher.notes
        },
        select: voucherSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.VOUCHER,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم اعتماد سند مالي"
    });

    return normalize(updated);
  },

  async rejectVoucher(scope: ScopeContext, voucherId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const voucher = await tx.financeVoucher.findFirst({
        where: { id: voucherId, organizationId: scope.organizationId },
        select: voucherSelect
      });
      assertFinanceEntity(voucher, "Voucher not found");
      financeV2Domain.assertVoucherTransition(voucher.status, VoucherStatus.REJECTED);

      return tx.financeVoucher.update({
        where: { id: voucher.id },
        data: {
          status: VoucherStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: input.reason?.trim() || input.comment?.trim() || "Rejected"
        },
        select: voucherSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.VOUCHER,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم رفض سند مالي"
    });

    return normalize(updated);
  },

  async postVoucher(scope: ScopeContext, voucherId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanExecute(scope);

    const result = await prisma.$transaction(async (tx) => {
      const voucher = await tx.financeVoucher.findFirst({
        where: { id: voucherId, organizationId: scope.organizationId },
        select: voucherSelect
      });
      assertFinanceEntity(voucher, "Voucher not found");
      ensureVoucherScope(scope, { centerId: voucher.centerId });
      financeV2Domain.assertVoucherTransition(voucher.status, VoucherStatus.POSTED);

      const policy = await getEffectivePolicyTx(tx, {
        organizationId: scope.organizationId,
        centerId: voucher.centerId
      });
      if (
        voucher.voucherType === VoucherType.DISBURSEMENT &&
        policy.requireApprovalDisbursement &&
        voucher.status !== VoucherStatus.APPROVED
      ) {
        throw financeV2Domain.financeError("Approval required", 409, "APPROVAL_REQUIRED");
      }
      if (
        voucher.voucherType === VoucherType.RECEIPT &&
        policy.requireApprovalReceipt &&
        voucher.status !== VoucherStatus.APPROVED
      ) {
        throw financeV2Domain.financeError("Approval required", 409, "APPROVAL_REQUIRED");
      }

      const result = await postVoucherTx(tx, {
        voucherId: voucher.id,
        postedById: scope.userId,
        movementType: resolveVoucherMovementType({
          sourceType: voucher.sourceType,
          voucherType: voucher.voucherType
        }),
        allowOverdraft: policy.allowOverdraft
      });

      // FA-3.2.2: Receipt Voucher Posting to Accounting Journal.
      await globalAccountingService.postReceiptVoucherJournalEntryTx(tx, scope, {
        voucherId: voucher.id,
        postedById: scope.userId
      });
      // FA-3.2.3: Disbursement Voucher Posting to Accounting Journal.
      await globalAccountingService.postDisbursementVoucherJournalEntryTx(tx, scope, {
        voucherId: voucher.id,
        postedById: scope.userId
      });

      return result;
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.VOUCHER,
      entityId: result.voucher.id,
      centerId: result.voucher.centerId as number | null,
      summary: "تم ترحيل سند مالي"
    });

    return result;
  },

  async requestVoucherVoid(scope: ScopeContext, voucherId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanExecute(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const voucher = await tx.financeVoucher.findFirst({
        where: { id: voucherId, organizationId: scope.organizationId },
        select: voucherSelect
      });
      assertFinanceEntity(voucher, "Voucher not found");
      ensureVoucherScope(scope, { centerId: voucher.centerId });
      financeV2Domain.assertVoucherTransition(voucher.status, VoucherStatus.VOID_REQUESTED);

      if (voucher.postedAt) {
        await globalAccountingService.ensurePeriodOpenTx(tx, scope.organizationId, voucher.postedAt);
      }

      return tx.financeVoucher.update({
        where: { id: voucher.id },
        data: {
          status: VoucherStatus.VOID_REQUESTED,
          voidRequestedAt: new Date(),
          notes: input.comment?.trim() || voucher.notes
        },
        select: voucherSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.VOUCHER,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم طلب عكس سند مالي"
    });

    return normalize(updated);
  },

  async approveVoucherVoid(scope: ScopeContext, voucherId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    const result = await prisma.$transaction(async (tx) => {
      const voucher = await tx.financeVoucher.findFirst({
        where: { id: voucherId, organizationId: scope.organizationId },
        select: voucherSelect
      });
      assertFinanceEntity(voucher, "Voucher not found");
      financeV2Domain.assertVoucherTransition(voucher.status, VoucherStatus.VOIDED);

      if (voucher.postedAt) {
        await globalAccountingService.ensurePeriodOpenTx(tx, scope.organizationId, voucher.postedAt);
      }

      const originalMovement = await tx.financeAccountMovement.findUnique({
        where: { voucherId: voucher.id },
        select: movementSelect
      });
      assertFinanceEntity(originalMovement, "Posted voucher movement not found");

      const policy = await getEffectivePolicyTx(tx, {
        organizationId: scope.organizationId,
        centerId: voucher.centerId
      });

      const reversalVoucher = await tx.financeVoucher.create({
        data: {
          organizationId: scope.organizationId,
          centerId: voucher.centerId,
          accountId: voucher.accountId,
          voucherType:
            voucher.voucherType === VoucherType.RECEIPT ? VoucherType.DISBURSEMENT : VoucherType.RECEIPT,
          voucherNo: await nextVoucherNoTx(tx, "VOID", scope.organizationId),
          sourceType: VoucherSourceType.MANUAL,
          sourceId: voucher.id,
          paymentMethod: voucher.paymentMethod,
          amount: voucher.amount,
          status: VoucherStatus.APPROVED,
          notes: `Reversal for voucher ${voucher.voucherNo}`,
          createdById: scope.userId,
          approvedById: scope.userId,
          approvedAt: new Date()
        },
        select: voucherSelect
      });

      const postedReversal = await postVoucherTx(tx, {
        voucherId: reversalVoucher.id,
        postedById: scope.userId,
        movementType: FinanceMovementType.VOID_REVERSAL,
        allowOverdraft: policy.allowOverdraft,
        reversalOfMovementId: originalMovement.id
      });

      // FA-UX-3A: Create a reversing JournalEntry in the General Ledger so the
      // void is reflected in Ledger / Trial Balance, not only in FinanceAccountMovement.
      // The reversal is linked to the new reversalVoucher.id (different from the
      // original voucher.id), so the unique(org, sourceType, sourceId) constraint
      // on JournalEntry guarantees we cannot double-post a reversal for the same
      // void. Returns null gracefully if the original voucher never produced a
      // VOUCHER-sourced journal entry (e.g. payment-generated vouchers).
      await globalAccountingService.reverseVoucherJournalEntryTx(tx, scope, {
        originalVoucherId: voucher.id,
        reversalVoucherId: reversalVoucher.id,
        postedById: scope.userId,
        reason: input.reason?.trim() || input.comment?.trim()
      });

      const voidedVoucher = await tx.financeVoucher.update({
        where: { id: voucher.id },
        data: {
          status: VoucherStatus.VOIDED,
          voidedAt: new Date(),
          notes: input.comment?.trim() || voucher.notes
        },
        select: voucherSelect
      });

      return {
        voucher: normalize(voidedVoucher),
        reversalVoucher: postedReversal.voucher,
        reversalMovement: postedReversal.movement
      };
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.VOUCHER,
      entityId: result.voucher.id,
      centerId: result.voucher.centerId as number | null,
      summary: "تم اعتماد عكس سند مالي"
    });

    return result;
  },

  async listFundTransfers(
    scope: ScopeContext,
    query: {
      status?: FundTransferStatus;
      centerId?: number;
      page?: number;
      pageSize?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const pagination = financeV2Domain.resolvePagination(query.page, query.pageSize);

    const where: Prisma.FinanceFundTransferWhereInput = {
      organizationId: scope.organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(centerScope?.length
        ? {
            OR: [{ fromCenterId: { in: centerScope } }, { toCenterId: { in: centerScope } }]
          }
        : {})
    };

    const [rows, total] = await Promise.all([
      prisma.financeFundTransfer.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        select: fundTransferSelect
      }),
      prisma.financeFundTransfer.count({ where })
    ]);

    return normalize({
      rows,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    });
  },

  async createFundTransfer(
    scope: ScopeContext,
    input: {
      fromAccountId: number;
      toAccountId: number;
      amount: number;
      notes?: string;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    if (input.fromAccountId === input.toAccountId) {
      throw financeV2Domain.financeError(
        "From/To accounts cannot be the same",
        400,
        "VALIDATION_ERROR"
      );
    }

    const transfer = await prisma.$transaction(async (tx) => {
      let [fromAccount, toAccount] = await Promise.all([
        tx.financeAccount.findFirst({
          where: { id: input.fromAccountId, organizationId: scope.organizationId, isActive: true },
          select: accountSelect
        }),
        tx.financeAccount.findFirst({
          where: { id: input.toAccountId, organizationId: scope.organizationId, isActive: true },
          select: accountSelect
        })
      ]);

      if (!fromAccount) fromAccount = await ensureOrgFundAccountTx(tx, scope.organizationId) as any;
      if (!toAccount) toAccount = await ensureOrgFundAccountTx(tx, scope.organizationId) as any;

      assertFinanceEntity(fromAccount, "Source account not found");
      assertFinanceEntity(toAccount, "Destination account not found");
      financeV2Domain.ensureCenterAllowed(scope, fromAccount.centerId);
      financeV2Domain.ensureCenterAllowed(scope, toAccount.centerId);

      return tx.financeFundTransfer.create({
        data: {
          organizationId: scope.organizationId,
          fromAccountId: fromAccount.id,
          toAccountId: toAccount.id,
          fromCenterId: fromAccount.centerId,
          toCenterId: toAccount.centerId,
          amount: financeV2Domain.toDecimal(input.amount),
          status: FundTransferStatus.DRAFT,
          requestedById: scope.userId,
          notes: input.notes?.trim() || null
        },
        select: fundTransferSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.FUND_TRANSFER,
      entityId: transfer.id,
      centerId: transfer.toCenterId ?? transfer.fromCenterId,
      summary: "تم إنشاء طلب تحويل صندوق"
    });

    return normalize(transfer);
  },

  async submitFundTransfer(scope: ScopeContext, transferId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const transfer = await tx.financeFundTransfer.findFirst({
        where: { id: transferId, organizationId: scope.organizationId },
        select: fundTransferSelect
      });
      assertFinanceEntity(transfer, "Fund transfer not found");
      financeV2Domain.ensureCenterAllowed(scope, transfer.fromCenterId);
      financeV2Domain.ensureCenterAllowed(scope, transfer.toCenterId);
      financeV2Domain.assertFundTransferTransition(transfer.status, FundTransferStatus.SUBMITTED);

      return tx.financeFundTransfer.update({
        where: { id: transfer.id },
        data: {
          status: FundTransferStatus.SUBMITTED,
          submittedAt: new Date(),
          notes: input.comment?.trim() || transfer.notes
        },
        select: fundTransferSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.FUND_TRANSFER,
      entityId: updated.id,
      centerId: updated.toCenterId ?? updated.fromCenterId,
      summary: "تم إرسال تحويل صندوق للاعتماد"
    });

    return normalize(updated);
  },

  async approveFundTransfer(scope: ScopeContext, transferId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const transfer = await tx.financeFundTransfer.findFirst({
        where: { id: transferId, organizationId: scope.organizationId },
        select: fundTransferSelect
      });
      assertFinanceEntity(transfer, "Fund transfer not found");
      financeV2Domain.assertFundTransferTransition(transfer.status, FundTransferStatus.APPROVED);

      return tx.financeFundTransfer.update({
        where: { id: transfer.id },
        data: {
          status: FundTransferStatus.APPROVED,
          approvedById: scope.userId,
          approvedAt: new Date(),
          notes: input.comment?.trim() || transfer.notes
        },
        select: fundTransferSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.FUND_TRANSFER,
      entityId: updated.id,
      centerId: updated.toCenterId ?? updated.fromCenterId,
      summary: "تم اعتماد تحويل صندوق"
    });

    return normalize(updated);
  },

  async rejectFundTransfer(scope: ScopeContext, transferId: number, input: { reason: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const transfer = await tx.financeFundTransfer.findFirst({
        where: { id: transferId, organizationId: scope.organizationId },
        select: fundTransferSelect
      });
      assertFinanceEntity(transfer, "Fund transfer not found");
      financeV2Domain.assertFundTransferTransition(transfer.status, FundTransferStatus.REJECTED);

      return tx.financeFundTransfer.update({
        where: { id: transfer.id },
        data: {
          status: FundTransferStatus.REJECTED,
          rejectionReason: input.reason.trim(),
          rejectedAt: new Date()
        },
        select: fundTransferSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.FUND_TRANSFER,
      entityId: updated.id,
      centerId: updated.toCenterId ?? updated.fromCenterId,
      summary: "تم رفض تحويل صندوق"
    });

    return normalize(updated);
  },

  async postFundTransfer(scope: ScopeContext, transferId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanExecute(scope);

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.financeFundTransfer.findFirst({
        where: { id: transferId, organizationId: scope.organizationId },
        select: fundTransferSelect
      });
      assertFinanceEntity(transfer, "Fund transfer not found");
      financeV2Domain.assertFundTransferTransition(transfer.status, FundTransferStatus.POSTED);

      const [fromAccount, toAccount] = await Promise.all([
        tx.financeAccount.findUnique({ where: { id: transfer.fromAccountId }, select: accountSelect }),
        tx.financeAccount.findUnique({ where: { id: transfer.toAccountId }, select: accountSelect })
      ]);
      assertFinanceEntity(fromAccount, "Source account not found");
      assertFinanceEntity(toAccount, "Destination account not found");

      const transferPolicy = await getEffectivePolicyTx(tx, {
        organizationId: scope.organizationId,
        centerId: transfer.fromCenterId
      });

      const voucherOut = await tx.financeVoucher.create({
        data: {
          organizationId: scope.organizationId,
          centerId: transfer.fromCenterId,
          accountId: fromAccount.id,
          voucherType: VoucherType.DISBURSEMENT,
          voucherNo: await nextVoucherNoTx(tx, "TRF-OUT", scope.organizationId),
          sourceType: VoucherSourceType.FUND_TRANSFER,
          sourceId: transfer.id,
          paymentMethod: PaymentMethod.TRANSFER,
          amount: transfer.amount,
          status: VoucherStatus.APPROVED,
          notes: transfer.notes,
          createdById: scope.userId,
          approvedById: scope.userId,
          approvedAt: new Date()
        },
        select: voucherSelect
      });

      const voucherIn = await tx.financeVoucher.create({
        data: {
          organizationId: scope.organizationId,
          centerId: transfer.toCenterId,
          accountId: toAccount.id,
          voucherType: VoucherType.RECEIPT,
          voucherNo: await nextVoucherNoTx(tx, "TRF-IN", scope.organizationId),
          sourceType: VoucherSourceType.FUND_TRANSFER,
          sourceId: transfer.id,
          paymentMethod: PaymentMethod.TRANSFER,
          amount: transfer.amount,
          status: VoucherStatus.APPROVED,
          notes: transfer.notes,
          createdById: scope.userId,
          approvedById: scope.userId,
          approvedAt: new Date()
        },
        select: voucherSelect
      });

      const postedOut = await postVoucherTx(tx, {
        voucherId: voucherOut.id,
        postedById: scope.userId,
        movementType: FinanceMovementType.FUND_TRANSFER_OUT,
        allowOverdraft: transferPolicy.allowOverdraft
      });
      const postedIn = await postVoucherTx(tx, {
        voucherId: voucherIn.id,
        postedById: scope.userId,
        movementType: FinanceMovementType.FUND_TRANSFER_IN,
        allowOverdraft: true
      });

      const postedTransfer = await tx.financeFundTransfer.update({
        where: { id: transfer.id },
        data: {
          status: FundTransferStatus.POSTED,
          voucherOutId: voucherOut.id,
          voucherInId: voucherIn.id,
          postedAt: new Date(),
          notes: input.comment?.trim() || transfer.notes
        },
        select: fundTransferSelect
      });
      await globalAccountingService.postFundTransferJournalEntryTx(tx, scope, {
        transferId: transfer.id,
        postedById: scope.userId
      });

      return {
        transfer: normalize(postedTransfer),
        voucherOut: postedOut.voucher,
        voucherIn: postedIn.voucher,
        movementOut: postedOut.movement,
        movementIn: postedIn.movement
      };
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.FUND_TRANSFER,
      entityId: result.transfer.id,
      centerId:
        (result.transfer.toCenterId as number | null) ?? (result.transfer.fromCenterId as number | null),
      summary: "تم ترحيل تحويل صندوق"
    });

    return result;
  }
};
