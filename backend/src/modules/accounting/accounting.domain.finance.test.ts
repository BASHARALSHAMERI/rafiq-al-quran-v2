import {
  FundTransferStatus,
  InvoiceStatus,
  PayrollBatchStatus,
  RewardBatchStatus,
  Role,
  VoucherStatus
} from "@prisma/client";
import { createJournalEntryBodySchema } from "./accounting.validation";
import { financeV2Domain } from "../finance-v2/finance-v2.domain";

const scope = (role: Role) => ({
  userId: 1,
  organizationId: 1,
  role,
  allAccess: false,
  centerIds: [10],
  circleIds: [],
  studentIds: [20]
});

describe("finance/accounting domain safety net", () => {
  test("journal validation requires at least two valid debit/credit lines", () => {
    const base = {
      entryDate: "2031-01-15",
      sourceType: "MANUAL" as const
    };

    expect(createJournalEntryBodySchema.safeParse({ ...base, lines: [] }).success).toBe(false);
    expect(
      createJournalEntryBodySchema.safeParse({
        ...base,
        lines: [
          { accountId: 1, debit: 100, credit: 0 },
          { accountId: 2, debit: 0, credit: 100 }
        ]
      }).success
    ).toBe(true);
    expect(
      createJournalEntryBodySchema.safeParse({
        ...base,
        lines: [
          { accountId: 1, debit: 100, credit: 100 },
          { accountId: 2, debit: 0, credit: 0 }
        ]
      }).success
    ).toBe(false);
  });

  test("money and invoice status calculations are deterministic", () => {
    expect(financeV2Domain.toMoney(financeV2Domain.toDecimal(10.129))).toBe(10.13);
    expect(financeV2Domain.resolveInvoiceStatus(financeV2Domain.toDecimal(0), financeV2Domain.toDecimal(100))).toBe(
      InvoiceStatus.PENDING
    );
    expect(financeV2Domain.resolveInvoiceStatus(financeV2Domain.toDecimal(40), financeV2Domain.toDecimal(100))).toBe(
      InvoiceStatus.PARTIAL
    );
    expect(financeV2Domain.resolveInvoiceStatus(financeV2Domain.toDecimal(100), financeV2Domain.toDecimal(100))).toBe(
      InvoiceStatus.PAID
    );
  });

  test.each([
    [VoucherStatus.DRAFT, VoucherStatus.SUBMITTED, "voucher"],
    [PayrollBatchStatus.DRAFT, PayrollBatchStatus.SUBMITTED, "payroll"],
    [RewardBatchStatus.DRAFT, RewardBatchStatus.SUBMITTED, "reward"],
    [FundTransferStatus.DRAFT, FundTransferStatus.SUBMITTED, "transfer"]
  ])("allows the declared %s to %s transition for %s", (from, to, kind) => {
    if (kind === "voucher") financeV2Domain.assertVoucherTransition(from as VoucherStatus, to as VoucherStatus);
    if (kind === "payroll") {
      financeV2Domain.assertPayrollBatchTransition(from as PayrollBatchStatus, to as PayrollBatchStatus);
    }
    if (kind === "reward") {
      financeV2Domain.assertRewardBatchTransition(from as RewardBatchStatus, to as RewardBatchStatus);
    }
    if (kind === "transfer") {
      financeV2Domain.assertFundTransferTransition(from as FundTransferStatus, to as FundTransferStatus);
    }
  });

  test("rejects invalid state transitions and out-of-scope centers", () => {
    expect(() => financeV2Domain.assertVoucherTransition(VoucherStatus.DRAFT, VoucherStatus.POSTED)).toThrow(
      "Invalid state transition"
    );
    expect(() => financeV2Domain.ensureCenterAllowed(scope(Role.ACCOUNTANT), 11)).toThrow("Finance scope denied");
    expect(() => financeV2Domain.ensureStudentAllowed(scope(Role.PARENT), 21)).toThrow("Finance scope denied");
  });

  test("restricts write and approval capabilities by role", () => {
    expect(() => financeV2Domain.assertCanWrite(scope(Role.ACCOUNTANT))).not.toThrow();
    expect(() => financeV2Domain.assertCanWrite(scope(Role.TREASURER))).toThrow("Finance scope denied");
    expect(() => financeV2Domain.assertCanApprove(scope(Role.FINANCE_MANAGER))).not.toThrow();
    expect(() => financeV2Domain.assertCanApprove(scope(Role.ACCOUNTANT))).toThrow("Finance scope denied");
  });
    expect(() => financeV2Domain.assertCanManageSettings(scope(Role.FINANCE_MANAGER))).not.toThrow();
    expect(() => financeV2Domain.assertCanManageSettings(scope(Role.ACCOUNTANT))).toThrow("Finance scope denied");
    expect(() => financeV2Domain.assertCanExecute(scope(Role.TREASURER))).not.toThrow();
    expect(() => financeV2Domain.assertCanExecute(scope(Role.ACCOUNTANT))).toThrow("Finance scope denied");
    expect(() => financeV2Domain.assertCanExecute(scope(Role.FINANCE_MANAGER))).toThrow(
      "Finance scope denied"
    );
});

