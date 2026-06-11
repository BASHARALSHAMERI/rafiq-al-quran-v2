import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  DonationStatus,
  DonorType,
  ExpenseInvoiceStatus,
  FinanceAccountType,
  FinanceMovementType,
  FiscalPeriodStatus,
  FundTransferStatus,
  Gender,
  JournalSourceType,
  PaymentMethod,
  PayrollBatchStatus,
  PayrollItemStatus,
  RewardBatchStatus,
  RewardCycle,
  RewardItemStatus,
  RewardType,
  Role,
  VoucherSourceType,
  VoucherStatus,
  VoucherType
} from "@prisma/client";
import { prisma } from "../src/shared/db/prisma";
import type { ScopeContext } from "../src/shared/types/auth.types";
import { assetsService } from "../src/modules/finance-v2/services/assets.service";
import { accountingService as financeAccountingService } from "../src/modules/finance-v2/services/accounting.service";
import { donorsService } from "../src/modules/finance-v2/services/donors.service";
import { expensesService } from "../src/modules/finance-v2/services/expenses.service";
import { payrollService } from "../src/modules/finance-v2/services/payroll.service";
import { rewardsService } from "../src/modules/finance-v2/services/rewards.service";
import {
  nextVoucherNoTx,
  postVoucherTx
} from "../src/modules/finance-v2/finance-v2.internal";
import { seedAccountingChart } from "./accounting-chart-seed";

const DEMO_ORGANIZATION_CODE = "RAFIQ-TAIZ-FINANCE";
const LEGACY_ORGANIZATION_CODE = "RAFIQ-TAIZ-FINANCE-DEMO";
const DEMO_PASSWORD = "RafiqLocal2026";
const SEED_FLAG = "ALLOW_FINANCE_DEMO_SEED";

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const monthText = String(month).padStart(2, "0");
const seedDate = `${year}-${monthText}-05T12:00:00.000Z`;
const effectiveFrom = `${year}-01-01T00:00:00.000Z`;

const assertSafeLocalDatabase = () => {
  if (process.env[SEED_FLAG] !== "YES") {
    throw new Error(`Refusing to run. Set ${SEED_FLAG}=YES explicitly.`);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run finance demo seed with NODE_ENV=production.");
  }

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL is required.");

  const databaseUrl = new URL(rawUrl);
  const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  const databaseName = databaseUrl.pathname.replace(/^\/+/, "");
  const protocolAllowed = databaseUrl.protocol === "postgresql:" || databaseUrl.protocol === "postgres:";

  if (!protocolAllowed || !allowedHosts.has(databaseUrl.hostname) || databaseName !== "rafiq_v2") {
    throw new Error(
      `Refusing unsafe target: protocol=${databaseUrl.protocol} host=${databaseUrl.hostname} database=${databaseName}`
    );
  }

  console.log(`Safety check passed: local PostgreSQL database ${databaseName} on ${databaseUrl.hostname}.`);
};

const scopeFor = (user: { id: number; role: Role; organizationId: number }): ScopeContext => ({
  userId: user.id,
  role: user.role,
  organizationId: user.organizationId,
  allAccess: true,
  centerIds: [],
  circleIds: [],
  studentIds: []
});

const ensureUser = async (
  organizationId: number,
  input: {
    email: string;
    legacyEmail?: string;
    username: string;
    fullName: string;
    role: Role;
    gender?: Gender;
  }
) => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const existing = await prisma.user.findFirst({
    where: {
      email: { in: [input.email, input.legacyEmail].filter((value): value is string => Boolean(value)) }
    }
  });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          organizationId,
          email: input.email,
          username: input.username,
          fullName: input.fullName,
          role: input.role,
          passwordHash,
          isActive: true,
          accountStatus: "ACTIVE"
        }
      })
    : await prisma.user.create({
        data: {
          organizationId,
          email: input.email,
          username: input.username,
          fullName: input.fullName,
          role: input.role,
          passwordHash,
          isActive: true,
          accountStatus: "ACTIVE",
          activatedAt: new Date()
        }
      });

  if (input.gender) {
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { fullName: input.fullName, gender: input.gender },
      create: { userId: user.id, fullName: input.fullName, gender: input.gender }
    });
  }

  if (input.role === Role.TEACHER) {
    await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, hireDate: new Date(effectiveFrom) }
    });
  }

  if (input.role === Role.STUDENT) {
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, joinDate: new Date(effectiveFrom) }
    });
  }

  if (input.role === Role.SUPERVISOR) {
    await prisma.supervisorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, assignedAt: new Date(effectiveFrom), status: "ACTIVE" }
    });
  }

  if (input.role === Role.PARENT) {
    await prisma.parentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, relationType: "FATHER" }
    });
  }

  return user;
};

const ensureOrgPolicy = async (organizationId: number) => {
  const existing = await prisma.financePolicyProfile.findFirst({
    where: { organizationId, centerId: null }
  });
  const data = {
    feesEnabled: false,
    requireTransferAttachment: false,
    requireApprovalDisbursement: true,
    requireApprovalReceipt: false,
    allowFreeStudents: true,
    allowSymbolicOneTimeFee: true,
    allowOverdraft: false
  };

  if (existing) {
    return prisma.financePolicyProfile.update({ where: { id: existing.id }, data });
  }
  return prisma.financePolicyProfile.create({
    data: { organizationId, centerId: null, ...data }
  });
};

