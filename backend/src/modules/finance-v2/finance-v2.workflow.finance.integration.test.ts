import {
  DonationStatus,
  DonorType,
  PaymentMethod,
  VoucherAccountingCategory,
  VoucherSourceType,
  VoucherStatus,
  VoucherType
} from "@prisma/client";
import { accountingService as financeAccountingService } from "./services/accounting.service";
import { donorsService } from "./services/donors.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";
import { TAIZ_FINANCE_FIXTURE } from "../../test/finance/fixtures/taiz-finance.fixture";

describe("finance voucher workflow integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  test("moves a receipt through draft, approval, posting, movement, journal, and reversal", async () => {
    const context = await createTaizFinanceContext();
    const amount = 53000;
    const before = context.accounts.orgFund.currentBalance.toNumber();

    const draft = await financeAccountingService.createVoucher(context.scopes.treasurer, {
      accountId: context.accounts.orgFund.id,
      voucherType: VoucherType.RECEIPT,
      sourceType: VoucherSourceType.MANUAL,
      paymentMethod: PaymentMethod.CASH,
      amount,
      originalAmount: 100,
      originalCurrencyCode: "USD",
      exchangeRateToBase: TAIZ_FINANCE_FIXTURE.currency.usdRateToYer,
      accountingCategory: VoucherAccountingCategory.DONATION,
      voucherDate: new Date(TAIZ_FINANCE_FIXTURE.dates.openPeriod),
      notes: "تبرع دولاري اختباري"
    });
    expect(draft.status).toBe(VoucherStatus.DRAFT);
    expect(draft.amount).toBe(amount);

    const submitted = await financeAccountingService.submitVoucher(context.scopes.treasurer, draft.id, {});
    expect(submitted.status).toBe(VoucherStatus.SUBMITTED);
    const approved = await financeAccountingService.approveVoucher(context.scopes.manager, draft.id, {});
    expect(approved.status).toBe(VoucherStatus.APPROVED);
    const posted = await financeAccountingService.postVoucher(context.scopes.treasurer, draft.id, {});
    expect(posted.voucher.status).toBe(VoucherStatus.POSTED);

    const [account, movement, journal] = await Promise.all([
      financeTestPrisma.financeAccount.findUniqueOrThrow({ where: { id: context.accounts.orgFund.id } }),
      financeTestPrisma.financeAccountMovement.findUniqueOrThrow({ where: { voucherId: draft.id } }),
      financeTestPrisma.journalEntry.findFirstOrThrow({
        where: { organizationId: context.organization.id, sourceId: draft.id, sourceType: "VOUCHER" },
        include: { lines: true }
      })
    ]);
    expect(account.currentBalance.toNumber()).toBe(before + amount);
    expect(movement.balanceAfter.toNumber()).toBe(before + amount);
    expect(journal.lines.reduce((sum, line) => sum + line.debit.toNumber(), 0)).toBe(amount);
    expect(journal.lines.reduce((sum, line) => sum + line.credit.toNumber(), 0)).toBe(amount);

    await financeAccountingService.requestVoucherVoid(context.scopes.treasurer, draft.id, {
      reason: "إلغاء اختباري"
    });
    const reversed = await financeAccountingService.approveVoucherVoid(context.scopes.manager, draft.id, {
      reason: "إلغاء اختباري"
    });
    expect(reversed.voucher.status).toBe(VoucherStatus.VOIDED);

    const afterReversal = await financeTestPrisma.financeAccount.findUniqueOrThrow({
      where: { id: context.accounts.orgFund.id }
    });
    expect(afterReversal.currentBalance.toNumber()).toBe(before);
    expect(
      await financeTestPrisma.journalEntry.count({
        where: { organizationId: context.organization.id, sourceType: "VOUCHER" }
      })
    ).toBe(2);
  });

  test("treasurer receipt creates a linked voucher and audit record", async () => {
    const context = await createTaizFinanceContext();
    const donor = await financeTestPrisma.donor.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        name: "Treasurer receipt test donor",
        donorType: DonorType.INDIVIDUAL_DONOR
      }
    });

    const donation = await donorsService.createDonation(
      context.scopes.treasurer,
      {
        centerId: context.centers[0].id,
        donorId: donor.id,
        amount: 25000,
        donationDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
        receivedDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
        paymentMethod: PaymentMethod.CASH,
        status: DonationStatus.RECEIVED,
        isPledge: false
      }
    );

    expect(donation.voucherId).toEqual(expect.any(Number));
    const voucher = await financeTestPrisma.financeVoucher.findUniqueOrThrow({
      where: { id: donation.voucherId! }
    });
    expect(voucher.voucherType).toBe(VoucherType.RECEIPT);
    expect(voucher.createdById).toBe(context.users.treasurer.id);
    await expect(
      financeTestPrisma.auditLog.findFirst({
        where: { entityType: "VOUCHER", entityId: voucher.id, action: "CREATE" }
      })
    ).resolves.not.toBeNull();
  });
});

