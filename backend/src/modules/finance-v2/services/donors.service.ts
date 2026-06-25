import {
  DonationStatus,
  DonorType,
  PaymentMethod,
  Prisma,
  VoucherAccountingCategory,
  VoucherSourceType,
  VoucherStatus,
  VoucherType
} from "@prisma/client";
import { prisma } from "../../../shared/db/prisma";
import type { ScopeContext } from "../../../shared/types/auth.types";
import { financeV2Domain } from "../finance-v2.domain";
import { accountSelect, nextVoucherNoTx, normalize, voucherSelect } from "../finance-v2.internal";
import { resolveCurrencyAmountTx, type CurrencyAmountInput } from "./currency-amount.helper";

const donorSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  name: true,
  donorType: true,
  phone: true,
  email: true,
  address: true,
  contactPerson: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  donations: {
    select: {
      id: true,
      amount: true,
      status: true
    }
  }
} satisfies Prisma.DonorSelect;

const donationSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  donorId: true,
  amount: true,
  // FA-UX-4B: currency fields are exposed for display/print only.
  originalAmount: true,
  originalCurrencyCode: true,
  exchangeRateToBase: true,
  donationDate: true,
  paymentMethod: true,
  purpose: true,
  status: true,
  isPledge: true,
  pledgeDueDate: true,
  receivedDate: true,
  voucherId: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  donor: {
    select: {
      id: true,
      name: true,
      donorType: true,
      phone: true
    }
  },
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  voucher: {
    select: {
      id: true,
      voucherNo: true,
      status: true,
      voucherType: true,
      accountingCategory: true
    }
  }
} satisfies Prisma.DonationSelect;

type DonorInput = {
  centerId?: number | null;
  name: string;
  donorType: DonorType;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

type DonationInput = {
  centerId?: number | null;
  donorId: number;
  amount?: number;
  // FA-UX-4B: optional currency triple. amount remains the YER base amount.
  originalAmount?: number;
  originalCurrencyCode?: string;
  exchangeRateToBase?: number;
  donationDate: string;
  paymentMethod: PaymentMethod;
  purpose?: string | null;
  status?: DonationStatus;
  isPledge?: boolean;
  pledgeDueDate?: string | null;
  receivedDate?: string | null;
  notes?: string | null;
};

const nullableText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const parseDate = (value: string, fieldName: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw financeV2Domain.financeError(`Invalid ${fieldName}`, 400, "VALIDATION_ERROR");
  }
  return parsed;
};

const centerScopeWhere = (scope: ScopeContext, centerId?: number): Prisma.DonorWhereInput => {
  financeV2Domain.ensureCenterAllowed(scope, centerId);
  const centerScope = financeV2Domain.resolveCenterScope(scope, centerId);
  return centerScope?.length ? { OR: [{ centerId: { in: centerScope } }, { centerId: null }] } : {};
};

const donationCenterScopeWhere = (
  scope: ScopeContext,
  centerId?: number
): Prisma.DonationWhereInput => {
  financeV2Domain.ensureCenterAllowed(scope, centerId);
  const centerScope = financeV2Domain.resolveCenterScope(scope, centerId);
  return centerScope?.length ? { OR: [{ centerId: { in: centerScope } }, { centerId: null }] } : {};
};

const resolveDonationAccountTx = async (
  tx: Prisma.TransactionClient,
  scope: ScopeContext,
  centerId: number | null
) => {
  const account = await tx.financeAccount.findFirst({
    where: {
      organizationId: scope.organizationId,
      isActive: true,
      ...(centerId ? { centerId, accountType: "CENTER_FUND" } : { centerId: null, accountType: "ORG_FUND" })
    },
    orderBy: { id: "asc" },
    select: accountSelect
  });

  if (!account) {
    throw financeV2Domain.financeError("Donation receipt finance account is missing", 409, "FINANCE_ACCOUNT_MISSING");
  }

  return account;
};

