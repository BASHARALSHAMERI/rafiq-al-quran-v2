import { JournalEntryStatus, JournalSourceType, Role } from "@prisma/client";
import { accountingService } from "../src/modules/accounting/accounting.service";
import { prisma } from "../src/shared/db/prisma";
import type { ScopeContext } from "../src/shared/types/auth.types";

const toNumber = (value: unknown): number => {
  if (value && typeof value === "object" && "toString" in value) {
    return Number(value.toString());
  }
  return Number(value ?? 0);
};

const pickOrganization = async () => {
  const organization = await prisma.organization.findFirst({
    orderBy: { id: "asc" },
    select: { id: true }
  });
  if (!organization) {
    throw new Error("No organization found for FA-2 verification");
  }
  return organization;
};

const pickSuperAdmin = async (organizationId: number) => {
  const user = await prisma.user.findFirst({
    where: { organizationId, role: Role.SUPER_ADMIN },
    orderBy: { id: "asc" },
    select: { id: true }
  });
  if (!user) {
    throw new Error("No SUPER_ADMIN user found for FA-2 verification");
  }
  return user;
};

const getAccount = async (organizationId: number, code: string) => {
  const account = await prisma.accountingAccount.findUnique({
    where: {
      organizationId_code: {
        organizationId,
        code
      }
    },
    select: { id: true, code: true, name: true }
  });
  if (!account) {
    throw new Error(`Accounting account ${code} not found`);
  }
  return account;
};

const sumLedgerRows = (rows: Array<{ debit: unknown; credit: unknown }>) =>
  rows.reduce(
    (totals, row) => ({
      debit: totals.debit + toNumber(row.debit),
      credit: totals.credit + toNumber(row.credit)
    }),
    { debit: 0, credit: 0 }
  );