const ensureFinanceAccount = async (input: {
  organizationId: number;
  centerId: number | null;
  accountType: FinanceAccountType;
  accountingAccountId: number;
}) => {
  const existing = await prisma.financeAccount.findFirst({
    where: {
      organizationId: input.organizationId,
      centerId: input.centerId,
      accountType: input.accountType
    }
  });
  if (existing) {
    return prisma.financeAccount.update({
      where: { id: existing.id },
      data: {
        accountingAccountId: input.accountingAccountId,
        currencyCode: "YER",
        isActive: true
      }
    });
  }
  return prisma.financeAccount.create({
    data: {
      ...input,
      openingBalance: 0,
      currentBalance: 0,
      currencyCode: "YER",
      isActive: true
    }
  });
};

const advanceVoucherToPosted = async (scope: ScopeContext, voucherId: number) => {
  let voucher = await prisma.financeVoucher.findUniqueOrThrow({ where: { id: voucherId } });
  if (voucher.status === VoucherStatus.DRAFT) {
    await financeAccountingService.submitVoucher(scope, voucherId, { comment: "بيانات العرض المالي" });
    voucher = await prisma.financeVoucher.findUniqueOrThrow({ where: { id: voucherId } });
  }
  if (voucher.status === VoucherStatus.SUBMITTED) {
    await financeAccountingService.approveVoucher(scope, voucherId, { comment: "اعتماد بيانات العرض المالي" });
    voucher = await prisma.financeVoucher.findUniqueOrThrow({ where: { id: voucherId } });
  }
  if (voucher.status === VoucherStatus.APPROVED) {
    await financeAccountingService.postVoucher(scope, voucherId, { comment: "ترحيل بيانات العرض المالي" });
  }
};

const ensureDonor = async (
  scope: ScopeContext,
  input: {
    name: string;
    donorType: DonorType;
    centerId?: number;
    address: string;
    marker: string;
    legacyMarker?: string;
  }
) => {
  const existing = await prisma.donor.findFirst({
    where: {
      organizationId: scope.organizationId,
      notes: { in: [input.marker, input.legacyMarker].filter((value): value is string => Boolean(value)) }
    }
  });
  if (existing) {
    return prisma.donor.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        donorType: input.donorType,
        centerId: input.centerId,
        address: input.address,
        notes: input.marker,
        isActive: true
      }
    });
  }

  return donorsService.createDonor(scope, {
    name: input.name,
    donorType: input.donorType,
    centerId: input.centerId,
    address: input.address,
    notes: input.marker
  });
};

const ensureReceivedDonation = async (
  scope: ScopeContext,
  input: {
    donorId: number;
    centerId?: number;
    amount: number;
    purpose: string;
    marker: string;
    legacyMarker?: string;
    method?: PaymentMethod;
  }
) => {
  let donation = await prisma.donation.findFirst({
    where: {
      organizationId: scope.organizationId,
      notes: { in: [input.marker, input.legacyMarker].filter((value): value is string => Boolean(value)) }
    }
  });
  if (donation && donation.notes !== input.marker) {
    donation = await prisma.donation.update({
      where: { id: donation.id },
      data: { notes: input.marker, purpose: input.purpose }
    });
  }
  if (!donation) {
    donation = await donorsService.createDonation(scope, {
      donorId: input.donorId,
      centerId: input.centerId,
      amount: input.amount,
      donationDate: seedDate,
      receivedDate: seedDate,
      paymentMethod: input.method ?? PaymentMethod.CASH,
      purpose: input.purpose,
      status: DonationStatus.RECEIVED,
      isPledge: false,
      notes: input.marker
    });
  }
  if (!donation.voucherId) throw new Error(`Donation ${input.marker} has no receipt voucher.`);
  await advanceVoucherToPosted(scope, donation.voucherId);
  return donation;
};

const ensurePostedTransfer = async (
  scope: ScopeContext,
  input: {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    marker: string;
    legacyMarker?: string;
  }
) => {
  let transfer = await prisma.financeFundTransfer.findFirst({
    where: {
      organizationId: scope.organizationId,
      notes: { in: [input.marker, input.legacyMarker].filter((value): value is string => Boolean(value)) }
    }
  });
  if (transfer && transfer.notes !== input.marker) {
    transfer = await prisma.financeFundTransfer.update({
      where: { id: transfer.id },
      data: { notes: input.marker }
    });
  }
  if (!transfer) {
    transfer = await financeAccountingService.createFundTransfer(scope, {
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amount: input.amount,
      notes: input.marker
    });
  }
  if (transfer.status === FundTransferStatus.DRAFT) {
    await financeAccountingService.submitFundTransfer(scope, transfer.id, { comment: input.marker });
    transfer = await prisma.financeFundTransfer.findUniqueOrThrow({ where: { id: transfer.id } });
  }
  if (transfer.status === FundTransferStatus.SUBMITTED) {
    await financeAccountingService.approveFundTransfer(scope, transfer.id, { comment: input.marker });
    transfer = await prisma.financeFundTransfer.findUniqueOrThrow({ where: { id: transfer.id } });
  }
  if (transfer.status === FundTransferStatus.APPROVED) {
    await financeAccountingService.postFundTransfer(scope, transfer.id, { comment: input.marker });
  }
  const postedTransfer = await prisma.financeFundTransfer.findUniqueOrThrow({
    where: { id: transfer.id }
  });
  const voucherIds = [postedTransfer.voucherOutId, postedTransfer.voucherInId].filter(
    (value): value is number => value !== null
  );
  if (voucherIds.length) {
    await prisma.financeVoucher.updateMany({
      where: { id: { in: voucherIds } },
      data: { notes: input.marker }
    });
  }
  await prisma.journalEntry.updateMany({
    where: {
      organizationId: scope.organizationId,
      sourceType: JournalSourceType.FUND_TRANSFER,
      sourceId: transfer.id
    },
    data: { description: input.marker }
  });
};

