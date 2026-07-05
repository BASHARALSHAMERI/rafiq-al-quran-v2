import { Prisma, FinanceAccountType, FinanceMovementDirection, FinanceMovementType, FundTransferStatus, InvoiceStatus, InvoiceType, PaymentMethod, PayrollBatchStatus, PayrollItemStatus, RewardBatchStatus, RewardCycle, RewardItemStatus, RewardType, Role, VoucherAccountingCategory, VoucherSourceType, VoucherStatus, VoucherType, AuditAction, AuditEntityType, FeeMode } from "@prisma/client";
import { auditLogger } from "../../../shared/audit/audit-log";
import { prisma } from "../../../shared/db/prisma";
import type { ScopeContext } from "../../../shared/types/auth.types";
import { accountingService } from "../../accounting/accounting.service";
import { financeV2Domain } from "../finance-v2.domain";
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

export const rewardsService = {
  async listRewardProfiles(
    scope: ScopeContext,
    query: {
      centerId?: number;
      beneficiaryUserId?: number;
      cycle?: RewardCycle;
      rewardType?: RewardType;
      isActive?: boolean;
      page?: number;
      pageSize?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const pagination = financeV2Domain.resolvePagination(query.page, query.pageSize);
    const where: Prisma.RewardProfileWhereInput = {
      organizationId: scope.organizationId,
      ...(centerScope?.length ? { OR: [{ centerId: { in: centerScope } }, { centerId: null }] } : {}),
      ...(query.beneficiaryUserId ? { beneficiaryUserId: query.beneficiaryUserId } : {}),
      ...(query.cycle ? { cycle: query.cycle } : {}),
      ...(query.rewardType ? { rewardType: query.rewardType } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {})
    };

    const [rows, total] = await Promise.all([
      prisma.rewardProfile.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        select: rewardProfileSelect
      }),
      prisma.rewardProfile.count({ where })
    ]);

    return normalize({
      rows,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    });
  },

  async createRewardProfile(
    scope: ScopeContext,
    input: {
      centerId?: number;
      beneficiaryUserId: number;
      beneficiaryRole: "TEACHER" | "STUDENT";
      cycle: RewardCycle;
      rewardType?: RewardType;
      defaultAmount: number;
      effectiveFrom: string;
      effectiveTo?: string;
      isActive?: boolean;
      notes?: string;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);
    financeV2Domain.ensureCenterAllowed(scope, input.centerId);
    if (input.centerId) {
      await ensureFinanceCenter(scope, input.centerId);
    }

    const role = input.beneficiaryRole === "TEACHER" ? Role.TEACHER : Role.STUDENT;
    const beneficiary = await prisma.user.findFirst({
      where: {
        id: input.beneficiaryUserId,
        organizationId: scope.organizationId,
        role,
        isActive: true
      },
      select: studentCoreSelect
    });
    assertFinanceEntity(beneficiary, "Reward beneficiary not found");

    const profile = await prisma.rewardProfile.create({
      data: {
        organizationId: scope.organizationId,
        centerId: input.centerId ?? null,
        beneficiaryUserId: input.beneficiaryUserId,
        beneficiaryRole: input.beneficiaryRole,
        cycle: input.cycle,
        rewardType: input.rewardType ?? null,
        defaultAmount: financeV2Domain.toDecimal(input.defaultAmount),
        effectiveFrom:
          requireFinanceEntity(ensureDate(input.effectiveFrom), "effectiveFrom is invalid"),
        effectiveTo: ensureDate(input.effectiveTo) ?? null,
        isActive: input.isActive ?? true,
        notes: input.notes?.trim() || null
      },
      select: rewardProfileSelect
    });

    await addAudit({
      scope,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.REWARD_ITEM,
      entityId: profile.id,
      centerId: profile.centerId,
      summary: "تم إنشاء قالب إكرامية"
    });

    return normalize(profile);
  },

  async listRewardBatches(
    scope: ScopeContext,
    query: {
      centerId?: number;
      cycle?: RewardCycle;
      rewardType?: RewardType;
      periodYear?: number;
      periodMonth?: number;
      periodQuarter?: number;
      status?: RewardBatchStatus;
      page?: number;
      pageSize?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const pagination = financeV2Domain.resolvePagination(query.page, query.pageSize);
    const where: Prisma.RewardBatchWhereInput = {
      organizationId: scope.organizationId,
      ...(centerScope?.length ? { OR: [{ centerId: { in: centerScope } }, { centerId: null }] } : {}),
      ...(query.cycle ? { cycle: query.cycle } : {}),
      ...(query.rewardType ? { rewardType: query.rewardType } : {}),
      ...(query.periodYear !== undefined ? { periodYear: query.periodYear } : {}),
      ...(query.periodMonth !== undefined ? { periodMonth: query.periodMonth } : {}),
      ...(query.periodQuarter !== undefined ? { periodQuarter: query.periodQuarter } : {}),
      ...(query.status ? { status: query.status } : {})
    };

    const [rows, total] = await Promise.all([
      prisma.rewardBatch.findMany({
        where,
        orderBy: [{ periodYear: "desc" }, { createdAt: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        select: rewardBatchSelect
      }),
      prisma.rewardBatch.count({ where })
    ]);

    return normalize({
      rows,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    });
  },

  async createRewardBatch(
    scope: ScopeContext,
    input: {
      centerId?: number;
      cycle: RewardCycle;
      rewardType?: RewardType;
      periodYear: number;
      periodMonth?: number;
      periodQuarter?: number;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);
    financeV2Domain.ensureCenterAllowed(scope, input.centerId);

    if (input.cycle === RewardCycle.MONTHLY && !input.periodMonth) {
      throw financeV2Domain.financeError("Monthly cycle requires periodMonth", 400, "VALIDATION_ERROR");
    }
    if (input.cycle === RewardCycle.QUARTERLY && !input.periodQuarter) {
      throw financeV2Domain.financeError(
        "Quarterly cycle requires periodQuarter",
        400,
        "VALIDATION_ERROR"
      );
    }
    if (input.cycle === RewardCycle.ANNUAL && (input.periodMonth || input.periodQuarter)) {
      throw financeV2Domain.financeError("Annual cycle does not accept periodMonth or periodQuarter", 400, "VALIDATION_ERROR");
    }

    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.rewardBatch.create({
        data: {
          organizationId: scope.organizationId,
          centerId: input.centerId ?? null,
          cycle: input.cycle,
          rewardType: input.rewardType ?? null,
          periodYear: input.periodYear,
          periodMonth: input.cycle === RewardCycle.MONTHLY ? input.periodMonth ?? null : null,
          periodQuarter: input.cycle === RewardCycle.QUARTERLY ? input.periodQuarter ?? null : null,
          status: RewardBatchStatus.DRAFT
        },
        select: { id: true }
      });

      const profileFilters: Prisma.RewardProfileWhereInput[] = [];
      if (input.centerId) {
        profileFilters.push({ OR: [{ centerId: input.centerId }, { centerId: null }] });
      }
      if (input.rewardType) {
        profileFilters.push(
          input.rewardType === RewardType.GENERAL
            ? { OR: [{ rewardType: RewardType.GENERAL }, { rewardType: null }] }
            : { rewardType: input.rewardType }
        );
      }

      const profiles = await tx.rewardProfile.findMany({
        where: {
          organizationId: scope.organizationId,
          cycle: input.cycle,
          isActive: true,
          ...(profileFilters.length ? { AND: profileFilters } : {})
        },
        select: {
          centerId: true,
          beneficiaryUserId: true,
          beneficiaryRole: true,
          rewardType: true,
          defaultAmount: true
        }
      });

      const items = profiles
        .map((profile) => ({
          batchId: created.id,
          beneficiaryUserId: profile.beneficiaryUserId,
          beneficiaryRole: profile.beneficiaryRole,
          centerId: input.centerId ?? profile.centerId ?? null,
          circleId: null,
          amount: profile.defaultAmount,
          rankInCircle: null,
          rewardType: profile.rewardType,
          status: RewardItemStatus.PENDING
        }))
        .filter((row): row is Omit<typeof row, "centerId"> & { centerId: number } => row.centerId !== null);

      if (items.length) {
        await tx.rewardItem.createMany({ data: items });
      }

      const totals = await tx.rewardItem.aggregate({
        where: { batchId: created.id },
        _sum: { amount: true },
        _count: { _all: true }
      });

      return tx.rewardBatch.update({
        where: { id: created.id },
        data: {
          totalAmount: totals._sum.amount ?? new Prisma.Decimal(0),
          totalItems: totals._count._all
        },
        select: rewardBatchSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.REWARD_BATCH,
      entityId: batch.id,
      centerId: batch.centerId,
      summary: "تم إنشاء دفعة إكراميات"
    });

    return normalize(batch);
  },

  async submitRewardBatch(scope: ScopeContext, batchId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const batch = await tx.rewardBatch.findFirst({
        where: { id: batchId, organizationId: scope.organizationId },
        select: rewardBatchSelect
      });
      assertFinanceEntity(batch, "Reward batch not found");
      financeV2Domain.ensureCenterAllowed(scope, batch.centerId);
      financeV2Domain.assertRewardBatchTransition(batch.status, RewardBatchStatus.SUBMITTED);

      return tx.rewardBatch.update({
        where: { id: batch.id },
        data: { status: RewardBatchStatus.SUBMITTED, submittedAt: new Date() },
        select: rewardBatchSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.REWARD_BATCH,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم إرسال دفعة إكراميات للاعتماد"
    });

    return normalize(updated);
  },

  async approveRewardBatch(scope: ScopeContext, batchId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const batch = await tx.rewardBatch.findFirst({
        where: { id: batchId, organizationId: scope.organizationId },
        select: rewardBatchSelect
      });
      assertFinanceEntity(batch, "Reward batch not found");
      financeV2Domain.assertRewardBatchTransition(batch.status, RewardBatchStatus.APPROVED);

      return tx.rewardBatch.update({
        where: { id: batch.id },
        data: {
          status: RewardBatchStatus.APPROVED,
          approvedById: scope.userId,
          approvedAt: new Date()
        },
        select: rewardBatchSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.REWARD_BATCH,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم اعتماد دفعة إكراميات"
    });

    return normalize(updated);
  },

  async rejectRewardBatch(scope: ScopeContext, batchId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const batch = await tx.rewardBatch.findFirst({
        where: { id: batchId, organizationId: scope.organizationId },
        select: rewardBatchSelect
      });
      assertFinanceEntity(batch, "Reward batch not found");
      financeV2Domain.assertRewardBatchTransition(batch.status, RewardBatchStatus.REJECTED);

      return tx.rewardBatch.update({
        where: { id: batch.id },
        data: {
          status: RewardBatchStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: input.reason?.trim() || input.comment?.trim() || "Rejected"
        },
        select: rewardBatchSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.REWARD_BATCH,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم رفض دفعة إكراميات"
    });

    return normalize(updated);
  },

  async payRewardBatch(
    scope: ScopeContext,
    batchId: number,
    input: {
      payments: Array<{
        itemId: number;
        manualReferenceNo?: string;
        method: PaymentMethod;
        attachmentStorageKey?: string;
        externalTransferRef?: string;
      }>;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanExecute(scope);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const batch = await tx.rewardBatch.findFirst({
          where: { id: batchId, organizationId: scope.organizationId },
          select: rewardBatchSelect
        });
        assertFinanceEntity(batch, "Reward batch not found");
        financeV2Domain.ensureCenterAllowed(scope, batch.centerId);

        if (
          batch.status !== RewardBatchStatus.APPROVED &&
          batch.status !== RewardBatchStatus.IN_PROGRESS &&
          batch.status !== RewardBatchStatus.PARTIALLY_PAID
        ) {
          throw financeV2Domain.financeError(
            "Reward batch is not payable in current state",
            409,
            "INVALID_STATE_TRANSITION"
          );
        }

        const account = batch.centerId
          ? await ensureCenterFundAccountTx(tx, {
              organizationId: scope.organizationId,
              centerId: batch.centerId
            })
          : await ensureOrgFundAccountTx(tx, scope.organizationId);
        const policy = await getEffectivePolicyTx(tx, {
          organizationId: scope.organizationId,
          centerId: batch.centerId
        });

        for (const paymentInput of input.payments) {
          const item = await tx.rewardItem.findFirst({
            where: { id: paymentInput.itemId, batchId: batch.id },
            select: { id: true, amount: true, status: true, voucherId: true, centerId: true }
          });
          
          if (!item) throw financeV2Domain.financeError("Reward item not found", 404, "ENTITY_NOT_FOUND");
          
          if (item.status === RewardItemStatus.PAID || item.voucherId) {
            continue;
          }
          financeV2Domain.ensureCenterAllowed(scope, item.centerId);

          assertTransferAttachment({
            method: paymentInput.method,
            attachmentStorageKey: paymentInput.attachmentStorageKey,
            requireTransferAttachment: policy.requireTransferAttachment
          });

          const voucher = await tx.financeVoucher.create({
            data: {
              organizationId: scope.organizationId,
              centerId: item.centerId,
              accountId: account.id,
              voucherType: VoucherType.DISBURSEMENT,
              voucherNo: await nextVoucherNoTx(tx, "DV", scope.organizationId),
              sourceType: VoucherSourceType.REWARD_ITEM,
              sourceId: item.id,
              accountingCategory: VoucherAccountingCategory.REWARD,
              paymentMethod: paymentInput.method,
              amount: item.amount,
              status: VoucherStatus.APPROVED,
              attachmentStorageKey: paymentInput.attachmentStorageKey?.trim() || null,
              externalTransferRef: paymentInput.externalTransferRef?.trim() || null,
              manualReferenceNo: paymentInput.manualReferenceNo?.trim() || null,
              createdById: scope.userId,
              approvedById: scope.userId,
              approvedAt: new Date()
            },
            select: voucherSelect
          });

          await postVoucherTx(tx, {
            voucherId: voucher.id,
            postedById: scope.userId,
            movementType: FinanceMovementType.REWARD_PAYOUT,
            allowOverdraft: policy.allowOverdraft
          });

          await accountingService.postDisbursementVoucherJournalEntryTx(tx, scope, {
            voucherId: voucher.id,
            postedById: scope.userId
          });

          await tx.rewardItem.update({
            where: { id: item.id },
            data: {
              status: RewardItemStatus.PAID,
              paymentMethod: paymentInput.method,
              paymentReference:
                paymentInput.externalTransferRef?.trim() ||
                paymentInput.manualReferenceNo?.trim() ||
                null,
              failureReason: null,
              voucherId: voucher.id,
              paidAt: new Date()
            }
          });
        }

        const paidItems = await tx.rewardItem.count({
          where: { batchId: batch.id, status: RewardItemStatus.PAID }
        });
        const totalItems = await tx.rewardItem.count({ where: { batchId: batch.id } });
        const nextStatus = deriveRewardBatchStatus({ total: totalItems, paid: paidItems });

        await tx.rewardBatch.update({ where: { id: batch.id }, data: { status: nextStatus } });
        const refreshed = await tx.rewardBatch.findUnique({
          where: { id: batch.id },
          select: rewardBatchSelect
        });
        return normalize(requireFinanceEntity(refreshed, "Reward batch not found"));
      });

      await addAudit({
        scope,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.REWARD_BATCH,
        entityId: result.id,
        centerId: result.centerId as number | null,
        summary: "تم دفع عناصر دفعة إكراميات"
      });

      return result;
    } catch (error) {
      mapUniqueConflict(error, "VOUCHER_NUMBER_CONFLICT", "Voucher number conflict");
      throw error;
    }
  },

  async failRewardItem(scope: ScopeContext, itemId: number, input: { failureReason: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanExecute(scope);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.rewardItem.findFirst({
        where: {
          id: itemId,
          batch: { organizationId: scope.organizationId }
        },
        select: {
          id: true,
          status: true,
          voucherId: true,
          centerId: true,
          batch: { select: { id: true, centerId: true, status: true } }
        }
      });
      assertFinanceEntity(item, "Reward item not found");
      financeV2Domain.ensureCenterAllowed(scope, item.centerId);

      if (item.status === RewardItemStatus.PAID || item.voucherId) {
        throw financeV2Domain.financeError("Paid reward item cannot be marked failed", 409, "INVALID_STATE_TRANSITION");
      }

      if (
        item.batch.status !== RewardBatchStatus.APPROVED &&
        item.batch.status !== RewardBatchStatus.IN_PROGRESS &&
        item.batch.status !== RewardBatchStatus.PARTIALLY_PAID
      ) {
        throw financeV2Domain.financeError(
          "Reward item is not payable in current batch state",
          409,
          "INVALID_STATE_TRANSITION"
        );
      }

      await tx.rewardItem.update({
        where: { id: item.id },
        data: {
          status: RewardItemStatus.FAILED,
          failureReason: input.failureReason.trim(),
          paymentMethod: null,
          paymentReference: null,
          paidAt: null
        }
      });

      const paidItems = await tx.rewardItem.count({
        where: { batchId: item.batch.id, status: RewardItemStatus.PAID }
      });
      const totalItems = await tx.rewardItem.count({ where: { batchId: item.batch.id } });
      const nextStatus = deriveRewardBatchStatus({ total: totalItems, paid: paidItems });

      await tx.rewardBatch.update({ where: { id: item.batch.id }, data: { status: nextStatus } });
      const refreshed = await tx.rewardBatch.findUnique({
        where: { id: item.batch.id },
        select: rewardBatchSelect
      });
      return normalize(requireFinanceEntity(refreshed, "Reward batch not found"));
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.REWARD_BATCH,
      entityId: result.id,
      centerId: result.centerId as number | null,
      summary: "تم تسجيل فشل صرف مكافأة مستفيد"
    });

    return result;
  }
};
