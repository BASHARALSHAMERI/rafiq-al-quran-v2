import {
  AccountingAccountType,
  AccountingNormalBalance,
  Prisma,
  PrismaClient
} from "@prisma/client";

type AccountingSeedAccount = {
  code: string;
  legacyCodes?: string[];
  name: string;
  type: AccountingAccountType;
  normalBalance: AccountingNormalBalance;
  systemKey: string;
  parentSystemKey?: string;
  fallbackParentSystemKey?: string;
};

type AccountingSeedClient = PrismaClient | Prisma.TransactionClient;

export const defaultAccountingAccounts: AccountingSeedAccount[] = [
  {
    code: "1000",
    name: "الأصول",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "ASSETS_ROOT"
  },
  {
    code: "1100",
    name: "الأصول المتداولة",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "CURRENT_ASSETS",
    parentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1110",
    legacyCodes: ["1100"],
    name: "الصندوق الرئيسي",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "MAIN_CASH",
    parentSystemKey: "CURRENT_ASSETS",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1120",
    legacyCodes: ["1110"],
    name: "البنك",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "BANK",
    parentSystemKey: "CURRENT_ASSETS",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1130",
    legacyCodes: ["1120"],
    name: "صناديق المراكز",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "CENTER_FUNDS",
    parentSystemKey: "CURRENT_ASSETS",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1140",
    legacyCodes: ["1200"],
    name: "ذمم الطلاب",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "STUDENT_RECEIVABLES",
    parentSystemKey: "CURRENT_ASSETS",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1150",
    name: "سلف وعهد مالية",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "ADVANCES_CUSTODIES",
    parentSystemKey: "CURRENT_ASSETS",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1200",
    name: "الأصول الثابتة",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "FIXED_ASSETS",
    parentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1210",
    name: "مباني الجمعية",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "BUILDINGS",
    parentSystemKey: "FIXED_ASSETS",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1220",
    name: "أثاث وتجهيزات",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "FURNITURE_FIXTURES",
    parentSystemKey: "FIXED_ASSETS",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1230",
    name: "أجهزة حاسوب ومعدات",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "COMPUTERS_EQUIPMENT",
    parentSystemKey: "FIXED_ASSETS",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1240",
    name: "مكيفات وأجهزة كهربائية",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "AC_ELECTRICAL_EQUIPMENT",
    parentSystemKey: "FIXED_ASSETS",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1250",
    name: "شاشات ووسائل تعليمية",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "EDUCATIONAL_DISPLAYS_TOOLS",
    parentSystemKey: "FIXED_ASSETS",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1260",
    name: "مكتبات ومراجع",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "LIBRARIES_REFERENCES",
    parentSystemKey: "FIXED_ASSETS",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1290",
    name: "مجمع إهلاك الأصول",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "ACCUMULATED_DEPRECIATION",
    parentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1291",
    name: "مجمع إهلاك المباني",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "ACCUMULATED_DEPRECIATION_BUILDINGS",
    parentSystemKey: "ACCUMULATED_DEPRECIATION",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1292",
    name: "مجمع إهلاك الأثاث والتجهيزات",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "ACCUMULATED_DEPRECIATION_FURNITURE",
    parentSystemKey: "ACCUMULATED_DEPRECIATION",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "1293",
    name: "مجمع إهلاك الأجهزة والمعدات",
    type: AccountingAccountType.ASSET,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "ACCUMULATED_DEPRECIATION_EQUIPMENT",
    parentSystemKey: "ACCUMULATED_DEPRECIATION",
    fallbackParentSystemKey: "ASSETS_ROOT"
  },
  {
    code: "2000",
    name: "الخصوم",
    type: AccountingAccountType.LIABILITY,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "LIABILITIES_ROOT"
  },
  {
    code: "2100",
    name: "الخصوم المتداولة",
    type: AccountingAccountType.LIABILITY,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "CURRENT_LIABILITIES",
    parentSystemKey: "LIABILITIES_ROOT"
  },
  {
    code: "2110",
    legacyCodes: ["2100"],
    name: "مستحقات موظفين",
    type: AccountingAccountType.LIABILITY,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "STAFF_PAYABLES",
    parentSystemKey: "CURRENT_LIABILITIES",
    fallbackParentSystemKey: "LIABILITIES_ROOT"
  },
  {
    code: "2120",
    legacyCodes: ["2200"],
    name: "مصروفات مستحقة",
    type: AccountingAccountType.LIABILITY,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "ACCRUED_EXPENSES",
    parentSystemKey: "CURRENT_LIABILITIES",
    fallbackParentSystemKey: "LIABILITIES_ROOT"
  },
  {
    code: "2130",
    name: "ذمم موردين",
    type: AccountingAccountType.LIABILITY,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "ACCOUNTS_PAYABLE",
    parentSystemKey: "CURRENT_LIABILITIES",
    fallbackParentSystemKey: "LIABILITIES_ROOT"
  },
  {
    code: "3000",
    name: "صافي الأصول",
    type: AccountingAccountType.NET_ASSET,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "NET_ASSETS_ROOT"
  },
  {
    code: "3100",
    name: "صافي أصول غير مقيدة",
    type: AccountingAccountType.NET_ASSET,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "UNRESTRICTED_NET_ASSETS",
    parentSystemKey: "NET_ASSETS_ROOT"
  },
  {
    code: "3200",
    name: "صافي أصول مقيدة",
    type: AccountingAccountType.NET_ASSET,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "RESTRICTED_NET_ASSETS",
    parentSystemKey: "NET_ASSETS_ROOT"
  },
  {
    code: "4000",
    name: "الإيرادات والتمويل",
    type: AccountingAccountType.REVENUE,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "REVENUE_ROOT"
  },
  {
    code: "4100",
    name: "اشتراكات الطلاب",
    type: AccountingAccountType.REVENUE,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "STUDENT_CONTRIBUTIONS_REVENUE",
    parentSystemKey: "REVENUE_ROOT"
  },
  {
    code: "4200",
    name: "التبرعات والدعم",
    type: AccountingAccountType.REVENUE,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "DONATIONS_REVENUE",
    parentSystemKey: "REVENUE_ROOT"
  },
  {
    code: "4300",
    name: "إيرادات أخرى",
    type: AccountingAccountType.REVENUE,
    normalBalance: AccountingNormalBalance.CREDIT,
    systemKey: "OTHER_REVENUE",
    parentSystemKey: "REVENUE_ROOT"
  },
  {
    code: "5000",
    name: "المصروفات",
    type: AccountingAccountType.EXPENSE,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "EXPENSES_ROOT"
  },
  {
    code: "5100",
    name: "رواتب ومكافآت",
    type: AccountingAccountType.EXPENSE,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "PAYROLL_REWARDS_EXPENSE",
    parentSystemKey: "EXPENSES_ROOT"
  },
  {
    code: "5200",
    name: "مصروفات تشغيلية",
    type: AccountingAccountType.EXPENSE,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "OPERATING_EXPENSES",
    parentSystemKey: "EXPENSES_ROOT"
  },
  {
    code: "5300",
    name: "مصروفات تعليمية",
    type: AccountingAccountType.EXPENSE,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "EDUCATIONAL_EXPENSES",
    parentSystemKey: "EXPENSES_ROOT"
  },
  {
    code: "5400",
    name: "مصروفات مراكز",
    type: AccountingAccountType.EXPENSE,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "CENTER_EXPENSES",
    parentSystemKey: "EXPENSES_ROOT"
  },
  {
    code: "5500",
    name: "خصومات وتسويات",
    type: AccountingAccountType.EXPENSE,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "DEDUCTIONS_ADJUSTMENTS",
    parentSystemKey: "EXPENSES_ROOT"
  },
  {
    code: "5600",
    name: "مصروف إهلاك الأصول",
    type: AccountingAccountType.EXPENSE,
    normalBalance: AccountingNormalBalance.DEBIT,
    systemKey: "DEPRECIATION_EXPENSE",
    parentSystemKey: "EXPENSES_ROOT"
  }
];