const ensureExpense = async (
  scope: ScopeContext,
  input: {
    centerId: number;
    supplierId: number;
    categoryId: number;
    financeAccountId: number;
    invoiceNo: string;
    legacyInvoiceNo?: string;
    description: string;
    amount: number;
  }
) => {
  let invoice = await prisma.expenseInvoice.findFirst({
    where: {
      organizationId: scope.organizationId,
      invoiceNo: {
        in: [input.invoiceNo, input.legacyInvoiceNo].filter((value): value is string => Boolean(value))
      }
    }
  });
  if (invoice && (invoice.invoiceNo !== input.invoiceNo || invoice.description !== input.description)) {
    invoice = await prisma.expenseInvoice.update({
      where: { id: invoice.id },
      data: { invoiceNo: input.invoiceNo, description: input.description }
    });
  }
  if (!invoice) {
    invoice = await expensesService.createExpenseInvoice(scope, {
      centerId: input.centerId,
      supplierId: input.supplierId,
      categoryId: input.categoryId,
      invoiceNo: input.invoiceNo,
      invoiceDate: seedDate,
      description: input.description,
      amount: input.amount
    });
  }
  if (
    invoice.status === ExpenseInvoiceStatus.DRAFT ||
    invoice.status === ExpenseInvoiceStatus.PENDING_APPROVAL
  ) {
    invoice = await expensesService.approveExpenseInvoice(scope, invoice.id);
  }
  if (
    invoice.status === ExpenseInvoiceStatus.APPROVED ||
    invoice.status === ExpenseInvoiceStatus.PARTIALLY_PAID
  ) {
    const paid = await prisma.expensePayment.aggregate({
      where: { invoiceId: invoice.id },
      _sum: { amount: true }
    });
    const remaining = Number(invoice.amount) - Number(paid._sum.amount ?? 0);
    if (remaining > 0) {
      await expensesService.payExpenseInvoice(scope, invoice.id, {
        amount: remaining,
        financeAccountId: input.financeAccountId,
        notes: `سداد ${input.invoiceNo}`
      });
    }
  }
};

const ensurePayroll = async (
  scope: ScopeContext,
  input: { centerId: number; userId: number; amount: number; marker: string }
) => {
  const profile = await prisma.payrollProfile.findFirst({
    where: { organizationId: scope.organizationId, centerId: input.centerId, userId: input.userId }
  });
  if (profile) {
    await prisma.payrollProfile.update({
      where: { id: profile.id },
      data: {
        overrideReason: "مكافأة شهرية معتمدة ضمن سياسة المركز",
        notes: input.marker
      }
    });
  } else {
    await payrollService.createPayrollProfile(scope, {
      centerId: input.centerId,
      userId: input.userId,
      monthlyBaseAmount: input.amount,
      salaryCurrencyCode: "YER",
      paymentMethodDefault: PaymentMethod.CASH,
      salarySource: "OVERRIDE",
      overrideReason: "مكافأة شهرية معتمدة ضمن سياسة المركز",
      effectiveFrom,
      notes: input.marker
    });
  }

  let batch = await prisma.payrollBatch.findFirst({
    where: {
      organizationId: scope.organizationId,
      centerId: input.centerId,
      periodYear: year,
      periodMonth: month
    }
  });
  if (!batch) {
    batch = await payrollService.createPayrollBatch(scope, {
      centerId: input.centerId,
      periodYear: year,
      periodMonth: month
    });
  }
  if (batch.status === PayrollBatchStatus.DRAFT) {
    await payrollService.submitPayrollBatch(scope, batch.id, { comment: input.marker });
    batch = await prisma.payrollBatch.findUniqueOrThrow({ where: { id: batch.id } });
  }
  if (batch.status === PayrollBatchStatus.SUBMITTED) {
    await payrollService.approvePayrollBatch(scope, batch.id, { comment: input.marker });
    batch = await prisma.payrollBatch.findUniqueOrThrow({ where: { id: batch.id } });
  }
  if (
    batch.status === PayrollBatchStatus.APPROVED ||
    batch.status === PayrollBatchStatus.IN_PROGRESS ||
    batch.status === PayrollBatchStatus.PARTIALLY_PAID
  ) {
    const items = await prisma.payrollItem.findMany({
      where: { batchId: batch.id, status: PayrollItemStatus.PENDING }
    });
    if (items.length) {
      await payrollService.payPayrollBatch(scope, batch.id, {
        payments: items.map((item) => ({
          itemId: item.id,
          method: PaymentMethod.CASH,
          manualReferenceNo: `${input.marker}-${item.id}`
        }))
      });
    }
  }
  const payrollItems = await prisma.payrollItem.findMany({
    where: { batchId: batch.id },
    select: { id: true, voucherId: true }
  });
  for (const item of payrollItems) {
    const reference = `${input.marker}-${item.id}`;
    await prisma.payrollItem.update({
      where: { id: item.id },
      data: { paymentReference: reference }
    });
    if (item.voucherId) {
      await prisma.financeVoucher.update({
        where: { id: item.voucherId },
        data: { manualReferenceNo: reference }
      });
    }
  }
};

