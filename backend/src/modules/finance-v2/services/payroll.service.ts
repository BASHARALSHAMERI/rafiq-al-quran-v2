import { Prisma, FinanceAccountType, FinanceMovementDirection, FinanceMovementType, FundTransferStatus, InvoiceStatus, InvoiceType, PaymentMethod, PayrollBatchStatus, PayrollItemStatus, RewardBatchStatus, RewardCycle, RewardItemStatus, Role, VoucherSourceType, VoucherStatus, VoucherType, VoucherAccountingCategory, AuditAction, AuditEntityType, FeeMode, DeductionEventStatus } from "@prisma/client";
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
import { resolveCurrencyAmountTx, BASE_CURRENCY_CODE } from "./currency-amount.helper";

const resolvePayrollRateToBaseTx = async (
  tx: Tx,
  organizationId: number,
  currencyCode: string,
  effectiveDate: Date
): Promise<number> => {
  const code = currencyCode.trim().toUpperCase();
  if (code === BASE_CURRENCY_CODE) return 1;

  const rate = await tx.exchangeRate.findFirst({
    where: {
      organizationId,
      currencyCode: code,
      effectiveDate: { lte: effectiveDate }
    },
    orderBy: { effectiveDate: "desc" },
    select: { rateToBase: true }
  });

  if (!rate) {
    throw financeV2Domain.financeError(
      `Exchange rate is required for ${code} before payroll can be generated.`,
      400,
      "EXCHANGE_RATE_REQUIRED"
    );
  }

  return Number(rate.rateToBase);
};

