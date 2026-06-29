import { Prisma, FinanceAccountType, FinanceMovementDirection, FinanceMovementType, FundTransferStatus, InvoiceStatus, InvoiceType, PaymentMethod, PayrollBatchStatus, PayrollItemStatus, RewardBatchStatus, RewardCycle, RewardItemStatus, Role, VoucherSourceType, VoucherStatus, VoucherType, AuditAction, AuditEntityType, FeeMode, TuitionPlanKind } from "@prisma/client";
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
  tuitionPlanSelect,
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

export const billingService = {
  async listStudentFeeProfiles(
    scope: ScopeContext,
    query: {
      centerId?: number;
      studentId?: number;
      feeMode?: FeeMode;
      isActive?: boolean;
      page?: number;
      pageSize?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);
    if (query.studentId) {
      financeV2Domain.ensureStudentAllowed(scope, query.studentId);
    }

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const studentScope = financeV2Domain.resolveStudentScope(scope, query.studentId);
    const pagination = financeV2Domain.resolvePagination(query.page, query.pageSize);

    const where: Prisma.StudentFeeProfileWhereInput = {
      organizationId: scope.organizationId,
      ...(centerScope?.length ? { centerId: { in: centerScope } } : {}),
      ...(studentScope?.length ? { studentId: { in: studentScope } } : {}),
      ...(query.feeMode ? { feeMode: query.feeMode } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {})
    };

    const [rows, total] = await Promise.all([
      prisma.studentFeeProfile.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        select: studentFeeProfileSelect
      }),
      prisma.studentFeeProfile.count({ where })
    ]);

    return normalize({
      rows,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    });
  },

  async createStudentFeeProfile(
    scope: ScopeContext,
    input: {
      centerId: number;
      studentId: number;
      feeMode: FeeMode;
      tuitionPlanId?: number;
      symbolicAmount?: number;
      isActive?: boolean;
      startDate: string;
      endDate?: string;
      notes?: string;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    await ensureFinanceCenter(scope, input.centerId);
    await ensureFinanceStudent(scope, input.studentId);

    if (input.feeMode === FeeMode.PLAN_MONTHLY && !input.tuitionPlanId) {
      throw financeV2Domain.financeError(
        "Monthly fee mode requires tuitionPlanId",
        400,
        "VALIDATION_ERROR"
      );
    }

    if (input.feeMode === FeeMode.SYMBOLIC_ONE_TIME && !input.symbolicAmount) {
      throw financeV2Domain.financeError(
        "Symbolic one-time fee mode requires symbolicAmount",
        400,
        "VALIDATION_ERROR"
      );
    }

    const startDate = ensureDate(input.startDate);
    if (!startDate) {
      throw financeV2Domain.financeError("startDate is required", 400, "VALIDATION_ERROR");
    }
    const endDate = ensureDate(input.endDate);

    const profile = await prisma.studentFeeProfile.create({
      data: {
        organizationId: scope.organizationId,
        centerId: input.centerId,
        studentId: input.studentId,
        feeMode: input.feeMode,
        tuitionPlanId: input.tuitionPlanId ?? null,
        symbolicAmount:
          input.symbolicAmount !== undefined
            ? financeV2Domain.toDecimal(input.symbolicAmount)
            : null,
        isActive: input.isActive ?? true,
        startDate,
        endDate: endDate ?? null,
        notes: input.notes?.trim() || null
      },
      select: studentFeeProfileSelect
    });

    await addAudit({
      scope,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.SETTINGS,
      entityId: profile.id,
      centerId: profile.centerId,
      summary: "تم إنشاء سياسة رسوم طالب",
      metadata: {
        studentFeeProfile: normalize(profile)
      } as Prisma.InputJsonValue
    });

    return normalize(profile);
  },

  async updateStudentFeeProfile(
    scope: ScopeContext,
    profileId: number,
    input: {
      feeMode?: FeeMode;
      tuitionPlanId?: number | null;
      symbolicAmount?: number | null;
      isActive?: boolean;
      startDate?: string;
      endDate?: string | null;
      notes?: string | null;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const existing = await prisma.studentFeeProfile.findFirst({
      where: {
        id: profileId,
        organizationId: scope.organizationId
      },
      select: studentFeeProfileSelect
    });
    assertFinanceEntity(existing, "Student fee profile not found");
    financeV2Domain.ensureCenterAllowed(scope, existing.centerId);

    const feeMode = input.feeMode ?? existing.feeMode;
    const tuitionPlanId =
      input.tuitionPlanId !== undefined ? input.tuitionPlanId : existing.tuitionPlanId;
    const symbolicAmount =
      input.symbolicAmount !== undefined ? input.symbolicAmount : existing.symbolicAmount;

    if (feeMode === FeeMode.PLAN_MONTHLY && !tuitionPlanId) {
      throw financeV2Domain.financeError(
        "Monthly fee mode requires tuitionPlanId",
        400,
        "VALIDATION_ERROR"
      );
    }

    if (feeMode === FeeMode.SYMBOLIC_ONE_TIME && !symbolicAmount) {
      throw financeV2Domain.financeError(
        "Symbolic one-time fee mode requires symbolicAmount",
        400,
        "VALIDATION_ERROR"
      );
    }

    const updated = await prisma.studentFeeProfile.update({
      where: { id: profileId },
      data: {
        ...(input.feeMode !== undefined ? { feeMode: input.feeMode } : {}),
        ...(input.tuitionPlanId !== undefined ? { tuitionPlanId: input.tuitionPlanId } : {}),
        ...(input.symbolicAmount !== undefined
          ? {
              symbolicAmount:
                input.symbolicAmount === null
                  ? null
                  : financeV2Domain.toDecimal(input.symbolicAmount)
            }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.startDate !== undefined
          ? {
              startDate: requireFinanceEntity(ensureDate(input.startDate), "startDate is invalid")
            }
          : {}),
        ...(input.endDate !== undefined
          ? { endDate: input.endDate ? ensureDate(input.endDate) ?? null : null }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {})
      },
      select: studentFeeProfileSelect
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.SETTINGS,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم تحديث سياسة رسوم طالب",
      metadata: {
        before: normalize(existing),
        after: normalize(updated)
      } as Prisma.InputJsonValue
    });

    return normalize(updated);
  },

  async listInvoices(
    scope: ScopeContext,
    query: {
      centerId?: number;
      studentId?: number;
      month?: number;
      year?: number;
      status?: InvoiceStatus;
      invoiceType?: InvoiceType;
      page?: number;
      pageSize?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);
    if (query.studentId) {
      financeV2Domain.ensureStudentAllowed(scope, query.studentId);
    }

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const studentScope = financeV2Domain.resolveStudentScope(scope, query.studentId);
    const pagination = financeV2Domain.resolvePagination(query.page, query.pageSize);

    if (
      (scope.role === Role.PARENT || scope.role === Role.STUDENT) &&
      studentScope &&
      studentScope.length === 0
    ) {
      return { rows: [], total: 0, page: pagination.page, pageSize: pagination.pageSize };
    }

    const where: Prisma.InvoiceWhereInput = {
      center: {
        organizationId: scope.organizationId
      },
      student: {
        organizationId: scope.organizationId,
        role: Role.STUDENT
      },
      ...(centerScope?.length ? { centerId: { in: centerScope } } : {}),
      ...(studentScope?.length ? { studentId: { in: studentScope } } : {}),
      ...(query.month !== undefined ? { month: query.month } : {}),
      ...(query.year !== undefined ? { year: query.year } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.invoiceType ? { invoiceType: query.invoiceType } : {})
    };

    const [rows, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        select: invoiceSelect
      }),
      prisma.invoice.count({ where })
    ]);

    return {
      rows: rows.map((invoice) => withInvoiceTotals(invoice)),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  },

  async createInvoice(
    scope: ScopeContext,
    input: {
      studentId: number;
      centerId: number;
      month: number;
      year: number;
      invoiceType?: InvoiceType;
      amount: number;
      issuedAt?: string;
      dueDate?: string;
      notes?: string;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    await ensureFinanceCenter(scope, input.centerId);
    await ensureFinanceStudent(scope, input.studentId);

    const issuedAt = ensureDate(input.issuedAt) ?? new Date(input.year, input.month - 1, 1);
    const dueDate = ensureDate(input.dueDate);
    const invoiceType = input.invoiceType ?? InvoiceType.TUITION_MONTHLY;

    try {
      const invoice = await prisma.$transaction(async (tx) => {
        await accountingService.ensurePeriodOpenTx(tx, scope.organizationId, issuedAt);

        const [activeEnrollment, policy, feeProfile] = await Promise.all([
        tx.studentCircleEnrollment.findFirst({
          where: {
            studentId: input.studentId,
            status: "ACTIVE",
            circle: {
              centerId: input.centerId,
              center: {
                organizationId: scope.organizationId
              }
            }
          },
          select: {
            id: true
          }
        }),
        getEffectivePolicyTx(tx, {
          organizationId: scope.organizationId,
          centerId: input.centerId
        }),
        tx.studentFeeProfile.findFirst({
          where: {
            organizationId: scope.organizationId,
            centerId: input.centerId,
            studentId: input.studentId,
            isActive: true,
            startDate: { lte: issuedAt },
            OR: [{ endDate: null }, { endDate: { gte: issuedAt } }]
          },
          include: {
            tuitionPlan: {
              select: {
                id: true,
                monthlyAmount: true,
                isActive: true,
                planKind: true
              }
            }
          }
        })
        ]);

        if (!activeEnrollment) {
          throw financeV2Domain.financeError(
            "Student is not actively enrolled in selected center",
            400,
            "VALIDATION_ERROR"
          );
        }

        if (!policy.feesEnabled) {
          throw financeV2Domain.financeError(
            "Student fees are disabled for this organization or center",
            409,
            "FEES_DISABLED"
          );
        }

        if (!feeProfile || feeProfile.feeMode === FeeMode.FREE) {
          throw financeV2Domain.financeError(
            "Cannot create an invoice for a free student or a student without an active fee policy",
            409,
            "STUDENT_FEE_EXEMPT"
          );
        }

        let authorizedAmount: Prisma.Decimal;
        if (feeProfile.feeMode === FeeMode.SYMBOLIC_ONE_TIME) {
          if (!policy.allowSymbolicOneTimeFee) {
            throw financeV2Domain.financeError(
              "Symbolic student fees are disabled",
              409,
              "SYMBOLIC_FEES_DISABLED"
            );
          }
          if (invoiceType !== InvoiceType.REGISTRATION_ONE_TIME || !feeProfile.symbolicAmount) {
            throw financeV2Domain.financeError(
              "Invoice type does not match the student's symbolic fee policy",
              409,
              "FEE_MODE_INVOICE_TYPE_MISMATCH"
            );
          }
          authorizedAmount = feeProfile.symbolicAmount;
        } else {
          if (
            invoiceType !== InvoiceType.TUITION_MONTHLY ||
            !feeProfile.tuitionPlan ||
            !feeProfile.tuitionPlan.isActive ||
            feeProfile.tuitionPlan.planKind !== "MONTHLY"
          ) {
            throw financeV2Domain.financeError(
              "Invoice type does not match the student's monthly fee policy",
              409,
              "FEE_MODE_INVOICE_TYPE_MISMATCH"
            );
          }
          authorizedAmount = feeProfile.tuitionPlan.monthlyAmount;
        }

        const requestedAmount = financeV2Domain.toDecimal(input.amount);
        if (!requestedAmount.equals(authorizedAmount)) {
          throw financeV2Domain.financeError(
            "Invoice amount does not match the authorized student fee policy",
            409,
            "FEE_AMOUNT_MISMATCH"
          );
        }

        return tx.invoice.create({
          data: {
            studentId: input.studentId,
            centerId: input.centerId,
            month: input.month,
            year: input.year,
            invoiceType,
            amount: authorizedAmount,
            status: InvoiceStatus.PENDING,
            issuedAt,
            dueDate: dueDate ?? null,
            notes: input.notes?.trim() || null
          },
          select: invoiceSelect
        });
      });

      await addAudit({
        scope,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        centerId: invoice.centerId,
        summary: "تم إنشاء فاتورة V2",
        metadata: {
          invoice: normalize(invoice)
        } as Prisma.InputJsonValue
      });

      return withInvoiceTotals(invoice);
    } catch (error) {
      mapUniqueConflict(
        error,
        "INVALID_STATE_TRANSITION",
        "Invoice of this type already exists for this student and month"
      );
      throw error;
    }
  },

  async cancelInvoice(scope: ScopeContext, invoiceId: number, input: { reason: string }) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const existing = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        center: { organizationId: scope.organizationId }
      },
      select: invoiceSelect
    });
    assertFinanceEntity(existing, "Invoice not found");
    financeV2Domain.ensureCenterAllowed(scope, existing.centerId);

    if (existing.status === InvoiceStatus.PAID) {
      throw financeV2Domain.financeError(
        "Paid invoices cannot be cancelled",
        409,
        "INVALID_STATE_TRANSITION"
      );
    }

    if (existing.payments.length > 0) {
      throw financeV2Domain.financeError(
        "لا يمكن إلغاء فاتورة مرتبطة بمدفوعات. يجب معالجة المدفوعات أو إصدار تسوية محاسبية.",
        409,
        "INVOICE_HAS_PAYMENTS"
      );
    }

    const updated = await prisma.invoice.update({
      where: {
        id: existing.id
      },
      data: {
        status: InvoiceStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledById: scope.userId,
        cancelReason: input.reason.trim(),
        lockVersion: existing.lockVersion + 1
      },
      select: invoiceSelect
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.INVOICE,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: "تم إلغاء فاتورة",
      metadata: {
        before: normalize(existing),
        after: normalize(updated),
        reason: input.reason
      } as Prisma.InputJsonValue
    });

    return withInvoiceTotals(updated);
  },

  async listInvoicePayments(scope: ScopeContext, invoiceId: number) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        center: {
          organizationId: scope.organizationId
        }
      },
      select: {
        id: true,
        centerId: true,
        studentId: true
      }
    });
    assertFinanceEntity(invoice, "Invoice not found");
    financeV2Domain.ensureCenterAllowed(scope, invoice.centerId);
    financeV2Domain.ensureStudentAllowed(scope, invoice.studentId);

    const payments = await prisma.payment.findMany({
      where: {
        invoiceId: invoice.id
      },
      orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
      select: paymentSelect
    });

    return normalize(payments);
  },

  async createPayment(
    scope: ScopeContext,
    input: {
      invoiceId: number;
      amount: number;
      method: PaymentMethod;
      manualReferenceNo?: string;
      receivedAt?: string;
      attachmentStorageKey?: string;
      externalTransferRef?: string;
    },
    idempotencyKeyHeader?: string
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const idempotencyKey = parseIdempotencyKey(idempotencyKeyHeader);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findFirst({
          where: {
            id: input.invoiceId,
            center: { organizationId: scope.organizationId }
          },
          select: invoiceSelect
        });
        assertFinanceEntity(invoice, "Invoice not found");
        financeV2Domain.ensureCenterAllowed(scope, invoice.centerId);

        if (idempotencyKey) {
          const existing = await tx.payment.findFirst({
            where: { organizationId: scope.organizationId, idempotencyKey },
            select: paymentSelect
          });
          if (existing) {
            const existingInvoice = await tx.invoice.findUnique({
              where: { id: existing.invoiceId },
              select: invoiceSelect
            });
            const existingVoucher = existing.voucherId
              ? await tx.financeVoucher.findUnique({
                  where: { id: existing.voucherId },
                  select: voucherSelect
                })
              : null;
            const existingMovement = existing.voucherId
              ? await tx.financeAccountMovement.findUnique({
                  where: { voucherId: existing.voucherId },
                  select: movementSelect
                })
              : null;

            return {
              payment: normalize(existing),
              invoice: withInvoiceTotals(requireFinanceEntity(existingInvoice, "Invoice not found")),
              voucher: existingVoucher ? normalize(existingVoucher) : null,
              movement: existingMovement ? normalize(existingMovement) : null
            };
          }
        }

        await ensureInvoiceLockTx(tx, invoice.id);
        const lockedInvoice = await tx.invoice.findUnique({
          where: { id: invoice.id },
          select: invoiceSelect
        });
        assertFinanceEntity(lockedInvoice, "Invoice not found");

        if (lockedInvoice.status === InvoiceStatus.CANCELLED) {
          throw financeV2Domain.financeError(
            "Cannot pay a cancelled invoice",
            409,
            "INVALID_STATE_TRANSITION"
          );
        }

        const amount = financeV2Domain.toDecimal(input.amount);
        const totalsBefore = calcInvoiceTotals(lockedInvoice);
        if (amount.greaterThan(totalsBefore.remaining)) {
          throw financeV2Domain.financeError(
            "Payment exceeds invoice remaining balance",
            409,
            "PAYMENT_OVER_REMAINING"
          );
        }

        const policy = await getEffectivePolicyTx(tx, {
          organizationId: scope.organizationId,
          centerId: lockedInvoice.centerId
        });
        assertTransferAttachment({
          method: input.method,
          attachmentStorageKey: input.attachmentStorageKey,
          requireTransferAttachment: policy.requireTransferAttachment
        });

        const account = await ensureCenterFundAccountTx(tx, {
          organizationId: scope.organizationId,
          centerId: lockedInvoice.centerId
        });

        const voucher = await tx.financeVoucher.create({
          data: {
            organizationId: scope.organizationId,
            centerId: lockedInvoice.centerId,
            accountId: account.id,
            voucherType: VoucherType.RECEIPT,
            voucherNo: await nextVoucherNoTx(tx, "RV", scope.organizationId),
            sourceType: VoucherSourceType.PAYMENT,
            sourceId: lockedInvoice.id,
            paymentMethod: input.method,
            amount,
            status: VoucherStatus.APPROVED,
            createdById: scope.userId,
            approvedById: scope.userId,
            approvedAt: new Date(),
            attachmentStorageKey: input.attachmentStorageKey?.trim() || null,
            externalTransferRef: input.externalTransferRef?.trim() || null,
            manualReferenceNo: input.manualReferenceNo?.trim() || null
          },
          select: voucherSelect
        });

        const payment = await tx.payment.create({
          data: {
            invoiceId: lockedInvoice.id,
            organizationId: scope.organizationId,
            centerId: lockedInvoice.centerId,
            voucherId: voucher.id,
            amount,
            method: input.method,
            idempotencyKey: idempotencyKey ?? null,
            attachmentStorageKey: input.attachmentStorageKey?.trim() || null,
            externalTransferRef: input.externalTransferRef?.trim() || null,
            receivedById: scope.userId,
            receivedAt: ensureDate(input.receivedAt) ?? new Date()
          },
          select: paymentSelect
        });

        const posted = await postVoucherTx(tx, {
          voucherId: voucher.id,
          postedById: scope.userId,
          movementType: FinanceMovementType.PAYMENT_COLLECTION,
          allowOverdraft: policy.allowOverdraft
        });

        await accountingService.postPaymentJournalEntryTx(tx, scope, {
          paymentId: payment.id,
          postedById: scope.userId
        });

        await updateInvoiceStatusTx(tx, lockedInvoice.id);
        const updatedInvoice = await tx.invoice.findUnique({
          where: { id: lockedInvoice.id },
          select: invoiceSelect
        });

        return {
          payment: normalize(payment),
          invoice: withInvoiceTotals(requireFinanceEntity(updatedInvoice, "Invoice not found")),
          voucher: posted.voucher,
          movement: posted.movement
        };
      });

      await addAudit({
        scope,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.PAYMENT,
        entityId: result.payment.id,
        centerId: result.invoice.centerId as number,
        summary: "تم تسجيل دفعة مالية V2"
      });

      return result;
    } catch (error) {
      mapUniqueConflict(error, "VOUCHER_NUMBER_CONFLICT", "Voucher number conflict");
      throw error;
    }
  },

  async listTuitionPlans(
    scope: ScopeContext,
    query: { centerId?: number; isActive?: boolean }
  ) {
    financeV2Domain.assertReadEnabled();
    const where: Prisma.TuitionPlanWhereInput = {
      organizationId: scope.organizationId,
      ...(query.centerId ? { centerId: query.centerId } : {}),
      ...(query.isActive != null ? { isActive: query.isActive } : {})
    };
    const [items, total] = await Promise.all([
      prisma.tuitionPlan.findMany({
        where,
        select: tuitionPlanSelect,
        orderBy: { createdAt: "desc" }
      }),
      prisma.tuitionPlan.count({ where })
    ]);
    return { items: normalize(items), total };
  },

  async createTuitionPlan(
    scope: ScopeContext,
    input: {
      centerId: number;
      name: string;
      monthlyAmount: number;
      planKind?: TuitionPlanKind;
      isActive?: boolean;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);
    await ensureFinanceCenter(scope, input.centerId);

    const plan = await prisma.tuitionPlan.create({
      data: {
        organizationId: scope.organizationId,
        centerId: input.centerId,
        name: input.name.trim(),
        monthlyAmount: financeV2Domain.toDecimal(input.monthlyAmount),
        planKind: input.planKind ?? TuitionPlanKind.MONTHLY,
        isActive: input.isActive ?? true
      },
      select: tuitionPlanSelect
    });

    await addAudit({
      scope,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.SETTINGS,
      entityId: plan.id,
      centerId: plan.centerId,
      summary: `تم إنشاء خطة اشتراك: ${plan.name}`
    });

    return normalize(plan);
  },

  async updateTuitionPlan(
    scope: ScopeContext,
    planId: number,
    input: {
      name?: string;
      monthlyAmount?: number;
      planKind?: TuitionPlanKind;
      isActive?: boolean;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const existing = await prisma.tuitionPlan.findFirst({
      where: { id: planId, organizationId: scope.organizationId },
      select: tuitionPlanSelect
    });
    assertFinanceEntity(existing, "Tuition plan not found");

    const updated = await prisma.tuitionPlan.update({
      where: { id: planId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.monthlyAmount !== undefined
          ? { monthlyAmount: financeV2Domain.toDecimal(input.monthlyAmount) }
          : {}),
        ...(input.planKind !== undefined ? { planKind: input.planKind } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
      },
      select: tuitionPlanSelect
    });

    await addAudit({
      scope,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.SETTINGS,
      entityId: updated.id,
      centerId: updated.centerId,
      summary: `تم تحديث خطة اشتراك: ${updated.name}`
    });

    return normalize(updated);
  }
};