const ensureReward = async (
  scope: ScopeContext,
  input: { centerId: number; studentId: number; amount: number; marker: string }
) => {
  const profile = await prisma.rewardProfile.findFirst({
    where: {
      organizationId: scope.organizationId,
      centerId: input.centerId,
      beneficiaryUserId: input.studentId,
      cycle: RewardCycle.MONTHLY,
      rewardType: RewardType.PERFORMANCE
    }
  });
  if (profile) {
    await prisma.rewardProfile.update({
      where: { id: profile.id },
      data: { notes: input.marker }
    });
  } else {
    await rewardsService.createRewardProfile(scope, {
      centerId: input.centerId,
      beneficiaryUserId: input.studentId,
      beneficiaryRole: "STUDENT",
      cycle: RewardCycle.MONTHLY,
      rewardType: RewardType.PERFORMANCE,
      defaultAmount: input.amount,
      effectiveFrom,
      notes: input.marker
    });
  }

  let batch = await prisma.rewardBatch.findFirst({
    where: {
      organizationId: scope.organizationId,
      centerId: input.centerId,
      cycle: RewardCycle.MONTHLY,
      rewardType: RewardType.PERFORMANCE,
      periodYear: year,
      periodMonth: month
    }
  });
  if (!batch) {
    batch = await rewardsService.createRewardBatch(scope, {
      centerId: input.centerId,
      cycle: RewardCycle.MONTHLY,
      rewardType: RewardType.PERFORMANCE,
      periodYear: year,
      periodMonth: month
    });
  }
  if (batch.status === RewardBatchStatus.DRAFT) {
    await rewardsService.submitRewardBatch(scope, batch.id, { comment: input.marker });
    batch = await prisma.rewardBatch.findUniqueOrThrow({ where: { id: batch.id } });
  }
  if (batch.status === RewardBatchStatus.SUBMITTED) {
    await rewardsService.approveRewardBatch(scope, batch.id, { comment: input.marker });
    batch = await prisma.rewardBatch.findUniqueOrThrow({ where: { id: batch.id } });
  }
  if (
    batch.status === RewardBatchStatus.APPROVED ||
    batch.status === RewardBatchStatus.IN_PROGRESS ||
    batch.status === RewardBatchStatus.PARTIALLY_PAID
  ) {
    const items = await prisma.rewardItem.findMany({
      where: { batchId: batch.id, status: RewardItemStatus.PENDING }
    });
    if (items.length) {
      await rewardsService.payRewardBatch(scope, batch.id, {
        payments: items.map((item) => ({
          itemId: item.id,
          method: PaymentMethod.CASH,
          manualReferenceNo: `${input.marker}-${item.id}`
        }))
      });
    }
  }
  const rewardItems = await prisma.rewardItem.findMany({
    where: { batchId: batch.id },
    select: { id: true, voucherId: true }
  });
  for (const item of rewardItems) {
    const reference = `${input.marker}-${item.id}`;
    await prisma.rewardItem.update({
      where: { id: item.id },
      data: { paymentReference: reference }
    });
    if (item.voucherId) {
      await prisma.financeVoucher.update({
        where: { id: item.voucherId },
        data: { manualReferenceNo: reference }
      });
    }
  }
};

const ensureAsset = async (
  scope: ScopeContext,
  input: {
    centerId: number;
    categoryId: number;
    financeAccountId: number;
    custodianUserId: number;
    assetCode: string;
    legacyAssetCode?: string;
    name: string;
    cost: number;
  }
) => {
  let asset = await prisma.fixedAsset.findFirst({
    where: {
      organizationId: scope.organizationId,
      assetCode: {
        in: [input.assetCode, input.legacyAssetCode].filter((value): value is string => Boolean(value))
      }
    }
  });
  if (asset) {
    asset = await prisma.fixedAsset.update({
      where: { id: asset.id },
      data: {
        assetCode: input.assetCode,
        name: input.name,
        description: "أصل تشغيلي مملوك للمركز ومسجل ضمن عهدته",
        location: "تعز - مقر المركز",
        notes: "أصل تشغيلي لبيانات العرض المحلية"
      }
    });
  }
  if (!asset) {
    asset = await assetsService.createFixedAsset(scope, {
      centerId: input.centerId,
      categoryId: input.categoryId,
      assetCode: input.assetCode,
      name: input.name,
      description: "أصل تشغيلي مملوك للمركز ومسجل ضمن عهدته",
      purchaseDate: seedDate,
      purchaseCost: input.cost,
      currentValue: input.cost,
      usefulLifeMonths: 60,
      location: "تعز - مقر المركز",
      custodianUserId: input.custodianUserId,
      notes: "أصل تشغيلي لبيانات العرض المحلية"
    });
  }
  if (!asset.acquisitionJournalEntryId) {
    await assetsService.postAssetAcquisition(scope, asset.id, {
      financeAccountId: input.financeAccountId
    });
  }
  asset = await prisma.fixedAsset.findUniqueOrThrow({ where: { id: asset.id } });
  if (asset.acquisitionJournalEntryId) {
    await prisma.journalEntry.update({
      where: { id: asset.acquisitionJournalEntryId },
      data: { description: `اقتناء الأصل ${asset.assetCode} - ${asset.name}` }
    });
    await prisma.journalEntryLine.updateMany({
      where: { journalEntryId: asset.acquisitionJournalEntryId, debit: { gt: 0 } },
      data: { memo: `إثبات اقتناء الأصل: ${asset.name}` }
    });
    await prisma.journalEntryLine.updateMany({
      where: { journalEntryId: asset.acquisitionJournalEntryId, credit: { gt: 0 } },
      data: { memo: `سداد قيمة الأصل من صندوق المركز` }
    });
  }
  const voucherNotes = `سداد اقتناء الأصل ${asset.assetCode}`;
  const existingVoucher = await prisma.financeVoucher.findFirst({
    where: {
      organizationId: scope.organizationId,
      sourceType: VoucherSourceType.EXPENSE,
      sourceId: asset.id,
      notes: voucherNotes
    },
    include: { movement: true }
  });
  if (!existingVoucher?.movement) {
    await prisma.$transaction(async (tx) => {
      const voucher = existingVoucher
        ? existingVoucher
        : await tx.financeVoucher.create({
            data: {
              organizationId: scope.organizationId,
              centerId: input.centerId,
              accountId: input.financeAccountId,
              voucherType: VoucherType.DISBURSEMENT,
              voucherNo: await nextVoucherNoTx(tx, "DV", scope.organizationId),
              sourceType: VoucherSourceType.EXPENSE,
              sourceId: asset.id,
              amount: input.cost,
              status: VoucherStatus.APPROVED,
              voucherDate: new Date(seedDate),
              notes: voucherNotes,
              createdById: scope.userId,
              approvedById: scope.userId,
              approvedAt: new Date()
            }
          });
      await postVoucherTx(tx, {
        voucherId: voucher.id,
        postedById: scope.userId,
        movementType: FinanceMovementType.VOUCHER_DISBURSEMENT,
        allowOverdraft: false
      });
    });
  }
  const depreciation = await prisma.assetDepreciationEntry.findFirst({
    where: { assetId: asset.id, periodYear: year, periodMonth: month }
  });
  if (!depreciation) {
    await assetsService.postAssetDepreciation(scope, asset.id, {
      periodYear: year,
      periodMonth: month
    });
  }
};