const createReceiptVoucherTx = async (
  tx: Prisma.TransactionClient,
  scope: ScopeContext,
  input: {
    donationId: number;
    centerId: number | null;
    amount: Prisma.Decimal;
    // FA-UX-4B: mirror the donation's currency fields onto the receipt voucher
    // for documentation/printing only. JournalEntry posting still consumes the
    // YER base amount via voucher.amount.
    originalAmount: Prisma.Decimal;
    originalCurrencyCode: string;
    exchangeRateToBase: Prisma.Decimal;
    paymentMethod: PaymentMethod;
    purpose?: string | null;
    donorName: string;
    notes?: string | null;
  }
) => {
  const account = await resolveDonationAccountTx(tx, scope, input.centerId);

  return tx.financeVoucher.create({
    data: {
      organizationId: scope.organizationId,
      centerId: input.centerId,
      accountId: account.id,
      voucherType: VoucherType.RECEIPT,
      voucherNo: await nextVoucherNoTx(tx, "DON", scope.organizationId),
      sourceType: VoucherSourceType.MANUAL,
      sourceId: input.donationId,
      paymentMethod: input.paymentMethod,
      amount: input.amount,
      originalAmount: input.originalAmount,
      originalCurrencyCode: input.originalCurrencyCode,
      exchangeRateToBase: input.exchangeRateToBase,
      status: VoucherStatus.DRAFT,
      accountingCategory: VoucherAccountingCategory.DONATION,
      notes: [input.purpose, `Donor: ${input.donorName}`, input.notes].filter(Boolean).join(" - ") || null,
      createdById: scope.userId
    },
    select: voucherSelect
  });
};

