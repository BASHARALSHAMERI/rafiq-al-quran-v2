import {
  AccountingAccountType,
  AccountingNormalBalance,
  FinanceAccountType,
  FiscalPeriodStatus,
  Gender,
  PrismaClient,
  Role
} from "@prisma/client";
import type { ScopeContext } from "../../shared/types/auth.types";
import { TAIZ_FINANCE_FIXTURE } from "./fixtures/taiz-finance.fixture";

export const financeTestPrisma = new PrismaClient();

export const resetFinanceTestDatabase = async () => {
  const rows = await financeTestPrisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;

  if (rows.length === 0) return;
  const quoted = rows.map(({ tablename }) => `"public"."${tablename.replace(/"/g, '""')}"`).join(", ");
  await financeTestPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
};

const user = (organizationId: number, role: Role, key: string, fullName: string) =>
  financeTestPrisma.user.create({
    data: {
      organizationId,
      role,
      email: `${key}@finance-test.invalid`,
      username: `finance_test_${key}`,
      fullName,
      isActive: true
    }
  });

export const scopeFor = (
  actor: { id: number; role: Role; organizationId: number },
  options: { allAccess?: boolean; centerIds?: number[]; studentIds?: number[] } = {}
): ScopeContext => ({
  userId: actor.id,
  role: actor.role,
  organizationId: actor.organizationId,
  allAccess: options.allAccess ?? false,
  centerIds: options.centerIds ?? [],
  circleIds: [],
  studentIds: options.studentIds ?? []
});