const verifyLocalFinanceData = async (organizationId: number, studentIds: number[]) => {
  const [
    feeProfiles,
    studentInvoices,
    donors,
    donations,
    transfers,
    expenses,
    payrollBatches,
    rewardBatches,
    assets,
    vouchers,
    journals,
    journalLines,
    financeAccounts
  ] = await Promise.all([
    prisma.studentFeeProfile.count({ where: { organizationId, studentId: { in: studentIds } } }),
    prisma.invoice.count({ where: { studentId: { in: studentIds } } }),
    prisma.donor.count({ where: { organizationId } }),
    prisma.donation.count({ where: { organizationId } }),
    prisma.financeFundTransfer.count({ where: { organizationId } }),
    prisma.expenseInvoice.count({ where: { organizationId } }),
    prisma.payrollBatch.count({ where: { organizationId } }),
    prisma.rewardBatch.count({ where: { organizationId } }),
    prisma.fixedAsset.count({ where: { organizationId } }),
    prisma.financeVoucher.count({ where: { organizationId, status: VoucherStatus.POSTED } }),
    prisma.journalEntry.count({ where: { organizationId } }),
    prisma.journalEntryLine.groupBy({
      by: ["journalEntryId"],
      where: { organizationId },
      _sum: { debit: true, credit: true }
    }),
    prisma.financeAccount.findMany({
      where: { organizationId },
      include: { center: { select: { name: true } } },
      orderBy: { id: "asc" }
    })
  ]);

  const unbalanced = journalLines.filter(
    (row) => Number(row._sum.debit ?? 0) !== Number(row._sum.credit ?? 0)
  );
  if (feeProfiles !== 0 || studentInvoices !== 0) {
    throw new Error(
      `Free-default violation: feeProfiles=${feeProfiles}, studentInvoices=${studentInvoices}`
    );
  }
  if (unbalanced.length > 0) {
    throw new Error(`Accounting verification failed: ${unbalanced.length} unbalanced journal entries.`);
  }

  const linkedAccountingAccountIds = Array.from(
    new Set(
      financeAccounts
        .map((account) => account.accountingAccountId)
        .filter((accountId): accountId is number => accountId !== null)
    )
  );
  const linkedLedgerRows = await prisma.journalEntryLine.groupBy({
    by: ["accountId"],
    where: {
      organizationId,
      accountId: { in: linkedAccountingAccountIds },
      journalEntry: { status: "POSTED" }
    },
    _sum: { debit: true, credit: true }
  });
  const financeLiquidity = financeAccounts.reduce(
    (total, financeAccount) => total + Number(financeAccount.currentBalance),
    0
  );
  const ledgerLiquidity = linkedLedgerRows.reduce(
    (total, row) => total + Number(row._sum.debit ?? 0) - Number(row._sum.credit ?? 0),
    0
  );
  const liquidityDifference = financeLiquidity - ledgerLiquidity;

  console.table({
    donors,
    donations,
    transfers,
    expenses,
    payrollBatches,
    rewardBatches,
    assets,
    postedVouchers: vouchers,
    journals,
    unbalancedJournals: unbalanced.length,
    demoStudentFeeProfiles: feeProfiles,
    demoStudentInvoices: studentInvoices,
    financeLiquidity,
    linkedLedgerLiquidity: ledgerLiquidity,
    liquidityDifference
  });
  console.table(
    financeAccounts.map((account) => ({
      account: account.accountType,
      center: account.center?.name ?? "الجمعية",
      balanceYER: Number(account.currentBalance)
    }))
  );
  if (liquidityDifference !== 0) {
    throw new Error(
      `Finance liquidity verification failed: difference=${liquidityDifference} YER.`
    );
  }
};