const temporaryCodeFor = (accountId: number, desiredCode: string) => {
  return `COA_TMP_${accountId}_${desiredCode}`.slice(0, 32);
};

const retagExistingSystemAccounts = async (client: AccountingSeedClient, organizationId: number) => {
  const existingAccounts = await client.accountingAccount.findMany({
    where: {
      organizationId,
      systemKey: { in: defaultAccountingAccounts.map((account) => account.systemKey) }
    },
    select: { id: true, code: true, systemKey: true }
  });
  const seedBySystemKey = new Map(defaultAccountingAccounts.map((account) => [account.systemKey, account]));

  for (const existing of existingAccounts) {
    const seed = existing.systemKey ? seedBySystemKey.get(existing.systemKey) : undefined;
    if (!seed || existing.code === seed.code) continue;

    const temporaryCode = temporaryCodeFor(existing.id, seed.code);
    const temporaryOwner = await client.accountingAccount.findFirst({
      where: { organizationId, code: temporaryCode },
      select: { id: true }
    });
    if (!temporaryOwner || temporaryOwner.id === existing.id) {
      await client.accountingAccount.update({
        where: { id: existing.id },
        data: { code: temporaryCode }
      });
    }
  }

  for (const existing of existingAccounts) {
    const seed = existing.systemKey ? seedBySystemKey.get(existing.systemKey) : undefined;
    if (!seed) continue;

    const targetOwner = await client.accountingAccount.findFirst({
      where: { organizationId, code: seed.code },
      select: { id: true }
    });
    if (targetOwner && targetOwner.id !== existing.id) continue;

    await client.accountingAccount.update({
      where: { id: existing.id },
      data: { code: seed.code }
    });
  }
};

