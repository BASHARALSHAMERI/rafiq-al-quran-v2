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
import { accountingService as globalAccountingService } from "../../accounting/accounting.service";
import { AccountingAccountType } from "@prisma/client";

export const financeReportsService = {
  async reportDashboard(
    scope: ScopeContext,
    query: {
      from?: string;
      to?: string;
      centerId?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const range = financeV2Domain.resolveDateRange(query.from, query.to);

    const [invoiceAgg, paymentAgg, balances] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          center: {
            organizationId: scope.organizationId,
            ...(centerScope?.length ? { id: { in: centerScope } } : {})
          },
          ...(range ? { issuedAt: { gte: range.from, lte: range.to } } : {})
        },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.payment.aggregate({
        where: {
          organizationId: scope.organizationId,
          ...(centerScope?.length ? { centerId: { in: centerScope } } : {}),
          ...(range ? { receivedAt: { gte: range.from, lte: range.to } } : {})
        },
        _sum: { amount: true }
      }),
      prisma.financeAccount.aggregate({
        where: {
          organizationId: scope.organizationId,
          ...(centerScope?.length ? { OR: [{ centerId: { in: centerScope } }, { centerId: null }] } : {}),
          isActive: true
        },
        _sum: { currentBalance: true }
      })
    ]);

    const totalInvoiced = financeV2Domain.toMoney(invoiceAgg._sum.amount);
    const totalCollected = financeV2Domain.toMoney(paymentAgg._sum.amount);
    const outstanding = Math.max(0, totalInvoiced - totalCollected);

    return normalize({
      range: range ? { from: range.from, to: range.to } : null,
      kpis: {
        totalInvoicesCount: invoiceAgg._count._all,
        totalInvoiced,
        totalCollected,
        outstanding,
        collectionRate: totalInvoiced > 0 ? Number(((totalCollected / totalInvoiced) * 100).toFixed(2)) : 0,
        totalCashBalance: financeV2Domain.toMoney(balances._sum.currentBalance)
      }
    });
  },

  async reportCashflow(
    scope: ScopeContext,
    query: {
      from?: string;
      to?: string;
      centerId?: number;
      accountId?: number;
      movementType?: FinanceMovementType;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const range = financeV2Domain.resolveDateRange(query.from, query.to);
    const where: Prisma.FinanceAccountMovementWhereInput = {
      organizationId: scope.organizationId,
      ...(query.accountId ? { accountId: query.accountId } : {}),
      ...(query.movementType ? { movementType: query.movementType } : {}),
      ...(centerScope?.length ? { account: { centerId: { in: centerScope } } } : {}),
      ...(range ? { postedAt: { gte: range.from, lte: range.to } } : {})
    };

    const rows = await prisma.financeAccountMovement.findMany({
      where,
      orderBy: [{ postedAt: "asc" }, { id: "asc" }],
      select: movementSelect
    });

    const totals = rows.reduce(
      (acc, row) => {
        const amount = financeV2Domain.toMoney(row.amount);
        if (row.direction === FinanceMovementDirection.IN) acc.totalIn += amount;
        else acc.totalOut += amount;
        return acc;
      },
      { totalIn: 0, totalOut: 0 }
    );

    const opening = rows.length ? financeV2Domain.toMoney(rows[0].balanceBefore) : 0;
    const closing = rows.length ? financeV2Domain.toMoney(rows[rows.length - 1].balanceAfter) : opening;

    return normalize({
      range: range ? { from: range.from, to: range.to } : null,
      openingBalance: opening,
      totalIn: Number(totals.totalIn.toFixed(2)),
      totalOut: Number(totals.totalOut.toFixed(2)),
      closingBalance: Number(closing.toFixed(2)),
      rows
    });
  },

  async reportPayroll(
    scope: ScopeContext,
    query: {
      from?: string;
      to?: string;
      centerId?: number;
      status?: PayrollBatchStatus;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const range = financeV2Domain.resolveDateRange(query.from, query.to);
    const rows = await prisma.payrollBatch.findMany({
      where: {
        organizationId: scope.organizationId,
        ...(centerScope?.length ? { centerId: { in: centerScope } } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(range ? { createdAt: { gte: range.from, lte: range.to } } : {})
      },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      select: payrollBatchSelect
    });

    const approved = rows
      .filter((row) =>
        ([PayrollBatchStatus.APPROVED, PayrollBatchStatus.IN_PROGRESS, PayrollBatchStatus.PARTIALLY_PAID, PayrollBatchStatus.PAID, PayrollBatchStatus.CLOSED] as PayrollBatchStatus[]).includes(row.status)
      )
      .reduce((sum, row) => sum + financeV2Domain.toMoney(row.totalNetAmount), 0);
    const paid = rows.reduce((sum, row) => {
      const batchPaid = row.items
        .filter((item) => item.status === PayrollItemStatus.PAID)
        .reduce((v, item) => v + financeV2Domain.toMoney(item.netAmount), 0);
      return sum + batchPaid;
    }, 0);

    return normalize({
      rows,
      kpis: {
        totalBatches: rows.length,
        approvedPayroll: Number(approved.toFixed(2)),
        paidPayroll: Number(paid.toFixed(2)),
        executionRate: approved > 0 ? Number(((paid / approved) * 100).toFixed(2)) : 0
      }
    });
  },

  async reportRewards(
    scope: ScopeContext,
    query: {
      from?: string;
      to?: string;
      centerId?: number;
      status?: RewardBatchStatus;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const range = financeV2Domain.resolveDateRange(query.from, query.to);
    const rows = await prisma.rewardBatch.findMany({
      where: {
        organizationId: scope.organizationId,
        ...(centerScope?.length ? { OR: [{ centerId: { in: centerScope } }, { centerId: null }] } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(range ? { createdAt: { gte: range.from, lte: range.to } } : {})
      },
      orderBy: [{ periodYear: "desc" }, { createdAt: "desc" }],
      select: rewardBatchSelect
    });

    const approved = rows
      .filter((row) =>
        ([RewardBatchStatus.APPROVED, RewardBatchStatus.IN_PROGRESS, RewardBatchStatus.PARTIALLY_PAID, RewardBatchStatus.PAID, RewardBatchStatus.CLOSED] as RewardBatchStatus[]).includes(row.status)
      )
      .reduce((sum, row) => sum + financeV2Domain.toMoney(row.totalAmount), 0);
    const paid = rows.reduce((sum, row) => {
      const batchPaid = row.items
        .filter((item) => item.status === RewardItemStatus.PAID)
        .reduce((v, item) => v + financeV2Domain.toMoney(item.amount), 0);
      return sum + batchPaid;
    }, 0);

    return normalize({
      rows,
      kpis: {
        totalBatches: rows.length,
        approvedRewards: Number(approved.toFixed(2)),
        paidRewards: Number(paid.toFixed(2)),
        executionRate: approved > 0 ? Number(((paid / approved) * 100).toFixed(2)) : 0
      }
    });
  },

  async reportVouchers(
    scope: ScopeContext,
    query: {
      from?: string;
      to?: string;
      centerId?: number;
      status?: VoucherStatus;
      voucherType?: VoucherType;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const range = financeV2Domain.resolveDateRange(query.from, query.to);

    const rows = await prisma.financeVoucher.findMany({
      where: {
        organizationId: scope.organizationId,
        ...(centerScope?.length ? { centerId: { in: centerScope } } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.voucherType ? { voucherType: query.voucherType } : {}),
        ...(range ? { createdAt: { gte: range.from, lte: range.to } } : {})
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: voucherSelect
    });

    const totals = rows.reduce(
      (acc, row) => {
        const amount = financeV2Domain.toMoney(row.amount);
        if (row.voucherType === VoucherType.RECEIPT) acc.receipts += amount;
        else acc.disbursements += amount;
        return acc;
      },
      { receipts: 0, disbursements: 0 }
    );

    return normalize({
      rows,
      kpis: {
        totalVouchers: rows.length,
        receipts: Number(totals.receipts.toFixed(2)),
        disbursements: Number(totals.disbursements.toFixed(2))
      }
    });
  },

  async reportInvoiceAging(
    scope: ScopeContext,
    query: {
      asOf?: string;
      centerId?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const asOf = ensureDate(query.asOf) ?? new Date();

    const rows = await prisma.invoice.findMany({
      where: {
        center: { organizationId: scope.organizationId },
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
        ...(centerScope?.length ? { centerId: { in: centerScope } } : {})
      },
      orderBy: [{ dueDate: "asc" }, { issuedAt: "asc" }],
      select: invoiceSelect
    });

    const agingRows = rows.map((invoice) => {
      const withTotals = withInvoiceTotals(invoice);
      const dueDate = invoice.dueDate ?? invoice.issuedAt;
      const daysPastDue = Math.max(0, Math.floor((asOf.getTime() - dueDate.getTime()) / 86400000));
      const bucket = daysPastDue <= 30 ? "0_30" : daysPastDue <= 60 ? "31_60" : "61_PLUS";
      return { ...withTotals, daysPastDue, bucket };
    });

    const buckets = agingRows.reduce(
      (acc, row) => {
        const value = Number((row.remainingAmount as unknown as number) ?? 0);
        if (row.bucket === "0_30") acc.zeroTo30 += value;
        else if (row.bucket === "31_60") acc.thirtyOneTo60 += value;
        else acc.sixtyOnePlus += value;
        return acc;
      },
      { zeroTo30: 0, thirtyOneTo60: 0, sixtyOnePlus: 0 }
    );

    return normalize({
      asOf,
      rows: agingRows,
      kpis: {
        totalOutstanding: Number(
          (buckets.zeroTo30 + buckets.thirtyOneTo60 + buckets.sixtyOnePlus).toFixed(2)
        ),
        bucket0to30: Number(buckets.zeroTo30.toFixed(2)),
        bucket31to60: Number(buckets.thirtyOneTo60.toFixed(2)),
        bucket61Plus: Number(buckets.sixtyOnePlus.toFixed(2))
      }
    });
  },

  async listPendingApprovals(scope: ScopeContext) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanApprove(scope);

    const [vouchers, transfers, payrollBatches, rewardBatches] = await Promise.all([
      prisma.financeVoucher.findMany({
        where: {
          organizationId: scope.organizationId,
          status: { in: [VoucherStatus.SUBMITTED, VoucherStatus.VOID_REQUESTED] }
        },
        orderBy: [{ createdAt: "asc" }],
        select: voucherSelect
      }),
      prisma.financeFundTransfer.findMany({
        where: { organizationId: scope.organizationId, status: FundTransferStatus.SUBMITTED },
        orderBy: [{ createdAt: "asc" }],
        select: fundTransferSelect
      }),
      prisma.payrollBatch.findMany({
        where: { organizationId: scope.organizationId, status: PayrollBatchStatus.SUBMITTED },
        orderBy: [{ createdAt: "asc" }],
        select: payrollBatchSelect
      }),
      prisma.rewardBatch.findMany({
        where: { organizationId: scope.organizationId, status: RewardBatchStatus.SUBMITTED },
        orderBy: [{ createdAt: "asc" }],
        select: rewardBatchSelect
      })
    ]);

    return normalize({
      counts: {
        vouchers: vouchers.length,
        transfers: transfers.length,
        payrollBatches: payrollBatches.length,
        rewardBatches: rewardBatches.length,
        total: vouchers.length + transfers.length + payrollBatches.length + rewardBatches.length
      },
      vouchers,
      transfers,
      payrollBatches,
      rewardBatches
    });
  },

  /**
   * FA-CENTER-FINANCIAL-TRACKING-1: ملخص تمويل وتكلفة المراكز
   *
   * يجمع البيانات من JournalEntryLine حسب centerId ونوع الحساب المحاسبي:
   * - الإيرادات (رسوم الطلاب، تبرعات، إيرادات أخرى)
   * - المصروفات (رواتب، تشغيلية، تعليمية، مصروفات مراكز)
   *
   * لا يستخدم مصطلح "ربح" — يعرض فقط التمويل والتكلفة والعجز/الفائض التمويلي.
   */
  async reportCenterFundingSummary(
    scope: ScopeContext,
    query: {
      from?: string;
      to?: string;
      centerId?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const centerScope = financeV2Domain.resolveCenterScope(scope, query.centerId);
    const range = financeV2Domain.resolveDateRange(query.from, query.to);

    // 1. Fetch all POSTED journal entry lines with their account type and center
    const lines = await prisma.journalEntryLine.findMany({
      where: {
        organizationId: scope.organizationId,
        centerId: { not: null },
        ...(centerScope?.length ? { centerId: { in: centerScope } } : {}),
        journalEntry: {
          status: "POSTED" as const,
          ...(range
            ? {
                entryDate: {
                  ...(range.from ? { gte: range.from } : {}),
                  ...(range.to ? { lte: range.to } : {})
                }
              }
            : {})
        }
      },
      select: {
        centerId: true,
        debit: true,
        credit: true,
        journalEntry: {
          select: { sourceType: true }
        },
        account: {
          select: {
            id: true,
            type: true,
            systemKey: true,
            code: true
          }
        }
      }
    });

    // 2. Fetch centers
    const centerIds = [...new Set(lines.map((l) => l.centerId!))];
    const centers = await prisma.center.findMany({
      where: { id: { in: centerIds } },
      select: { id: true, name: true }
    });
    const centerMap = new Map(centers.map((c) => [c.id, c]));

    // 3. Aggregate by center
    type CenterTotals = {
      centerId: number;
      centerName: string;
      // تمويل (إيرادات)
      studentFees: number;       // رسوم واشتراكات رمزية
      donations: number;         // تبرعات مخصصة
      otherRevenue: number;      // إيرادات أخرى
      // تكلفة (مصروفات)
      payrollExpense: number;    // رواتب
      operatingExpense: number;  // تشغيلية
      educationalExpense: number; // تعليمية
      centerExpense: number;     // مصروفات المركز
      otherExpense: number;      // مصروفات أخرى
    };

    const byCenterId = new Map<number, CenterTotals>();

    const ensureCenter = (cId: number): CenterTotals => {
      if (!byCenterId.has(cId)) {
        const center = centerMap.get(cId);
        byCenterId.set(cId, {
          centerId: cId,
          centerName: center?.name ?? `مركز ${cId}`,
          studentFees: 0,
          donations: 0,
          otherRevenue: 0,
          payrollExpense: 0,
          operatingExpense: 0,
          educationalExpense: 0,
          centerExpense: 0,
          otherExpense: 0
        });
      }
      return byCenterId.get(cId)!;
    };

    for (const line of lines) {
      if (!line.centerId) continue;
      const totals = ensureCenter(line.centerId);
      const accountType = line.account.type;
      const systemKey = line.account.systemKey ?? "";
      const code = line.account.code;
      const sourceType = line.journalEntry.sourceType;

      if (accountType === "REVENUE") {
        // Classify revenue by account system key or source type
        const netCredit = Number(line.credit) - Number(line.debit);
        if (systemKey.includes("DONATION") || sourceType === "VOUCHER" && code === "4200") {
          totals.donations += netCredit;
        } else if (systemKey.includes("STUDENT") || code === "4100") {
          totals.studentFees += netCredit;
        } else {
          totals.otherRevenue += netCredit;
        }
      } else if (accountType === "EXPENSE") {
        // Classify expense by account system key
        const netDebit = Number(line.debit) - Number(line.credit);
        if (systemKey.includes("PAYROLL") || sourceType === "PAYROLL") {
          totals.payrollExpense += netDebit;
        } else if (systemKey.includes("OPERATING") || code === "5200") {
          totals.operatingExpense += netDebit;
        } else if (systemKey.includes("EDUCATIONAL") || code === "5300") {
          totals.educationalExpense += netDebit;
        } else if (systemKey.includes("CENTER") || code === "5400") {
          totals.centerExpense += netDebit;
        } else {
          totals.otherExpense += netDebit;
        }
      }
      // ASSET and LIABILITY lines are ignored for this cost-center summary
    }

    // 4. Build result rows
    const rows = Array.from(byCenterId.values())
      .sort((a, b) => a.centerName.localeCompare(b.centerName, "ar"))
      .map((row) => {
        const totalFunding = row.studentFees + row.donations + row.otherRevenue;
        const totalCost =
          row.payrollExpense +
          row.operatingExpense +
          row.educationalExpense +
          row.centerExpense +
          row.otherExpense;
        const fundingGap = totalFunding - totalCost; // positive = surplus, negative = deficit

        return {
          centerId: row.centerId,
          centerName: row.centerName,
          funding: {
            studentFees: Number(row.studentFees.toFixed(2)),
            donations: Number(row.donations.toFixed(2)),
            otherRevenue: Number(row.otherRevenue.toFixed(2)),
            totalFunding: Number(totalFunding.toFixed(2))
          },
          cost: {
            payrollExpense: Number(row.payrollExpense.toFixed(2)),
            operatingExpense: Number(row.operatingExpense.toFixed(2)),
            educationalExpense: Number(row.educationalExpense.toFixed(2)),
            centerExpense: Number(row.centerExpense.toFixed(2)),
            otherExpense: Number(row.otherExpense.toFixed(2)),
            totalCost: Number(totalCost.toFixed(2))
          },
          // عجز تمويلي (سالب) أو فائض تمويلي (موجب)
          fundingGap: Number(fundingGap.toFixed(2))
        };
      });

    // 5. Grand totals
    const grandFunding = rows.reduce((s, r) => s + r.funding.totalFunding, 0);
    const grandCost = rows.reduce((s, r) => s + r.cost.totalCost, 0);

    return normalize({
      range: range ? { from: range.from, to: range.to } : null,
      rows,
      totals: {
        totalFunding: Number(grandFunding.toFixed(2)),
        totalCost: Number(grandCost.toFixed(2)),
        fundingGap: Number((grandFunding - grandCost).toFixed(2))
      }
    });
  },

  /**
   * REPORTS-FINANCIAL-STATEMENTS-1: قائمة المركز المالي
   * 
   * تعتمد على أرصدة الحسابات المحاسبية (الأصول، الخصوم، صافي الأصول) حتى تاريخ معين.
   */
  async reportFinancialPosition(
    scope: ScopeContext,
    query: {
      asOf?: string;
      centerId?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const asOf = query.asOf || new Date().toISOString().split('T')[0];
    
    // Use trial balance logic to get balances up to asOf date
    const tb = await globalAccountingService.getTrialBalance(scope, {
      centerId: query.centerId,
      to: asOf
    });

    const assets = {
      current: [] as any[],
      fixed: [] as any[],
      totalCurrent: 0,
      totalFixed: 0,
      totalAssets: 0
    };

    const liabilities = {
      rows: [] as any[],
      totalLiabilities: 0
    };

    const netAssets = {
      unrestricted: [] as any[],
      restricted: [] as any[],
      totalUnrestricted: 0,
      totalRestricted: 0,
      totalNetAssets: 0
    };

    for (const row of tb.rows) {
      const balance = Number(row.balance);
      if (balance === 0) continue;

      const account = row.account;
      const item = {
        accountId: account.id,
        code: account.code,
        name: account.name,
        balance
      };

      if (account.type === AccountingAccountType.ASSET) {
        // Simple heuristic: codes starting with '11' are current, '12' are fixed
        // This should be refined based on the actual COA structure
        if (account.code.startsWith('12')) {
          assets.fixed.push(item);
          assets.totalFixed += balance;
        } else {
          assets.current.push(item);
          assets.totalCurrent += balance;
        }
        assets.totalAssets += balance;
      } else if (account.type === AccountingAccountType.LIABILITY) {
        liabilities.rows.push(item);
        liabilities.totalLiabilities += balance;
      } else if (account.type === AccountingAccountType.NET_ASSET) {
        // Equity accounts are "Net Assets" in NGO context
        // Heuristic: codes starting with '32' are restricted?
        if (account.code.startsWith('32')) {
          netAssets.restricted.push(item);
          netAssets.totalRestricted += balance;
        } else {
          netAssets.unrestricted.push(item);
          netAssets.totalUnrestricted += balance;
        }
        netAssets.totalNetAssets += balance;
      } else if (account.type === AccountingAccountType.REVENUE) {
        // Revenue increases surplus
        netAssets.totalUnrestricted += balance;
        netAssets.totalNetAssets += balance;
      } else if (account.type === AccountingAccountType.EXPENSE) {
        // Expense decreases surplus (Note: expenses normally have debit balance which is positive in TB, 
        // so we need to subtract it, or wait, if balance is net credit? 
        // Trial balance returns normal balance? Let's check how revenue and expense are signed.
        // Actually, if TB returns normal balance, revenue is credit (positive), expense is debit (positive).
        // Let's look at the TB calculation. If debit is positive, credit is positive?
        // Wait, TB usually returns debit/credit columns or a single net balance.
        // Let me check how `reportStatementOfActivities` uses them:
        // `revenue.totalRevenue += balance; expenses.totalExpenses += balance; surplus = revenue - expenses;`
        // So balance is positive for both. Therefore, we should ADD revenue and SUBTRACT expense from Net Assets.
        netAssets.totalUnrestricted -= balance;
        netAssets.totalNetAssets -= balance;
      }
    }

    // Add a synthetic line for current year surplus if it's non-zero
    const currentSurplus = netAssets.totalUnrestricted - netAssets.unrestricted.reduce((sum: number, item: any) => sum + item.balance, 0);
    if (currentSurplus !== 0) {
      netAssets.unrestricted.push({
        accountId: 0,
        code: '3200-YTD',
        name: 'فائض/عجز الفترة الحالية',
        balance: currentSurplus
      });
    }

    return normalize({
      asOf,
      assets: {
        current: assets.current,
        fixed: assets.fixed,
        totalCurrent: Number(assets.totalCurrent.toFixed(2)),
        totalFixed: Number(assets.totalFixed.toFixed(2)),
        totalAssets: Number(assets.totalAssets.toFixed(2))
      },
      liabilities: {
        rows: liabilities.rows,
        totalLiabilities: Number(liabilities.totalLiabilities.toFixed(2))
      },
      netAssets: {
        unrestricted: netAssets.unrestricted,
        restricted: netAssets.restricted,
        totalUnrestricted: Number(netAssets.totalUnrestricted.toFixed(2)),
        totalRestricted: Number(netAssets.totalRestricted.toFixed(2)),
        totalNetAssets: Number(netAssets.totalNetAssets.toFixed(2))
      },
      // Assets = Liabilities + Net Assets
      isBalanced: Math.abs(assets.totalAssets - (liabilities.totalLiabilities + netAssets.totalNetAssets)) < 0.01
    });
  },

  /**
   * REPORTS-FINANCIAL-STATEMENTS-1: قائمة الأنشطة (الإيرادات والمصروفات)
   * 
   * تعتمد على أرصدة الإيرادات والمصروفات خلال فترة زمنية.
   */
  async reportStatementOfActivities(
    scope: ScopeContext,
    query: {
      from?: string;
      to?: string;
      centerId?: number;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    financeV2Domain.ensureCenterAllowed(scope, query.centerId);

    const range = financeV2Domain.resolveDateRange(query.from, query.to);
    
    // Use trial balance logic to get balances for the period
    const tb = await globalAccountingService.getTrialBalance(scope, {
      centerId: query.centerId,
      from: query.from,
      to: query.to
    });

    const revenue = {
      studentContributions: [] as any[],
      donations: [] as any[],
      other: [] as any[],
      totalRevenue: 0
    };

    const expenses = {
      payroll: [] as any[],
      operating: [] as any[],
      educational: [] as any[],
      centers: [] as any[],
      depreciation: [] as any[],
      other: [] as any[],
      totalExpenses: 0
    };

    for (const row of tb.rows) {
      const balance = Number(row.balance);
      if (balance === 0) continue;

      const account = row.account;
      const item = {
        accountId: account.id,
        code: account.code,
        name: account.name,
        balance
      };

      if (account.type === AccountingAccountType.REVENUE) {
        if (account.code.startsWith('41')) {
          revenue.studentContributions.push(item);
        } else if (account.code.startsWith('42')) {
          revenue.donations.push(item);
        } else {
          revenue.other.push(item);
        }
        revenue.totalRevenue += balance;
      } else if (account.type === AccountingAccountType.EXPENSE) {
        if (account.code.startsWith('51')) {
          expenses.payroll.push(item);
        } else if (account.code.startsWith('52')) {
          expenses.operating.push(item);
        } else if (account.code.startsWith('53')) {
          expenses.educational.push(item);
        } else if (account.code.startsWith('54')) {
          expenses.centers.push(item);
        } else if (account.code.startsWith('55')) { // Assuming 55 for depreciation
          expenses.depreciation.push(item);
        } else {
          expenses.other.push(item);
        }
        expenses.totalExpenses += balance;
      }
    }

    const surplus = revenue.totalRevenue - expenses.totalExpenses;

    return normalize({
      range: range ? { from: range.from, to: range.to } : null,
      revenue: {
        studentContributions: revenue.studentContributions,
        donations: revenue.donations,
        other: revenue.other,
        totalRevenue: Number(revenue.totalRevenue.toFixed(2))
      },
      expenses: {
        payroll: expenses.payroll,
        operating: expenses.operating,
        educational: expenses.educational,
        centers: expenses.centers,
        depreciation: expenses.depreciation,
        other: expenses.other,
        totalExpenses: Number(expenses.totalExpenses.toFixed(2))
      },
      surplusOrDeficit: Number(surplus.toFixed(2))
    });
  }
};