export const createTaizFinanceContext = async () => {
  const organization = await financeTestPrisma.organization.create({
    data: TAIZ_FINANCE_FIXTURE.organization
  });

  const financeManager = await user(
    organization.id,
    Role.FINANCE_MANAGER,
    "manager",
    TAIZ_FINANCE_FIXTURE.people.financeManager
  );
  const accountant = await user(
    organization.id,
    Role.ACCOUNTANT,
    "accountant",
    TAIZ_FINANCE_FIXTURE.people.accountant
  );
  const treasurer = await user(
    organization.id,
    Role.TREASURER,
    "treasurer",
    TAIZ_FINANCE_FIXTURE.people.treasurer
  );
  const auditor = await user(
    organization.id,
    Role.AUDITOR,
    "auditor",
    TAIZ_FINANCE_FIXTURE.people.auditor
  );
  const supervisor = await user(
    organization.id,
    Role.SUPERVISOR,
    "supervisor",
    TAIZ_FINANCE_FIXTURE.people.supervisor
  );
  const teacher = await user(
    organization.id,
    Role.TEACHER,
    "teacher",
    TAIZ_FINANCE_FIXTURE.people.teacher
  );
  const parent = await user(
    organization.id,
    Role.PARENT,
    "parent",
    TAIZ_FINANCE_FIXTURE.people.parent
  );
  const student = await user(
    organization.id,
    Role.STUDENT,
    "student",
    TAIZ_FINANCE_FIXTURE.people.student
  );

  await financeTestPrisma.userProfile.createMany({
    data: [
      { userId: teacher.id, fullName: teacher.fullName, gender: Gender.MALE },
      { userId: student.id, fullName: student.fullName, gender: Gender.MALE }
    ]
  });
  await financeTestPrisma.studentProfile.create({ data: { userId: student.id } });

  const centers = [];
  for (const center of TAIZ_FINANCE_FIXTURE.centers) {
    centers.push(
      await financeTestPrisma.center.create({
        data: {
          organizationId: organization.id,
          centerAdminUserId: financeManager.id,
          code: center.code,
          name: center.name,
          locationText: center.locationText,
          timezone: "Asia/Aden"
        }
      })
    );
  }

  await financeTestPrisma.userCenterAccess.createMany({
    data: [
      { userId: accountant.id, centerId: centers[0].id },
      { userId: supervisor.id, centerId: centers[0].id },
      { userId: teacher.id, centerId: centers[0].id },
      { userId: student.id, centerId: centers[0].id }
    ]
  });

  await financeTestPrisma.accountingAccount.createMany({
    data: [
      ["1110", "الصندوق الرئيسي", AccountingAccountType.ASSET, AccountingNormalBalance.DEBIT, "MAIN_CASH"],
      ["1120", "البنك", AccountingAccountType.ASSET, AccountingNormalBalance.DEBIT, "BANK"],
      ["1130", "صناديق المراكز", AccountingAccountType.ASSET, AccountingNormalBalance.DEBIT, "CENTER_FUNDS"],
      ["1140", "ذمم الطلاب", AccountingAccountType.ASSET, AccountingNormalBalance.DEBIT, "STUDENT_RECEIVABLES"],
      ["2130", "ذمم الموردين", AccountingAccountType.LIABILITY, AccountingNormalBalance.CREDIT, "ACCOUNTS_PAYABLE"],
      ["3100", "صافي أصول غير مقيدة", AccountingAccountType.NET_ASSET, AccountingNormalBalance.CREDIT, "UNRESTRICTED_NET_ASSETS"],
      ["4100", "مساهمات الطلاب", AccountingAccountType.REVENUE, AccountingNormalBalance.CREDIT, "STUDENT_CONTRIBUTIONS_REVENUE"],
      ["4200", "إيرادات التبرعات", AccountingAccountType.REVENUE, AccountingNormalBalance.CREDIT, "DONATIONS_REVENUE"],
      ["4300", "إيرادات أخرى", AccountingAccountType.REVENUE, AccountingNormalBalance.CREDIT, "OTHER_REVENUE"],
      ["5100", "الرواتب والمكافآت", AccountingAccountType.EXPENSE, AccountingNormalBalance.DEBIT, "PAYROLL_REWARDS_EXPENSE"],
      ["5200", "مصروفات تشغيلية", AccountingAccountType.EXPENSE, AccountingNormalBalance.DEBIT, "OPERATING_EXPENSES"],
      ["5300", "مصروفات تعليمية", AccountingAccountType.EXPENSE, AccountingNormalBalance.DEBIT, "EDUCATIONAL_EXPENSES"],
      ["5400", "مصروفات المراكز", AccountingAccountType.EXPENSE, AccountingNormalBalance.DEBIT, "CENTER_EXPENSES"],
      ["5600", "مصروف الإهلاك", AccountingAccountType.EXPENSE, AccountingNormalBalance.DEBIT, "DEPRECIATION_EXPENSE"]
    ].map(([code, name, type, normalBalance, systemKey]) => ({
      organizationId: organization.id,
      code: code as string,
      name: name as string,
      type: type as AccountingAccountType,
      normalBalance: normalBalance as AccountingNormalBalance,
      systemKey: systemKey as string
    }))
  });
  const accounts = await financeTestPrisma.accountingAccount.findMany({
    where: { organizationId: organization.id }
  });
  const bySystemKey = new Map(accounts.map((account) => [account.systemKey, account]));
  const required = (systemKey: string) => {
    const account = bySystemKey.get(systemKey);
    if (!account) throw new Error(`Missing test account ${systemKey}`);
    return account;
  };

  const fiscalYear = await financeTestPrisma.fiscalYear.create({
    data: {
      organizationId: organization.id,
      year: TAIZ_FINANCE_FIXTURE.dates.fiscalYear,
      startDate: new Date("2000-01-01T00:00:00.000Z"),
      endDate: new Date("2100-12-31T00:00:00.000Z")
    }
  });
  const openPeriod = await financeTestPrisma.fiscalPeriod.create({
    data: {
      organizationId: organization.id,
      fiscalYearId: fiscalYear.id,
      periodNumber: 1,
      periodName: "فترة الاختبار المفتوحة",
      startDate: new Date("2000-01-01T00:00:00.000Z"),
      endDate: new Date("2099-12-31T23:59:59.999Z")
    }
  });
  const closedPeriod = await financeTestPrisma.fiscalPeriod.create({
    data: {
      organizationId: organization.id,
      fiscalYearId: fiscalYear.id,
      periodNumber: 2,
      periodName: "فترة الاختبار المغلقة",
      startDate: new Date("2100-01-01T00:00:00.000Z"),
      endDate: new Date("2100-12-31T23:59:59.999Z"),
      status: FiscalPeriodStatus.CLOSED,
      closedAt: new Date("2101-01-01T00:00:00.000Z"),
      closedById: financeManager.id
    }
  });

  await financeTestPrisma.currency.createMany({
    data: [
      {
        organizationId: organization.id,
        code: "YER",
        nameAr: "الريال اليمني",
        nameEn: "Yemeni Rial",
        symbol: "ر.ي",
        decimalPlaces: 0,
        isBase: true
      },
      {
        organizationId: organization.id,
        code: "USD",
        nameAr: "الدولار الأمريكي",
        nameEn: "US Dollar",
        symbol: "$",
        decimalPlaces: 2
      }
    ]
  });
  await financeTestPrisma.exchangeRate.create({
    data: {
      organizationId: organization.id,
      currencyCode: "USD",
      rateToBase: TAIZ_FINANCE_FIXTURE.currency.usdRateToYer,
      effectiveDate: new Date("2031-01-01T00:00:00.000Z"),
      source: "سعر اختبار ثابت"
    }
  });

  const orgFund = await financeTestPrisma.financeAccount.create({
    data: {
      organizationId: organization.id,
      accountType: FinanceAccountType.ORG_FUND,
      accountingAccountId: required("MAIN_CASH").id,
      openingBalance: 1000000,
      currentBalance: 1000000,
      currencyCode: "YER"
    }
  });
  const centerFund = await financeTestPrisma.financeAccount.create({
    data: {
      organizationId: organization.id,
      centerId: centers[0].id,
      accountType: FinanceAccountType.CENTER_FUND,
      accountingAccountId: required("CENTER_FUNDS").id,
      openingBalance: 200000,
      currentBalance: 200000,
      currencyCode: "YER"
    }
  });

  await financeTestPrisma.financeSettings.create({
    data: {
      organizationId: organization.id,
      baseCurrencyCode: "YER",
      defaultCashAccountId: required("MAIN_CASH").id,
      defaultBankAccountId: required("BANK").id,
      defaultStudentRevenueAccountId: required("STUDENT_CONTRIBUTIONS_REVENUE").id,
      defaultDonationRevenueAccountId: required("DONATIONS_REVENUE").id,
      defaultPayrollExpenseAccountId: required("PAYROLL_REWARDS_EXPENSE").id,
      defaultOperatingExpenseAccountId: required("OPERATING_EXPENSES").id
    }
  });
  await financeTestPrisma.financePolicyProfile.create({
    data: {
      organizationId: organization.id,
      requireTransferAttachment: false,
      requireApprovalDisbursement: true,
      requireApprovalReceipt: false,
      allowOverdraft: false
    }
  });

  return {
    organization,
    centers,
    users: { financeManager, accountant, treasurer, auditor, supervisor, teacher, parent, student },
    accounts: { bySystemKey, orgFund, centerFund },
    periods: { fiscalYear, openPeriod, closedPeriod },
    scopes: {
      manager: scopeFor(financeManager, { allAccess: true }),
      accountant: scopeFor(accountant, { centerIds: [centers[0].id] }),
      treasurer: scopeFor(treasurer, { allAccess: true }),
      auditor: scopeFor(auditor, { allAccess: true }),
      supervisor: scopeFor(supervisor, { centerIds: [centers[0].id] }),
      teacher: scopeFor(teacher, { centerIds: [centers[0].id] }),
      parent: scopeFor(parent, { studentIds: [student.id] }),
      student: scopeFor(student)
    }
  };
};
