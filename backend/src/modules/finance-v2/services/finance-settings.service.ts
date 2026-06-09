import { Prisma, FinanceAccountType, FinanceMovementDirection, FinanceMovementType, FundTransferStatus, InvoiceStatus, InvoiceType, PaymentMethod, PayrollBatchStatus, PayrollItemStatus, RewardBatchStatus, RewardCycle, RewardItemStatus, Role, VoucherSourceType, VoucherStatus, VoucherType, AuditAction, AuditEntityType, FeeMode } from "@prisma/client";
import { auditLogger } from "../../../shared/audit/audit-log";
import { prisma } from "../../../shared/db/prisma";
import type { ScopeContext } from "../../../shared/types/auth.types";
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

export const financeSettingsService = {
  async getEffectivePolicy(scope: ScopeContext, query: { centerId?: number }) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const [organizationPolicy, centerPolicy] = await Promise.all([
      prisma.financePolicyProfile.findFirst({
        where: {
          organizationId: scope.organizationId,
          centerId: null
        }
      }),
      query.centerId
        ? prisma.financePolicyProfile.findFirst({
            where: {
              organizationId: scope.organizationId,
              centerId: query.centerId
            }
          })
        : Promise.resolve(null)
    ]);

    return normalize({
      organizationId: scope.organizationId,
      centerId: query.centerId ?? null,
      effective: {
        ...DEFAULT_POLICY,
        ...(organizationPolicy
          ? {
              requireTransferAttachment: organizationPolicy.requireTransferAttachment,
              requireApprovalDisbursement: organizationPolicy.requireApprovalDisbursement,
              requireApprovalReceipt: organizationPolicy.requireApprovalReceipt,
              allowFreeStudents: organizationPolicy.allowFreeStudents,
              allowSymbolicOneTimeFee: organizationPolicy.allowSymbolicOneTimeFee,
              allowOverdraft: organizationPolicy.allowOverdraft
            }
          : {}),
        ...(centerPolicy
          ? {
              requireTransferAttachment: centerPolicy.requireTransferAttachment,
              requireApprovalDisbursement: centerPolicy.requireApprovalDisbursement,
              requireApprovalReceipt: centerPolicy.requireApprovalReceipt,
              allowFreeStudents: centerPolicy.allowFreeStudents,
              allowSymbolicOneTimeFee: centerPolicy.allowSymbolicOneTimeFee,
              allowOverdraft: centerPolicy.allowOverdraft
            }
          : {}),
        feesEnabled:
          organizationPolicy?.feesEnabled === true && centerPolicy?.feesEnabled !== false
      },
      organizationPolicy: organizationPolicy ? normalize(organizationPolicy) : null,
      centerPolicy: centerPolicy ? normalize(centerPolicy) : null
    });
  },

  async patchOrganizationPolicy(
    scope: ScopeContext,
    input: {
      feesEnabled?: boolean;
      requireTransferAttachment?: boolean;
      requireApprovalDisbursement?: boolean;
      requireApprovalReceipt?: boolean;
      allowFreeStudents?: boolean;
      allowSymbolicOneTimeFee?: boolean;
      allowOverdraft?: boolean;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.financePolicyProfile.findFirst({
        where: {
          organizationId: scope.organizationId,
          centerId: null
        },
        select: { id: true }
      });

      if (existing) {
        return tx.financePolicyProfile.update({
          where: { id: existing.id },
          data: input
        });
      }

      return tx.financePolicyProfile.create({
        data: {
          organizationId: scope.organizationId,
          centerId: null,
          ...DEFAULT_POLICY,
          ...input
        }
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.SETTINGS,
      entityId: updated.id,
      summary: "تم تحديث سياسة مالية الجمعية",
      metadata: {
        policy: normalize(updated)
      } as Prisma.InputJsonValue
    });

    return normalize(updated);
  },

  async patchCenterPolicy(
    scope: ScopeContext,
    centerId: number,
    input: {
      feesEnabled?: boolean;
      requireTransferAttachment?: boolean;
      requireApprovalDisbursement?: boolean;
      requireApprovalReceipt?: boolean;
      allowFreeStudents?: boolean;
      allowSymbolicOneTimeFee?: boolean;
      allowOverdraft?: boolean;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    const center = await prisma.center.findFirst({
      where: {
        id: centerId,
        organizationId: scope.organizationId
      },
      select: centerCoreSelect
    });
    assertFinanceEntity(center, "Center not found");

    const updated = await prisma.financePolicyProfile.upsert({
      where: {
        organizationId_centerId: {
          organizationId: scope.organizationId,
          centerId
        }
      },
      update: {
        ...input
      },
      create: {
        organizationId: scope.organizationId,
        centerId,
        ...DEFAULT_POLICY,
        ...input,
        feesEnabled: input.feesEnabled ?? null
      }
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.SETTINGS,
      entityId: updated.id,
      centerId,
      summary: "تم تحديث سياسة مالية المركز",
      metadata: {
        centerId,
        policy: normalize(updated)
      } as Prisma.InputJsonValue
    });

    return normalize(updated);
  }
};