export const donorsService = {
  async listDonors(scope: ScopeContext, query: { centerId?: number; isActive?: boolean; page?: number; pageSize?: number }) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);

    const pagination = financeV2Domain.resolvePagination(query.page, query.pageSize);
    const where: Prisma.DonorWhereInput = {
      organizationId: scope.organizationId,
      ...centerScopeWhere(scope, query.centerId),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {})
    };

    const [rows, total] = await Promise.all([
      prisma.donor.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        select: donorSelect
      }),
      prisma.donor.count({ where })
    ]);

    return normalize({ rows, total, page: pagination.page, pageSize: pagination.pageSize });
  },

  async getDonor(scope: ScopeContext, donorId: number) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);

    const donor = await prisma.donor.findFirst({
      where: { id: donorId, organizationId: scope.organizationId },
      select: donorSelect
    });
    if (!donor) throw financeV2Domain.financeError("Donor not found", 404, "ENTITY_NOT_FOUND");
    financeV2Domain.ensureCenterAllowed(scope, donor.centerId);

    return normalize(donor);
  },

  async createDonor(scope: ScopeContext, input: DonorInput) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);
    financeV2Domain.ensureCenterAllowed(scope, input.centerId);

    const donor = await prisma.donor.create({
      data: {
        organizationId: scope.organizationId,
        centerId: input.centerId ?? null,
        name: input.name.trim(),
        donorType: input.donorType,
        phone: nullableText(input.phone),
        email: nullableText(input.email),
        address: nullableText(input.address),
        contactPerson: nullableText(input.contactPerson),
        notes: nullableText(input.notes),
        isActive: input.isActive ?? true
      },
      select: donorSelect
    });

    return normalize(donor);
  },

  async updateDonor(scope: ScopeContext, donorId: number, input: Partial<DonorInput>) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const existing = await prisma.donor.findFirst({
      where: { id: donorId, organizationId: scope.organizationId },
      select: { id: true, centerId: true }
    });
    if (!existing) throw financeV2Domain.financeError("Donor not found", 404, "ENTITY_NOT_FOUND");
    financeV2Domain.ensureCenterAllowed(scope, existing.centerId);
    if (input.centerId !== undefined) financeV2Domain.ensureCenterAllowed(scope, input.centerId);

    const donor = await prisma.donor.update({
      where: { id: existing.id },
      data: {
        ...(input.centerId !== undefined ? { centerId: input.centerId ?? null } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.donorType !== undefined ? { donorType: input.donorType } : {}),
        ...(input.phone !== undefined ? { phone: nullableText(input.phone) } : {}),
        ...(input.email !== undefined ? { email: nullableText(input.email) } : {}),
        ...(input.address !== undefined ? { address: nullableText(input.address) } : {}),
        ...(input.contactPerson !== undefined ? { contactPerson: nullableText(input.contactPerson) } : {}),
        ...(input.notes !== undefined ? { notes: nullableText(input.notes) } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
      },
      select: donorSelect
    });

    return normalize(donor);
  },

  async listDonations(scope: ScopeContext, query: { centerId?: number; donorId?: number; status?: DonationStatus; page?: number; pageSize?: number }) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);

    const pagination = financeV2Domain.resolvePagination(query.page, query.pageSize);
    const where: Prisma.DonationWhereInput = {
      organizationId: scope.organizationId,
      ...donationCenterScopeWhere(scope, query.centerId),
      ...(query.donorId ? { donorId: query.donorId } : {}),
      ...(query.status ? { status: query.status } : {})
    };

    const [rows, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        orderBy: [{ donationDate: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        select: donationSelect
      }),
      prisma.donation.count({ where })
    ]);

    return normalize({ rows, total, page: pagination.page, pageSize: pagination.pageSize });
  },

  async getDonationReport(
    scope: ScopeContext,
    query: {
      dateFrom?: string;
      dateTo?: string;
      centerId?: number;
      donorId?: number;
      status?: DonationStatus;
      paymentMethod?: PaymentMethod;
      currencyCode?: string;
      search?: string;
    }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);

    const where: Prisma.DonationWhereInput = {
      organizationId: scope.organizationId,
      ...donationCenterScopeWhere(scope, query.centerId),
      ...(query.donorId ? { donorId: query.donorId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.paymentMethod ? { paymentMethod: query.paymentMethod } : {}),
      ...(query.dateFrom || query.dateTo ? {
        donationDate: {
          ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
          ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
        }
      } : {}),
      ...(query.currencyCode ? { originalCurrencyCode: query.currencyCode.toUpperCase() } : {}),
      ...(query.search ? {
        OR: [
          { notes: { contains: query.search, mode: "insensitive" } },
          { purpose: { contains: query.search, mode: "insensitive" } },
          { donor: { name: { contains: query.search, mode: "insensitive" } } },
        ]
      } : {}),
    };

    const [rows, summaryResult] = await Promise.all([
      prisma.donation.findMany({
        where,
        orderBy: [{ donationDate: "desc" }, { id: "desc" }],
        select: donationSelect
      }),
      prisma.donation.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalAmount = Number(summaryResult._sum.amount ?? 0);
    const totalCount = summaryResult._count;
    const receivedRows = rows.filter(r => r.status === DonationStatus.RECEIVED);
    const receivedTotal = receivedRows.reduce((sum, r) => sum + Number(r.amount), 0);
    const receivedCount = receivedRows.length;

    // Last donation date
    const lastDonation = rows.length > 0 ? rows[0].donationDate : null;

    return normalize({
      rows,
      total: totalCount,
      summary: {
        totalAmount,
        totalCount,
        receivedAmount: receivedTotal,
        receivedCount,
        pledgedCount: totalCount - receivedCount,
        lastDonationDate: lastDonation,
      }
    });
  },

  async createDonation(scope: ScopeContext, input: DonationInput) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const result = await prisma.$transaction(async (tx) => {
      const donor = await tx.donor.findFirst({
        where: { id: input.donorId, organizationId: scope.organizationId, isActive: true },
        select: { id: true, name: true, centerId: true }
      });
      if (!donor) throw financeV2Domain.financeError("Donor not found", 404, "ENTITY_NOT_FOUND");

      const centerId = input.centerId ?? donor.centerId ?? null;
      financeV2Domain.ensureCenterAllowed(scope, centerId);
      if (donor.centerId && centerId && donor.centerId !== centerId) {
        throw financeV2Domain.financeError("Donation center must match donor center", 400, "VALIDATION_ERROR");
      }

      const requestedReceived = input.status === DonationStatus.RECEIVED || input.isPledge === false;
      const status = requestedReceived ? DonationStatus.RECEIVED : DonationStatus.PLEDGED;

      // FA-UX-4B: derive YER base amount from the optional currency triple.
      const resolved = await resolveCurrencyAmountTx(tx, scope.organizationId, {
        amount: input.amount,
        originalAmount: input.originalAmount,
        originalCurrencyCode: input.originalCurrencyCode,
        exchangeRateToBase: input.exchangeRateToBase
      });

      const donation = await tx.donation.create({
        data: {
          organizationId: scope.organizationId,
          centerId,
          donorId: donor.id,
          amount: resolved.amount,
          originalAmount: resolved.originalAmount,
          originalCurrencyCode: resolved.originalCurrencyCode,
          exchangeRateToBase: resolved.exchangeRateToBase,
          donationDate: parseDate(input.donationDate, "donationDate"),
          paymentMethod: input.paymentMethod,
          purpose: nullableText(input.purpose),
          status,
          isPledge: status === DonationStatus.PLEDGED,
          pledgeDueDate: status === DonationStatus.PLEDGED && input.pledgeDueDate ? parseDate(input.pledgeDueDate, "pledgeDueDate") : null,
          receivedDate: status === DonationStatus.RECEIVED ? parseDate(input.receivedDate || input.donationDate, "receivedDate") : null,
          notes: nullableText(input.notes)
        },
        select: donationSelect
      });

      if (status !== DonationStatus.RECEIVED) {
        return donation;
      }

      const voucher = await createReceiptVoucherTx(tx, scope, {
        donationId: donation.id,
        centerId,
        amount: resolved.amount,
        originalAmount: resolved.originalAmount,
        originalCurrencyCode: resolved.originalCurrencyCode,
        exchangeRateToBase: resolved.exchangeRateToBase,
        paymentMethod: input.paymentMethod,
        purpose: donation.purpose,
        donorName: donor.name,
        notes: donation.notes
      });

      return tx.donation.update({
        where: { id: donation.id },
        data: { voucherId: voucher.id },
        select: donationSelect
      });
    });

    return normalize(result);
  },

  async receiveDonation(
    scope: ScopeContext,
    donationId: number,
    input: { paymentMethod?: PaymentMethod; receivedDate?: string; exchangeRateToBase?: number; notes?: string | null }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findFirst({
        where: { id: donationId, organizationId: scope.organizationId },
        select: donationSelect
      });
      if (!donation) throw financeV2Domain.financeError("Donation not found", 404, "ENTITY_NOT_FOUND");
      financeV2Domain.ensureCenterAllowed(scope, donation.centerId);
      if (donation.status !== DonationStatus.PLEDGED || donation.voucherId) {
        throw financeV2Domain.financeError("Donation is already received or not receivable", 409, "INVALID_STATE_TRANSITION");
      }

      const paymentMethod = input.paymentMethod ?? donation.paymentMethod;

      // FA-UX-4B: if the pledge was made in a foreign currency, recompute the
      // YER base amount using the (possibly fresh) exchangeRateToBase supplied
      // at receipt time. The donation row is updated to reflect the realized
      // rate so the receipt voucher and the donation stay consistent.
      const pledgedCode = (donation.originalCurrencyCode ?? "YER").toUpperCase();
      const pledgedOriginal = donation.originalAmount
        ? Number(donation.originalAmount)
        : Number(donation.amount);
      const overrideRate = input.exchangeRateToBase;
      const currencyInput: CurrencyAmountInput =
        pledgedCode === "YER"
          ? { originalCurrencyCode: "YER", originalAmount: pledgedOriginal }
          : {
              originalCurrencyCode: pledgedCode,
              originalAmount: pledgedOriginal,
              exchangeRateToBase:
                overrideRate ??
                (donation.exchangeRateToBase ? Number(donation.exchangeRateToBase) : undefined)
            };
      const resolved = await resolveCurrencyAmountTx(tx, scope.organizationId, currencyInput);

      const voucher = await createReceiptVoucherTx(tx, scope, {
        donationId: donation.id,
        centerId: donation.centerId,
        amount: resolved.amount,
        originalAmount: resolved.originalAmount,
        originalCurrencyCode: resolved.originalCurrencyCode,
        exchangeRateToBase: resolved.exchangeRateToBase,
        paymentMethod,
        purpose: donation.purpose,
        donorName: donation.donor.name,
        notes: input.notes ?? donation.notes
      });

      return tx.donation.update({
        where: { id: donation.id },
        data: {
          status: DonationStatus.RECEIVED,
          isPledge: false,
          paymentMethod,
          // Persist realized base + rate so the donation row reflects what was actually received.
          amount: resolved.amount,
          originalAmount: resolved.originalAmount,
          originalCurrencyCode: resolved.originalCurrencyCode,
          exchangeRateToBase: resolved.exchangeRateToBase,
          receivedDate: parseDate(input.receivedDate || new Date().toISOString(), "receivedDate"),
          voucherId: voucher.id,
          notes: nullableText(input.notes) ?? donation.notes
        },
        select: donationSelect
      });
    });

    return normalize(result);
  }
};