export const payrollService = {
  async listPayrollProfiles(
    scope: ScopeContext,
    query: {
      centerId?: number;
      userId?: number;
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
    const where: Prisma.PayrollProfileWhereInput = {
      organizationId: scope.organizationId,
      ...(centerScope?.length ? { centerId: { in: centerScope } } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {})
    };

    const [rows, total] = await Promise.all([
      prisma.payrollProfile.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        select: payrollProfileSelect
      }),
      prisma.payrollProfile.count({ where })
    ]);

    return normalize({
      rows,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    });
  },

  async createPayrollProfile(
    scope: ScopeContext,
    input: {
      centerId?: number;
      userId: number;
      monthlyBaseAmount: number;
      salaryCurrencyCode?: string;
      paymentMethodDefault?: PaymentMethod;
      bankAccountNumber?: string;
      bankName?: string;
      iban?: string;
      salaryGradeId?: number;
      salarySource?: "GRADE" | "OVERRIDE";
      overrideReason?: string;
      effectiveFrom: string;
      effectiveTo?: string;
      isActive?: boolean;
      notes?: string;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);

    if (input.centerId) {
      await ensureFinanceCenter(scope, input.centerId);
    } else if (!scope.allAccess) {
      throw financeV2Domain.financeError(
        "centerId is required for non-super-admin payroll profile creation",
        400,
        "VALIDATION_ERROR"
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: input.userId,
        organizationId: scope.organizationId,
        role: {
          in: [Role.TEACHER, Role.SUPERVISOR, Role.CENTER_ADMIN]
        },
        isActive: true
      },
      select: studentCoreSelect
    });
    assertFinanceEntity(user, "Payroll beneficiary not found");

    const paymentMethodDefault = input.paymentMethodDefault ?? PaymentMethod.CASH;
    const bankAccountNumber = input.bankAccountNumber?.trim() || null;
    const bankName = input.bankName?.trim() || null;
    const iban = input.iban?.trim() || null;
    const salaryCurrencyCode = (input.salaryCurrencyCode ?? "YER").trim().toUpperCase();

    const currencyRecord = await prisma.currency.findFirst({
      where: { organizationId: scope.organizationId, code: salaryCurrencyCode, isActive: true }
    });
    if (!currencyRecord) {
      throw financeV2Domain.financeError(
        `Currency ${salaryCurrencyCode} is not active or does not exist.`,
        400,
        "VALIDATION_ERROR"
      );
    }

    if (paymentMethodDefault === PaymentMethod.TRANSFER && !bankAccountNumber) {
      throw financeV2Domain.financeError(
        "bankAccountNumber is required when paymentMethodDefault is TRANSFER",
        400,
        "VALIDATION_ERROR"
      );
    }

    const resolvedSalarySource = input.salarySource ?? "GRADE";
    if (resolvedSalarySource === "OVERRIDE" && !input.overrideReason?.trim()) {
      throw financeV2Domain.financeError(
        "overrideReason is required when salarySource is OVERRIDE",
        400,
        "VALIDATION_ERROR"
      );
    }

    const profile = await prisma.payrollProfile.create({
      data: {
        organizationId: scope.organizationId,
        centerId: input.centerId ?? null,
        userId: input.userId,
        monthlyBaseAmount: financeV2Domain.toDecimal(input.monthlyBaseAmount),
        salaryCurrencyCode,
        paymentMethodDefault,
        bankAccountNumber,
        bankName,
        iban,
        salaryGradeId: input.salaryGradeId ?? null,
        salarySource: resolvedSalarySource,
        overrideReason: resolvedSalarySource === "OVERRIDE" ? (input.overrideReason?.trim() || null) : null,
        effectiveFrom:
          requireFinanceEntity(ensureDate(input.effectiveFrom), "effectiveFrom is invalid"),
        effectiveTo: ensureDate(input.effectiveTo) ?? null,
        isActive: input.isActive ?? true,
        notes: input.notes?.trim() || null
      },
      select: payrollProfileSelect
    });

    await addAudit({
      scope,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.PAYROLL_ITEM,
      entityId: profile.id,
      centerId: profile.centerId,
      summary: "تم إنشاء قالب راتب"
    });

    return normalize(profile);
  },

  async updatePayrollProfile(
    scope: ScopeContext,
    profileId: number,
    input: {
      monthlyBaseAmount?: number;
      salaryCurrencyCode?: string;
      paymentMethodDefault?: PaymentMethod;
      bankAccountNumber?: string | null;
      bankName?: string | null;
      iban?: string | null;
      salaryGradeId?: number | null;
      salarySource?: "GRADE" | "OVERRIDE";
      overrideReason?: string | null;
      effectiveFrom?: string;
      effectiveTo?: string | null;
      isActive?: boolean;
      notes?: string | null;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);

    const existing = await prisma.payrollProfile.findFirst({
      where: { id: profileId, organizationId: scope.organizationId },
      select: payrollProfileSelect
    });
    assertFinanceEntity(existing, "Payroll profile not found");
    if (!scope.allAccess && existing.centerId === null) {
      throw financeV2Domain.financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
    }
    financeV2Domain.ensureCenterAllowed(scope, existing.centerId);

    const nextPaymentMethod = input.paymentMethodDefault ?? existing.paymentMethodDefault;
    const nextBankAccountNumber =
      input.bankAccountNumber !== undefined
        ? input.bankAccountNumber?.trim() || null
        : existing.bankAccountNumber;
    const nextSalaryCurrencyCode = (
      input.salaryCurrencyCode ?? existing.salaryCurrencyCode ?? "YER"
    )
      .trim()
      .toUpperCase();

    const currencyRecord = await prisma.currency.findFirst({
      where: { organizationId: scope.organizationId, code: nextSalaryCurrencyCode, isActive: true }
    });
    if (!currencyRecord) {
      throw financeV2Domain.financeError(
        `Currency ${nextSalaryCurrencyCode} is not active or does not exist.`,
        400,
        "VALIDATION_ERROR"
      );
    }

    if (nextPaymentMethod === PaymentMethod.TRANSFER && !nextBankAccountNumber) {
      throw financeV2Domain.financeError(
        "bankAccountNumber is required when paymentMethodDefault is TRANSFER",
        400,
        "VALIDATION_ERROR"
      );
    }

    const updated = await prisma.payrollProfile.update({
      where: { id: existing.id },
      data: {
        ...(input.monthlyBaseAmount !== undefined
          ? { monthlyBaseAmount: financeV2Domain.toDecimal(input.monthlyBaseAmount) }
          : {}),
        ...(input.salaryCurrencyCode !== undefined
          ? { salaryCurrencyCode: nextSalaryCurrencyCode }
          : {}),
        ...(input.paymentMethodDefault !== undefined
          ? { paymentMethodDefault: input.paymentMethodDefault }
          : {}),
        ...(input.bankAccountNumber !== undefined
          ? { bankAccountNumber: input.bankAccountNumber?.trim() || null }
          : {}),
        ...(input.bankName !== undefined ? { bankName: input.bankName?.trim() || null } : {}),
        ...(input.iban !== undefined ? { iban: input.iban?.trim() || null } : {}),
        ...(input.salaryGradeId !== undefined ? { salaryGradeId: input.salaryGradeId } : {}),
        ...(input.salarySource !== undefined ? { salarySource: input.salarySource } : {}),
        ...(input.overrideReason !== undefined
          ? { overrideReason: input.overrideReason?.trim() || null }
          : {}),
        ...(input.effectiveFrom !== undefined
          ? {
              effectiveFrom: requireFinanceEntity(
                ensureDate(input.effectiveFrom),
                "effectiveFrom is invalid"
              )
            }
          : {}),
        ...(input.effectiveTo !== undefined
          ? { effectiveTo: input.effectiveTo ? ensureDate(input.effectiveTo) ?? null : null }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {})
      },
      select: payrollProfileSelect
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.PAYROLL_ITEM,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم تحديث قالب راتب"
    });

    return normalize(updated);
  },

  async listPayrollBatches(
    scope: ScopeContext,
    query: {
      centerId?: number;
      periodYear?: number;
      periodMonth?: number;
      status?: PayrollBatchStatus;
      page?: number;
      pageSize?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const pagination = financeV2Domain.resolvePagination(query.page, query.pageSize);
    const where: Prisma.PayrollBatchWhereInput = {
      organizationId: scope.organizationId,
      ...(centerScope?.length ? { centerId: { in: centerScope } } : {}),
      ...(query.periodYear !== undefined ? { periodYear: query.periodYear } : {}),
      ...(query.periodMonth !== undefined ? { periodMonth: query.periodMonth } : {}),
      ...(query.status ? { status: query.status } : {})
    };

    const [rows, total] = await Promise.all([
      prisma.payrollBatch.findMany({
        where,
        orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        select: payrollBatchSelect
      }),
      prisma.payrollBatch.count({ where })
    ]);

    return normalize({
      rows,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    });
  },

  async getPayrollBatch(scope: ScopeContext, batchId: number) {
    financeV2Domain.assertReadEnabled();

    const batch = await prisma.payrollBatch.findUnique({
      where: {
        id: batchId,
        organizationId: scope.organizationId
      },
      select: payrollBatchSelect
    });

    if (!batch) {
      throw financeV2Domain.financeError("Payroll batch not found", 404, "NOT_FOUND");
    }

    financeV2Domain.ensureCenterAllowed(scope, batch.centerId);

    const userIds = batch.items.map((i) => i.beneficiaryUserId);
    const duplicates = await prisma.payrollItem.findMany({
      where: {
        batchId: { not: batchId },
        beneficiaryUserId: { in: userIds },
        status: "PAID",
        batch: {
          periodYear: batch.periodYear,
          periodMonth: batch.periodMonth,
          organizationId: scope.organizationId,
          status: { notIn: ["REJECTED", "CANCELLED"] }
        }
      },
      select: { beneficiaryUserId: true, batchId: true, voucherId: true }
    });

    const duplicateMap = new Map<number, { batchId: number; voucherId: number | null }>();
    for (const dup of duplicates) {
      duplicateMap.set(dup.beneficiaryUserId, { batchId: dup.batchId, voucherId: dup.voucherId });
    }

    const modifiedBatch = {
      ...batch,
      items: batch.items.map((item) => {
        const dup = duplicateMap.get(item.beneficiaryUserId);
        if (dup) {
          return { ...item, _duplicatePaid: dup };
        }
        return item;
      })
    };

    return modifiedBatch;
  },

  async createPayrollBatch(
    scope: ScopeContext,
    input: {
      centerId?: number;
      periodYear: number;
      periodMonth: number;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    if (input.centerId) {
      await ensureFinanceCenter(scope, input.centerId);
    } else if (!scope.allAccess) {
      throw financeV2Domain.financeError(
        "centerId is required for non-super-admin payroll batch creation",
        400,
        "VALIDATION_ERROR"
      );
    }

    const existingBatch = await prisma.payrollBatch.findFirst({
      where: {
        organizationId: scope.organizationId,
        centerId: input.centerId ?? null,
        periodYear: input.periodYear,
        periodMonth: input.periodMonth,
        status: { in: ["DRAFT", "SUBMITTED", "APPROVED", "IN_PROGRESS", "PARTIALLY_PAID", "PAID", "CLOSED"] }
      }
    });

    if (existingBatch) {
      throw financeV2Domain.financeError(
        "يوجد مسير رواتب نشط لنفس المركز والشهر. لا يمكن إنشاء أكثر من مسير واحد لنفس الفترة.",
        400,
        "DUPLICATE_PAYROLL_BATCH"
      );
    }

    try {
      const batch = await prisma.$transaction(async (tx) => {
        const batchMonthStart = new Date(input.periodYear, input.periodMonth - 1, 1);
        const batchMonthEnd = new Date(input.periodYear, input.periodMonth, 0); // last day

        const profiles = await tx.payrollProfile.findMany({
          where: {
            organizationId: scope.organizationId,
            isActive: true,
            effectiveFrom: { lte: batchMonthEnd },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: batchMonthStart } }
            ],
            ...(input.centerId ? { AND: [{ OR: [{ centerId: input.centerId }, { centerId: null }] }] } : {})
          },
          select: { userId: true, centerId: true, monthlyBaseAmount: true, salaryCurrencyCode: true }
        });

        const previouslyLinkedItems = await tx.payrollItem.findMany({
          where: {
            batch: {
              organizationId: scope.organizationId,
              periodYear: input.periodYear,
              periodMonth: input.periodMonth,
              status: { notIn: [PayrollBatchStatus.REJECTED, PayrollBatchStatus.CANCELLED] }
            }
          },
          select: { deductionEventIds: true }
        });
        const usedDeductionEventIds = new Set<number>();
        for (const item of previouslyLinkedItems) {
          if (!Array.isArray(item.deductionEventIds)) continue;
          for (const eventId of item.deductionEventIds) {
            if (typeof eventId === "number") {
              usedDeductionEventIds.add(eventId);
            }
          }
        }

        if (profiles.length) {
          const pendingDeductions = await tx.financeDeductionEvent.count({
            where: {
              organizationId: scope.organizationId,
              userId: { in: profiles.map((profile) => profile.userId) },
              month: input.periodMonth,
              year: input.periodYear,
              status: DeductionEventStatus.DEDUCTION_PENDING,
              ...(input.centerId ? { centerId: input.centerId } : {})
            }
          });

          if (pendingDeductions > 0) {
            throw financeV2Domain.financeError(
              "توجد استقطاعات معلقة لهذه الفترة. يجب اعتمادها قبل إنشاء دفعة الرواتب.",
              400,
              "PENDING_DEDUCTIONS_EXIST"
            );
          }
        }

        const approvedDeductionEvents = profiles.length
          ? await tx.financeDeductionEvent.findMany({
              where: {
                organizationId: scope.organizationId,
                userId: { in: profiles.map((profile) => profile.userId) },
                month: input.periodMonth,
                year: input.periodYear,
                status: DeductionEventStatus.DEDUCTION_APPROVED,
                ...(input.centerId ? { centerId: input.centerId } : {})
              },
              select: { id: true, userId: true, calculatedAmount: true }
            })
          : [];

        const deductionsByUser = new Map<number, { amount: Prisma.Decimal; eventIds: number[] }>();
        for (const event of approvedDeductionEvents) {
          if (usedDeductionEventIds.has(event.id)) continue;
          const current = deductionsByUser.get(event.userId) ?? { amount: new Prisma.Decimal(0), eventIds: [] };
          current.amount = current.amount.plus(event.calculatedAmount);
          current.eventIds.push(event.id);
          deductionsByUser.set(event.userId, current);
        }

        const sarDeductionRateToBase =
          approvedDeductionEvents.length > 0
            ? new Prisma.Decimal(
                await resolvePayrollRateToBaseTx(
                  tx,
                  scope.organizationId,
                  "SAR",
                  batchMonthEnd
                )
              )
            : new Prisma.Decimal(1);

        const created = await tx.payrollBatch.create({
          data: {
            organizationId: scope.organizationId,
            centerId: input.centerId ?? null,
            periodYear: input.periodYear,
            periodMonth: input.periodMonth,
            status: PayrollBatchStatus.DRAFT
          },
          select: { id: true }
        });

        if (profiles.length) {
          const payrollItemsData = await Promise.all(
            profiles.map(async (profile) => {
              const salaryCurrencyCode = (profile.salaryCurrencyCode ?? BASE_CURRENCY_CODE)
                .trim()
                .toUpperCase();
              const exchangeRateToBase = await resolvePayrollRateToBaseTx(
                tx,
                scope.organizationId,
                salaryCurrencyCode,
                batchMonthEnd
              );
              const resolvedSalary = await resolveCurrencyAmountTx(tx, scope.organizationId, {
                originalAmount: Number(profile.monthlyBaseAmount),
                originalCurrencyCode: salaryCurrencyCode,
                exchangeRateToBase
              });
              const attendanceDeductions = deductionsByUser.get(profile.userId);
              const deductionAmount = (attendanceDeductions?.amount ?? new Prisma.Decimal(0)).mul(
                sarDeductionRateToBase
              );
              const bonusAmount = new Prisma.Decimal(0);

              // FA-CENTER-FINANCIAL-TRACKING-1: carry the employee's center
              // from their PayrollProfile so cost is tracked per center.
              // TODO: multi-center salary distribution is not supported yet.
              const itemCenterId = profile.centerId ?? input.centerId ?? null;

              return {
                batchId: created.id,
                beneficiaryUserId: profile.userId,
                centerId: itemCenterId,
                baseAmount: resolvedSalary.amount,
                originalAmount: resolvedSalary.originalAmount,
                originalCurrencyCode: resolvedSalary.originalCurrencyCode,
                exchangeRateToBase: resolvedSalary.exchangeRateToBase,
                bonusAmount,
                deductionAmount,
                deductionEventIds: attendanceDeductions?.eventIds.length
                  ? attendanceDeductions.eventIds
                  : undefined,
                netAmount: resolvedSalary.amount.plus(bonusAmount).minus(deductionAmount),
                status: PayrollItemStatus.PENDING
              };
            })
          );

          await tx.payrollItem.createMany({
            data: payrollItemsData
          });

          const lockedEventIds = Array.from(deductionsByUser.values()).flatMap((v) => v.eventIds);
          if (lockedEventIds.length > 0) {
            await tx.financeDeductionEvent.updateMany({
              where: { id: { in: lockedEventIds } },
              data: {
                status: DeductionEventStatus.DEDUCTION_INCLUDED_IN_PAYROLL,
                payrollBatchId: created.id
              }
            });
          }
        }

        const totals = await tx.payrollItem.aggregate({
          where: { batchId: created.id },
          _sum: { netAmount: true },
          _count: { _all: true }
        });

        return tx.payrollBatch.update({
          where: { id: created.id },
          data: {
            totalItems: totals._count._all,
            totalNetAmount: totals._sum.netAmount ?? new Prisma.Decimal(0)
          },
          select: payrollBatchSelect
        });
      });

      await addAudit({
        scope,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.PAYROLL_BATCH,
        entityId: batch.id,
        centerId: batch.centerId,
        summary: "تم إنشاء دفعة رواتب شهرية"
      });

      return normalize(batch);
    } catch (error) {
      mapUniqueConflict(
        error,
        "INVALID_STATE_TRANSITION",
        input.centerId
          ? "Payroll batch already exists for this center and month"
          : "Payroll batch already exists for this organization and month"
      );
      throw error;
    }
  },

  async submitPayrollBatch(scope: ScopeContext, batchId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const batch = await tx.payrollBatch.findFirst({
        where: { id: batchId, organizationId: scope.organizationId },
        select: payrollBatchSelect
      });
      assertFinanceEntity(batch, "Payroll batch not found");
      financeV2Domain.ensureCenterAllowed(scope, batch.centerId);
      financeV2Domain.assertPayrollBatchTransition(batch.status, PayrollBatchStatus.SUBMITTED);

      return tx.payrollBatch.update({
        where: { id: batch.id },
        data: { status: PayrollBatchStatus.SUBMITTED, submittedAt: new Date() },
        select: payrollBatchSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.PAYROLL_BATCH,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم إرسال دفعة رواتب للاعتماد"
    });

    return normalize(updated);
  },

  async approvePayrollBatch(scope: ScopeContext, batchId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const batch = await tx.payrollBatch.findFirst({
        where: { id: batchId, organizationId: scope.organizationId },
        select: payrollBatchSelect
      });
      assertFinanceEntity(batch, "Payroll batch not found");
      financeV2Domain.assertPayrollBatchTransition(batch.status, PayrollBatchStatus.APPROVED);

      return tx.payrollBatch.update({
        where: { id: batch.id },
        data: {
          status: PayrollBatchStatus.APPROVED,
          approvedById: scope.userId,
          approvedAt: new Date()
        },
        select: payrollBatchSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.PAYROLL_BATCH,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم اعتماد دفعة رواتب"
    });

    return normalize(updated);
  },

  async rejectPayrollBatch(scope: ScopeContext, batchId: number, input: { comment?: string; reason?: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);

    const updated = await prisma.$transaction(async (tx) => {
      const batch = await tx.payrollBatch.findFirst({
        where: { id: batchId, organizationId: scope.organizationId },
        select: payrollBatchSelect
      });
      assertFinanceEntity(batch, "Payroll batch not found");
      financeV2Domain.assertPayrollBatchTransition(batch.status, PayrollBatchStatus.REJECTED);

      return tx.payrollBatch.update({
        where: { id: batch.id },
        data: {
          status: PayrollBatchStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: input.reason?.trim() || input.comment?.trim() || "Rejected"
        },
        select: payrollBatchSelect
      });
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.PAYROLL_BATCH,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم رفض دفعة رواتب"
    });

    return normalize(updated);
  },

  async payPayrollBatch(
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
        const batch = await tx.payrollBatch.findFirst({
          where: { id: batchId, organizationId: scope.organizationId },
          select: payrollBatchSelect
        });
        assertFinanceEntity(batch, "Payroll batch not found");
        financeV2Domain.ensureCenterAllowed(scope, batch.centerId);

        if (
          batch.status !== PayrollBatchStatus.APPROVED &&
          batch.status !== PayrollBatchStatus.IN_PROGRESS &&
          batch.status !== PayrollBatchStatus.PARTIALLY_PAID
        ) {
          throw financeV2Domain.financeError(
            "Payroll batch is not payable in current state",
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
          const item = await tx.payrollItem.findFirst({
            where: { id: paymentInput.itemId, batchId: batch.id },
            select: {
              id: true,
              centerId: true,
              netAmount: true,
              originalCurrencyCode: true,
              exchangeRateToBase: true,
              status: true,
              voucherId: true,
              beneficiaryUserId: true
            }
          });
          if (!item) throw financeV2Domain.financeError("Payroll item not found", 404, "ENTITY_NOT_FOUND");
          
          if (item.status === PayrollItemStatus.PAID || item.voucherId) {
            continue;
          }

          const duplicatePaid = await tx.payrollItem.findFirst({
            where: {
              batchId: { not: batch.id },
              beneficiaryUserId: item.beneficiaryUserId,
              status: "PAID",
              batch: {
                periodYear: batch.periodYear,
                periodMonth: batch.periodMonth,
                organizationId: scope.organizationId,
                status: { notIn: ["REJECTED", "CANCELLED"] }
              }
            }
          });

          if (duplicatePaid) {
            throw financeV2Domain.financeError(
              "تم صرف راتب هذا الموظف مسبقاً في مسير آخر لنفس الفترة.",
              409,
              "DUPLICATE_PAYROLL_PAID"
            );
          }

          assertTransferAttachment({
            method: paymentInput.method,
            attachmentStorageKey: paymentInput.attachmentStorageKey,
            requireTransferAttachment: policy.requireTransferAttachment
          });

          const voucher = await tx.financeVoucher.create({
            data: {
              organizationId: scope.organizationId,
              // FA-CENTER-FINANCIAL-TRACKING-1: prefer item-level center for cost tracking
              centerId: item.centerId ?? batch.centerId,
              accountId: account.id,
              voucherType: VoucherType.DISBURSEMENT,
              voucherNo: await nextVoucherNoTx(tx, "DV", scope.organizationId),
              sourceType: VoucherSourceType.PAYROLL_ITEM,
              sourceId: item.id,
              paymentMethod: paymentInput.method,
              amount: item.netAmount,
              originalAmount:
                item.originalCurrencyCode && item.originalCurrencyCode !== BASE_CURRENCY_CODE && item.exchangeRateToBase
                  ? item.netAmount.div(item.exchangeRateToBase)
                  : item.netAmount,
              originalCurrencyCode: item.originalCurrencyCode ?? BASE_CURRENCY_CODE,
              exchangeRateToBase: item.exchangeRateToBase ?? new Prisma.Decimal(1),
              status: VoucherStatus.APPROVED,
              accountingCategory: "PAYROLL" as VoucherAccountingCategory,
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
            movementType: FinanceMovementType.PAYROLL_PAYOUT,
            allowOverdraft: policy.allowOverdraft
          });

          await accountingService.postDisbursementVoucherJournalEntryTx(tx, scope, {
            voucherId: voucher.id,
            postedById: scope.userId
          });

          await tx.payrollItem.update({
            where: { id: item.id },
            data: {
              status: PayrollItemStatus.PAID,
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

        const paidItems = await tx.payrollItem.count({
          where: { batchId: batch.id, status: PayrollItemStatus.PAID }
        });
        const totalItems = await tx.payrollItem.count({ where: { batchId: batch.id } });
        const nextStatus = deriveBatchStatus({ total: totalItems, paid: paidItems });

        await tx.payrollBatch.update({ where: { id: batch.id }, data: { status: nextStatus } });
        const refreshed = await tx.payrollBatch.findUnique({
          where: { id: batch.id },
          select: payrollBatchSelect
        });
        return normalize(requireFinanceEntity(refreshed, "Payroll batch not found"));
      });

      await addAudit({
        scope,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.PAYROLL_BATCH,
        entityId: result.id,
        centerId: result.centerId as number | null,
        summary: "تم دفع عناصر دفعة رواتب"
      });

      return result;
    } catch (error) {
      mapUniqueConflict(error, "VOUCHER_NUMBER_CONFLICT", "Voucher number conflict");
      throw error;
    }
  },

  async failPayrollItem(scope: ScopeContext, itemId: number, input: { failureReason: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanExecute(scope);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.payrollItem.findFirst({
        where: {
          id: itemId,
          batch: { organizationId: scope.organizationId }
        },
        select: {
          id: true,
          status: true,
          voucherId: true,
          batch: { select: { id: true, centerId: true, status: true } }
        }
      });
      assertFinanceEntity(item, "Payroll item not found");
      financeV2Domain.ensureCenterAllowed(scope, item.batch.centerId);

      if (item.status === PayrollItemStatus.PAID || item.voucherId) {
        throw financeV2Domain.financeError("Paid payroll item cannot be marked failed", 409, "INVALID_STATE_TRANSITION");
      }

      if (
        item.batch.status !== PayrollBatchStatus.APPROVED &&
        item.batch.status !== PayrollBatchStatus.IN_PROGRESS &&
        item.batch.status !== PayrollBatchStatus.PARTIALLY_PAID
      ) {
        throw financeV2Domain.financeError(
          "Payroll item is not payable in current batch state",
          409,
          "INVALID_STATE_TRANSITION"
        );
      }

      await tx.payrollItem.update({
        where: { id: item.id },
        data: {
          status: PayrollItemStatus.FAILED,
          failureReason: input.failureReason.trim(),
          paymentMethod: null,
          paymentReference: null,
          paidAt: null
        }
      });

      const paidItems = await tx.payrollItem.count({
        where: { batchId: item.batch.id, status: PayrollItemStatus.PAID }
      });
      const totalItems = await tx.payrollItem.count({ where: { batchId: item.batch.id } });
      const nextStatus = deriveBatchStatus({ total: totalItems, paid: paidItems });

      await tx.payrollBatch.update({ where: { id: item.batch.id }, data: { status: nextStatus } });
      const refreshed = await tx.payrollBatch.findUnique({
        where: { id: item.batch.id },
        select: payrollBatchSelect
      });
      return normalize(requireFinanceEntity(refreshed, "Payroll batch not found"));
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.PAYROLL_BATCH,
      entityId: result.id,
      centerId: result.centerId as number | null,
      summary: "تم تسجيل فشل صرف راتب موظف"
    });

    return result;
  },

  async listSalaryGrades(
    scope: ScopeContext,
    query: { centerId?: number; isActive?: boolean }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const where: Prisma.SalaryGradeWhereInput = {
      organizationId: scope.organizationId,
      ...(centerScope?.length ? { OR: [{ centerId: { in: centerScope } }, { centerId: null }] } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {})
    };

    const rows = await prisma.salaryGrade.findMany({
      where,
      orderBy: [{ gradeLevel: "asc" }, { jobTitle: "asc" }],
    });

    return normalize(rows);
  },

  async createSalaryGrade(
    scope: ScopeContext,
    input: {
      centerId?: number;
      jobTitle: string;
      gradeLevel: string;
      baseSalary: number;
      currencyCode?: string;
      isActive?: boolean;
      notes?: string;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);

    if (input.centerId) {
      await ensureFinanceCenter(scope, input.centerId);
    } else if (!scope.allAccess) {
      throw financeV2Domain.financeError(
        "centerId is required for non-super-admin salary grade creation",
        400,
        "VALIDATION_ERROR"
      );
    }

    try {
      const currencyCode = (input.currencyCode ?? "YER").trim().toUpperCase();
      const currencyRecord = await prisma.currency.findFirst({
        where: { organizationId: scope.organizationId, code: currencyCode, isActive: true }
      });
      if (!currencyRecord) {
        throw financeV2Domain.financeError(
          `Currency ${currencyCode} is not active or does not exist.`,
          400,
          "VALIDATION_ERROR"
        );
      }

      const grade = await prisma.salaryGrade.create({
        data: {
          organizationId: scope.organizationId,
          centerId: input.centerId ?? null,
          jobTitle: input.jobTitle.trim(),
          gradeLevel: input.gradeLevel.trim(),
          baseSalary: financeV2Domain.toDecimal(input.baseSalary),
          currencyCode,
          isActive: input.isActive ?? true,
          notes: input.notes?.trim() || null
        }
      });
      return normalize(grade);
    } catch (error) {
      mapUniqueConflict(error, "DUPLICATE_SALARY_GRADE", "Salary grade already exists");
      throw error;
    }
  },

  async updateSalaryGrade(
    scope: ScopeContext,
    gradeId: number,
    input: {
      jobTitle?: string;
      gradeLevel?: string;
      baseSalary?: number;
      currencyCode?: string;
      isActive?: boolean;
      notes?: string | null;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);

    const existing = await prisma.salaryGrade.findFirst({
      where: { id: gradeId, organizationId: scope.organizationId }
    });
    assertFinanceEntity(existing, "Salary grade not found");
    if (!scope.allAccess && existing.centerId === null) {
      throw financeV2Domain.financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
    }
    financeV2Domain.ensureCenterAllowed(scope, existing.centerId);

    try {
      let nextCurrencyCode = undefined;
      if (input.currencyCode !== undefined) {
        nextCurrencyCode = input.currencyCode.trim().toUpperCase();
        const currencyRecord = await prisma.currency.findFirst({
          where: { organizationId: scope.organizationId, code: nextCurrencyCode, isActive: true }
        });
        if (!currencyRecord) {
          throw financeV2Domain.financeError(
            `Currency ${nextCurrencyCode} is not active or does not exist.`,
            400,
            "VALIDATION_ERROR"
          );
        }
      }

      const updated = await prisma.salaryGrade.update({
        where: { id: existing.id },
        data: {
          ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle.trim() } : {}),
          ...(input.gradeLevel !== undefined ? { gradeLevel: input.gradeLevel.trim() } : {}),
          ...(input.baseSalary !== undefined ? { baseSalary: financeV2Domain.toDecimal(input.baseSalary) } : {}),
          ...(nextCurrencyCode !== undefined ? { currencyCode: nextCurrencyCode } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {})
        }
      });
      return normalize(updated);
    } catch (error) {
      mapUniqueConflict(error, "DUPLICATE_SALARY_GRADE", "Salary grade already exists");
      throw error;
    }
  },

  // HR-PAYROLL-UX-COMPLETE: list staff users eligible for payroll assignment
  async getEligibleEmployees(
    scope: ScopeContext,
    query: { centerId?: number; search?: string }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);

    const searchTerm = query.search?.trim();

    const rows = await prisma.user.findMany({
      where: {
        organizationId: scope.organizationId,
        isActive: true,
        role: { in: [Role.TEACHER, Role.SUPERVISOR, Role.CENTER_ADMIN] },
        ...(searchTerm
          ? {
              OR: [
                { fullName: { contains: searchTerm } },
                { username: { contains: searchTerm } }
              ]
            }
          : {})
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        username: true
      },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
      take: 100
    });

    return normalize(
      rows.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        role: u.role,
        username: u.username ?? null,
        phone: null as string | null,
        center: null as { id: number; name: string } | null
      }))
    );
  }
};