const main = async () => {
  assertSafeLocalDatabase();

  const existingOrganization = await prisma.organization.findFirst({
    where: { code: { in: [DEMO_ORGANIZATION_CODE, LEGACY_ORGANIZATION_CODE] } }
  });
  const organization = existingOrganization
    ? await prisma.organization.update({
        where: { id: existingOrganization.id },
        data: {
          code: DEMO_ORGANIZATION_CODE,
          name: "جمعية رفقاء القرآن العلمية - تعز"
        }
      })
    : await prisma.organization.create({
        data: {
          code: DEMO_ORGANIZATION_CODE,
          name: "جمعية رفقاء القرآن العلمية - تعز"
        }
      });

  const financeManager = await ensureUser(organization.id, {
    email: "finance.taiz@local.invalid",
    legacyEmail: "finance.demo@rafiq.local",
    username: "مالية_تعز",
    fullName: "مسؤول الشؤون المالية",
    role: Role.FINANCE_MANAGER,
    gender: Gender.MALE
  });
  await ensureUser(organization.id, {
    email: "admin.taiz@local.invalid",
    legacyEmail: "admin.demo@rafiq.local",
    username: "إدارة_الجمعية",
    fullName: "مسؤول إدارة الجمعية",
    role: Role.SUPER_ADMIN,
    gender: Gender.MALE
  });
  const teacherOne = await ensureUser(organization.id, {
    email: "teacher.dar@local.invalid",
    legacyEmail: "teacher.dar.demo@rafiq.local",
    username: "معلم_دار_القرآن",
    fullName: "معلم الحلقة الأولى",
    role: Role.TEACHER,
    gender: Gender.MALE
  });
  const teacherTwo = await ensureUser(organization.id, {
    email: "teacher.baraa@local.invalid",
    legacyEmail: "teacher.baraa.demo@rafiq.local",
    username: "معلم_البراء",
    fullName: "معلم حلقة البراء",
    role: Role.TEACHER,
    gender: Gender.MALE
  });
  const studentOne = await ensureUser(organization.id, {
    email: "student.dar@local.invalid",
    legacyEmail: "student.dar.demo@rafiq.local",
    username: "طالب_دار_القرآن",
    fullName: "طالب الحلقة الأولى",
    role: Role.STUDENT,
    gender: Gender.MALE
  });
  const studentTwo = await ensureUser(organization.id, {
    email: "student.baraa@local.invalid",
    legacyEmail: "student.baraa.demo@rafiq.local",
    username: "طالب_البراء",
    fullName: "طالب حلقة البراء",
    role: Role.STUDENT,
    gender: Gender.MALE
  });

  const darCenter = await prisma.center.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: "TAIZ-DAR-QURAN" } },
    update: {
      name: "مركز دار القرآن",
      locationText: "تعز - وسط المدينة - قرب شارع جمال",
      centerAdminUserId: financeManager.id,
      isActive: true
    },
    create: {
      organizationId: organization.id,
      code: "TAIZ-DAR-QURAN",
      name: "مركز دار القرآن",
      locationText: "تعز - وسط المدينة - قرب شارع جمال",
      timezone: "Asia/Aden",
      centerAdminUserId: financeManager.id
    }
  });
  const baraaCenter = await prisma.center.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: "TAIZ-BARAA" } },
    update: {
      name: "مركز البراء بن مالك",
      locationText: "تعز - التحرير الأسفل",
      centerAdminUserId: financeManager.id,
      isActive: true
    },
    create: {
      organizationId: organization.id,
      code: "TAIZ-BARAA",
      name: "مركز البراء بن مالك",
      locationText: "تعز - التحرير الأسفل",
      timezone: "Asia/Aden",
      centerAdminUserId: financeManager.id
    }
  });

  for (const [userId, centerId] of [
    [teacherOne.id, darCenter.id],
    [studentOne.id, darCenter.id],
    [teacherTwo.id, baraaCenter.id],
    [studentTwo.id, baraaCenter.id]
  ]) {
    await prisma.userCenterAccess.upsert({
      where: { userId_centerId: { userId, centerId } },
      update: {},
      create: { userId, centerId }
    });
  }

  await seedAccountingChart(prisma, organization.id);
  const accountingAccounts = await prisma.accountingAccount.findMany({
    where: { organizationId: organization.id }
  });
  const byKey = new Map(accountingAccounts.map((account) => [account.systemKey, account]));
  const account = (key: string) => {
    const value = byKey.get(key);
    if (!value) throw new Error(`Missing accounting account ${key}.`);
    return value;
  };

  await prisma.currency.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: "YER" } },
    update: { nameAr: "الريال اليمني", nameEn: "Yemeni Rial", symbol: "ر.ي", isBase: true, isActive: true },
    create: {
      organizationId: organization.id,
      code: "YER",
      nameAr: "الريال اليمني",
      nameEn: "Yemeni Rial",
      symbol: "ر.ي",
      decimalPlaces: 0,
      isBase: true,
      isActive: true
    }
  });

  await prisma.financeSettings.upsert({
    where: { organizationId: organization.id },
    update: {
      baseCurrencyCode: "YER",
      defaultCashAccountId: account("MAIN_CASH").id,
      defaultBankAccountId: account("BANK").id,
      defaultStudentRevenueAccountId: account("STUDENT_CONTRIBUTIONS_REVENUE").id,
      defaultDonationRevenueAccountId: account("DONATIONS_REVENUE").id,
      defaultPayrollExpenseAccountId: account("PAYROLL_REWARDS_EXPENSE").id,
      defaultOperatingExpenseAccountId: account("OPERATING_EXPENSES").id
    },
    create: {
      organizationId: organization.id,
      baseCurrencyCode: "YER",
      defaultCashAccountId: account("MAIN_CASH").id,
      defaultBankAccountId: account("BANK").id,
      defaultStudentRevenueAccountId: account("STUDENT_CONTRIBUTIONS_REVENUE").id,
      defaultDonationRevenueAccountId: account("DONATIONS_REVENUE").id,
      defaultPayrollExpenseAccountId: account("PAYROLL_REWARDS_EXPENSE").id,
      defaultOperatingExpenseAccountId: account("OPERATING_EXPENSES").id
    }
  });
  await ensureOrgPolicy(organization.id);

  const fiscalYear = await prisma.fiscalYear.upsert({
    where: { organizationId_year: { organizationId: organization.id, year } },
    update: {
      startDate: new Date(`${year}-01-01T00:00:00.000Z`),
      endDate: new Date(`${year}-12-31T00:00:00.000Z`),
      status: FiscalPeriodStatus.OPEN,
      closedAt: null,
      closedById: null
    },
    create: {
      organizationId: organization.id,
      year,
      startDate: new Date(`${year}-01-01T00:00:00.000Z`),
      endDate: new Date(`${year}-12-31T00:00:00.000Z`)
    }
  });
  await prisma.fiscalPeriod.upsert({
    where: { fiscalYearId_periodNumber: { fiscalYearId: fiscalYear.id, periodNumber: 1 } },
    update: {
      periodName: `السنة المالية ${year}`,
      startDate: new Date(`${year}-01-01T00:00:00.000Z`),
      endDate: new Date(`${year}-12-31T00:00:00.000Z`),
      status: FiscalPeriodStatus.OPEN,
      closedAt: null,
      closedById: null
    },
    create: {
      organizationId: organization.id,
      fiscalYearId: fiscalYear.id,
      periodNumber: 1,
      periodName: `السنة المالية ${year}`,
      startDate: new Date(`${year}-01-01T00:00:00.000Z`),
      endDate: new Date(`${year}-12-31T00:00:00.000Z`)
    }
  });

  const orgFund = await ensureFinanceAccount({
    organizationId: organization.id,
    centerId: null,
    accountType: FinanceAccountType.ORG_FUND,
    accountingAccountId: account("MAIN_CASH").id
  });
  const darFund = await ensureFinanceAccount({
    organizationId: organization.id,
    centerId: darCenter.id,
    accountType: FinanceAccountType.CENTER_FUND,
    accountingAccountId: account("CENTER_FUNDS").id
  });
  const baraaFund = await ensureFinanceAccount({
    organizationId: organization.id,
    centerId: baraaCenter.id,
    accountType: FinanceAccountType.CENTER_FUND,
    accountingAccountId: account("CENTER_FUNDS").id
  });

  const scope = scopeFor(financeManager);
  const publicDonor = await ensureDonor(scope, {
    name: "فاعل خير",
    donorType: DonorType.INDIVIDUAL_DONOR,
    address: "تعز - تبرع دون بيانات شخصية",
    marker: "متبرع عام للجمعية",
    legacyMarker: "FINANCE-DEMO-DONOR-ORG"
  });
  const merchantDonor = await ensureDonor(scope, {
    name: "محسن كريم",
    donorType: DonorType.MERCHANT,
    centerId: darCenter.id,
    address: "تعز - تبرع دون بيانات شخصية",
    marker: "داعم مركز دار القرآن",
    legacyMarker: "FINANCE-DEMO-DONOR-DAR"
  });
  const associationDonor = await ensureDonor(scope, {
    name: "مؤسسة الرحمة الخيرية",
    donorType: DonorType.CHARITY_ASSOCIATION,
    centerId: baraaCenter.id,
    address: "تعز - التحرير",
    marker: "داعم مركز البراء بن مالك",
    legacyMarker: "FINANCE-DEMO-DONOR-BARAA"
  });

  await ensureReceivedDonation(scope, {
    donorId: publicDonor.id,
    amount: 4_000_000,
    purpose: "دعم عام لأنشطة الجمعية",
    marker: "تبرع دعم عام للجمعية",
    legacyMarker: "FINANCE-DEMO-DONATION-ORG"
  });
  await ensureReceivedDonation(scope, {
    donorId: merchantDonor.id,
    centerId: darCenter.id,
    amount: 500_000,
    purpose: "دعم تشغيلي لمركز دار القرآن",
    marker: "تبرع تشغيلي لمركز دار القرآن",
    legacyMarker: "FINANCE-DEMO-DONATION-DAR",
    method: PaymentMethod.TRANSFER
  });
  await ensureReceivedDonation(scope, {
    donorId: associationDonor.id,
    centerId: baraaCenter.id,
    amount: 450_000,
    purpose: "دعم تعليمي لمركز البراء بن مالك",
    marker: "تبرع تعليمي لمركز البراء بن مالك",
    legacyMarker: "FINANCE-DEMO-DONATION-BARAA"
  });

  await ensurePostedTransfer(scope, {
    fromAccountId: orgFund.id,
    toAccountId: darFund.id,
    amount: 800_000,
    marker: "تمويل مركز دار القرآن",
    legacyMarker: "FINANCE-DEMO-TRANSFER-DAR"
  });
  await ensurePostedTransfer(scope, {
    fromAccountId: orgFund.id,
    toAccountId: baraaFund.id,
    amount: 700_000,
    marker: "تمويل مركز البراء بن مالك",
    legacyMarker: "FINANCE-DEMO-TRANSFER-BARAA"
  });

  let supplier = await prisma.supplier.findFirst({
    where: {
      organizationId: organization.id,
      notes: { in: ["مورد الخدمات التشغيلية", "FINANCE-DEMO-SUPPLIER"] }
    }
  });
  if (supplier) {
    supplier = await prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        name: "مؤسسة الأمانة للخدمات",
        address: "تعز - شارع جمال",
        notes: "مورد الخدمات التشغيلية",
        isActive: true
      }
    });
  } else {
    supplier = await expensesService.createSupplier(scope, {
      name: "مؤسسة الأمانة للخدمات",
      address: "تعز - شارع جمال",
      notes: "مورد الخدمات التشغيلية"
    });
  }
  let educationalSupplier = await prisma.supplier.findFirst({
    where: { organizationId: organization.id, notes: "مورد الوسائل التعليمية" }
  });
  if (!educationalSupplier) {
    educationalSupplier = await expensesService.createSupplier(scope, {
      name: "مكتبة النور للوسائل التعليمية",
      address: "تعز - باب موسى",
      notes: "مورد الوسائل التعليمية"
    });
  }

  let operatingCategory = await prisma.expenseCategory.findFirst({
    where: {
      organizationId: organization.id,
      name: { in: ["تشغيل وخدمات", "تشغيل وخدمات - تجريبي"] }
    }
  });
  if (operatingCategory) {
    operatingCategory = await prisma.expenseCategory.update({
      where: { id: operatingCategory.id },
      data: { name: "تشغيل وخدمات" }
    });
  } else {
    operatingCategory = await expensesService.createExpenseCategory(scope, {
      name: "تشغيل وخدمات",
      type: "OPERATING",
      accountingAccountId: account("OPERATING_EXPENSES").id
    });
  }
  let educationalCategory = await prisma.expenseCategory.findFirst({
    where: {
      organizationId: organization.id,
      name: { in: ["مواد ووسائل تعليمية", "مواد تعليمية - تجريبي"] }
    }
  });
  if (educationalCategory) {
    educationalCategory = await prisma.expenseCategory.update({
      where: { id: educationalCategory.id },
      data: { name: "مواد ووسائل تعليمية" }
    });
  } else {
    educationalCategory = await expensesService.createExpenseCategory(scope, {
      name: "مواد ووسائل تعليمية",
      type: "EDUCATIONAL",
      accountingAccountId: account("EDUCATIONAL_EXPENSES").id
    });
  }

  await ensureExpense(scope, {
    centerId: darCenter.id,
    supplierId: supplier.id,
    categoryId: operatingCategory.id,
    financeAccountId: darFund.id,
    invoiceNo: `دار-تشغيل-${year}-${monthText}`,
    legacyInvoiceNo: `DEMO-DAR-${year}-${monthText}`,
    description: "كهرباء ومياه ونظافة مركز دار القرآن",
    amount: 120_000
  });
  await ensureExpense(scope, {
    centerId: baraaCenter.id,
    supplierId: educationalSupplier.id,
    categoryId: educationalCategory.id,
    financeAccountId: baraaFund.id,
    invoiceNo: `البراء-تعليم-${year}-${monthText}`,
    legacyInvoiceNo: `DEMO-BARAA-${year}-${monthText}`,
    description: "مستلزمات حلقات ووسائل تعليمية لمركز البراء",
    amount: 90_000
  });

  await ensurePayroll(scope, {
    centerId: darCenter.id,
    userId: teacherOne.id,
    amount: 220_000,
    marker: "رواتب مركز دار القرآن"
  });
  await ensurePayroll(scope, {
    centerId: baraaCenter.id,
    userId: teacherTwo.id,
    amount: 210_000,
    marker: "رواتب مركز البراء بن مالك"
  });
  await ensureReward(scope, {
    centerId: darCenter.id,
    studentId: studentOne.id,
    amount: 25_000,
    marker: "مكافآت طلاب مركز دار القرآن"
  });
  await ensureReward(scope, {
    centerId: baraaCenter.id,
    studentId: studentTwo.id,
    amount: 20_000,
    marker: "مكافآت طلاب مركز البراء بن مالك"
  });

  let assetCategory = await prisma.assetCategory.findFirst({
    where: {
      organizationId: organization.id,
      name: { in: ["أجهزة وتجهيزات تعليمية", "أجهزة وتجهيزات تعليمية - تجريبي"] }
    }
  });
  if (assetCategory) {
    assetCategory = await prisma.assetCategory.update({
      where: { id: assetCategory.id },
      data: { name: "أجهزة وتجهيزات تعليمية" }
    });
  } else {
    assetCategory = await assetsService.createAssetCategory(scope, {
      name: "أجهزة وتجهيزات تعليمية",
      assetAccountId: account("COMPUTERS_EQUIPMENT").id,
      depreciationExpenseAccountId: account("DEPRECIATION_EXPENSE").id,
      accumulatedDepreciationAccountId: account("ACCUMULATED_DEPRECIATION_EQUIPMENT").id,
      usefulLifeMonths: 60
    });
  }
  await ensureAsset(scope, {
    centerId: darCenter.id,
    categoryId: assetCategory.id,
    financeAccountId: darFund.id,
    custodianUserId: teacherOne.id,
    assetCode: `أصل-دار-001-${year}`,
    legacyAssetCode: `DEMO-DAR-PROJECTOR-${year}`,
    name: "جهاز عرض للحلقات التعليمية",
    cost: 240_000
  });
  await ensureAsset(scope, {
    centerId: baraaCenter.id,
    categoryId: assetCategory.id,
    financeAccountId: baraaFund.id,
    custodianUserId: teacherTwo.id,
    assetCode: `أصل-البراء-001-${year}`,
    legacyAssetCode: `DEMO-BARAA-LAPTOP-${year}`,
    name: "حاسوب محمول لإدارة المركز",
    cost: 300_000
  });

  await verifyLocalFinanceData(organization.id, [studentOne.id, studentTwo.id]);

  console.log("Finance local seed completed without deletes or resets.");
  console.log("Local finance login:");
  console.log("  identifier: finance.taiz@local.invalid");
  console.log("  fallback admin: admin.taiz@local.invalid");
  console.log(`  password: ${DEMO_PASSWORD}`);
};

main()
  .catch((error) => {
    console.error("Finance demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