const findParentId = async (client: AccountingSeedClient, organizationId: number, account: AccountingSeedAccount) => {
  const parentSystemKey = account.parentSystemKey ?? account.fallbackParentSystemKey;
  if (!parentSystemKey) return null;

  const parent = await client.accountingAccount.findFirst({
    where: { organizationId, systemKey: parentSystemKey },
    select: { id: true }
  });
  if (parent) return parent.id;

  if (account.fallbackParentSystemKey && account.fallbackParentSystemKey !== parentSystemKey) {
    const fallbackParent = await client.accountingAccount.findFirst({
      where: { organizationId, systemKey: account.fallbackParentSystemKey },
      select: { id: true }
    });
    return fallbackParent?.id ?? null;
  }

  return null;
};

const findExistingAccount = async (client: AccountingSeedClient, organizationId: number, account: AccountingSeedAccount) => {
  const bySystemKey = await client.accountingAccount.findFirst({
    where: { organizationId, systemKey: account.systemKey }
  });
  if (bySystemKey) return bySystemKey;

  return client.accountingAccount.findFirst({
    where: {
      organizationId,
      code: account.code,
      OR: [{ systemKey: null }, { systemKey: account.systemKey }]
    },
    orderBy: { id: "asc" }
  });
};

const resolveWritableCode = async (
  client: AccountingSeedClient,
  organizationId: number,
  existingId: number | undefined,
  desiredCode: string
) => {
  const owner = await client.accountingAccount.findFirst({
    where: { organizationId, code: desiredCode },
    select: { id: true }
  });
  if (!owner || owner.id === existingId) return desiredCode;
  return undefined;
};

const ensureSeedAccount = async (client: AccountingSeedClient, organizationId: number, account: AccountingSeedAccount) => {
  const existing = await findExistingAccount(client, organizationId, account);
  const parentId = await findParentId(client, organizationId, account);

  if (existing) {
    const writableCode = await resolveWritableCode(client, organizationId, existing.id, account.code);
    await client.accountingAccount.update({
      where: { id: existing.id },
      data: {
        ...(writableCode ? { code: writableCode } : {}),
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        systemKey: account.systemKey,
        parentId,
        isActive: true
      }
    });
    return existing.id;
  }

  const writableCode = await resolveWritableCode(client, organizationId, undefined, account.code);
  if (!writableCode) return null;

  const created = await client.accountingAccount.create({
    data: {
      organizationId,
      centerId: null,
      code: writableCode,
      name: account.name,
      type: account.type,
      normalBalance: account.normalBalance,
      systemKey: account.systemKey,
      parentId,
      isActive: true
    }
  });

  return created.id;
};

export const seedAccountingChart = async (client: AccountingSeedClient, organizationId: number) => {
  await retagExistingSystemAccounts(client, organizationId);

  for (const account of defaultAccountingAccounts) {
    await ensureSeedAccount(client, organizationId, account);
  }
};