const main = async () => {
  const organization = await pickOrganization();
  const superAdmin = await pickSuperAdmin(organization.id);
  const cash = await getAccount(organization.id, "1100");
  const donations = await getAccount(organization.id, "4200");
  const suffix = Date.now().toString(36).toUpperCase();

  const scope: ScopeContext = {
    userId: superAdmin.id,
    role: Role.SUPER_ADMIN,
    organizationId: organization.id,
    allAccess: true,
    centerIds: [],
    circleIds: [],
    studentIds: []
  };

  const balanced = await accountingService.createJournalEntry(scope, {
    entryNo: `FA2-BAL-${suffix}`,
    entryDate: new Date().toISOString(),
    sourceType: JournalSourceType.MANUAL,
    description: "Manual donation test entry for FA-2 verification",
    lines: [
      {
        accountId: cash.id,
        debit: 1000,
        credit: 0,
        memo: "FA-2 cash debit"
      },
      {
        accountId: donations.id,
        debit: 0,
        credit: 1000,
        memo: "FA-2 donation credit"
      }
    ]
  });

  if (!balanced) {
    throw new Error("Balanced journal entry was not created");
  }

  const balancedEntry = await prisma.journalEntry.findUniqueOrThrow({
    where: { id: balanced.id },
    include: { lines: true }
  });

  const balancedDraftTotals = sumLedgerRows(balancedEntry.lines);
  const trialBeforePost = await accountingService.getTrialBalance(scope, {});

  const unbalanced = await accountingService.createJournalEntry(scope, {
    entryNo: `FA2-UNBAL-${suffix}`,
    entryDate: new Date().toISOString(),
    sourceType: JournalSourceType.MANUAL,
    description: "Manual unbalanced test entry for FA-2 verification",
    lines: [
      {
        accountId: cash.id,
        debit: 1000,
        credit: 0,
        memo: "FA-2 unbalanced cash debit"
      },
      {
        accountId: donations.id,
        debit: 0,
        credit: 900,
        memo: "FA-2 unbalanced donation credit"
      }
    ]
  });

  let unbalancedPostRejected = false;
  let unbalancedPostMessage = "";

  try {
    await accountingService.postJournalEntry(scope, unbalanced.id);
  } catch (error) {
    unbalancedPostRejected = true;
    unbalancedPostMessage = error instanceof Error ? error.message : String(error);
  }

  const unbalancedAfterPostAttempt = await prisma.journalEntry.findUniqueOrThrow({
    where: { id: unbalanced.id },
    select: { status: true }
  });

  const posted = await accountingService.postJournalEntry(scope, balanced.id);
  const postedEntry = await prisma.journalEntry.findUniqueOrThrow({
    where: { id: balanced.id },
    include: { lines: true }
  });

  let secondPostRejected = false;
  let secondPostMessage = "";

  try {
    await accountingService.postJournalEntry(scope, balanced.id);
  } catch (error) {
    secondPostRejected = true;
    secondPostMessage = error instanceof Error ? error.message : String(error);
  }

  const cashLedger = await accountingService.getLedger(scope, {
    accountId: cash.id
  });
  const donationLedger = await accountingService.getLedger(scope, {
    accountId: donations.id
  });
  const trialAfterPost = await accountingService.getTrialBalance(scope, {});

  const cashFa2Rows = cashLedger.rows.filter((row: { journalEntry?: { id: number } }) => row.journalEntry?.id === balanced.id);
  const donationFa2Rows = donationLedger.rows.filter((row: { journalEntry?: { id: number } }) => row.journalEntry?.id === balanced.id);
  const cashDraftRows = cashLedger.rows.filter((row: { journalEntry?: { id: number } }) => row.journalEntry?.id === unbalanced.id);
  const donationDraftRows = donationLedger.rows.filter((row: { journalEntry?: { id: number } }) => row.journalEntry?.id === unbalanced.id);

  const cashFa2Totals = sumLedgerRows(cashFa2Rows);
  const donationFa2Totals = sumLedgerRows(donationFa2Rows);

  const result = {
    organizationId: organization.id,
    userId: superAdmin.id,
    balancedEntry: {
      id: balanced.id,
      initialStatus: balancedEntry.status,
      lineCount: balancedEntry.lines.length,
      draftDebit: balancedDraftTotals.debit,
      draftCredit: balancedDraftTotals.credit,
      postedStatus: postedEntry.status,
      postedAt: postedEntry.postedAt,
      postedById: postedEntry.postedById,
      secondPostRejected,
      secondPostMessage,
      serviceReturnedStatus: posted.status
    },
    unbalancedEntry: {
      id: unbalanced.id,
      postRejected: unbalancedPostRejected,
      postMessage: unbalancedPostMessage,
      statusAfterPostAttempt: unbalancedAfterPostAttempt.status
    },
    ledger: {
      cashRowsForBalancedEntry: cashFa2Rows.length,
      cashDebitForBalancedEntry: cashFa2Totals.debit,
      cashCreditForBalancedEntry: cashFa2Totals.credit,
      donationRowsForBalancedEntry: donationFa2Rows.length,
      donationDebitForBalancedEntry: donationFa2Totals.debit,
      donationCreditForBalancedEntry: donationFa2Totals.credit,
      draftRowsVisible: cashDraftRows.length + donationDraftRows.length
    },
    trialBalance: {
      beforePostDebit: trialBeforePost.totals.debit,
      beforePostCredit: trialBeforePost.totals.credit,
      afterPostDebit: trialAfterPost.totals.debit,
      afterPostCredit: trialAfterPost.totals.credit,
      balanced: trialAfterPost.totals.debit === trialAfterPost.totals.credit
    },
    expected: {
      balancedDraftStatus: JournalEntryStatus.DRAFT,
      postedStatus: JournalEntryStatus.POSTED,
      unbalancedStatusAfterPostAttempt: JournalEntryStatus.DRAFT
    }
  };

  console.log(JSON.stringify(result, null, 2));
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
