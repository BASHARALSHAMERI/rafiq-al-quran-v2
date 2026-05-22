import { prisma } from "../src/shared/db/prisma";

const requiredCodes = [
  "1100",
  "1110",
  "1120",
  "1200",
  "2100",
  "2200",
  "3100",
  "3200",
  "4100",
  "4200",
  "4300",
  "5100",
  "5200",
  "5300",
  "5400",
  "5500"
];

const main = async () => {
  const [
    organizations,
    accountingAccountTotal,
    journalEntryTotal,
    paymentTotal,
    invoiceTotal,
    voucherTotal,
    reportFileTotal
  ] = await Promise.all([
    prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" }
    }),
    prisma.accountingAccount.count(),
    prisma.journalEntry.count(),
    prisma.payment.count(),
    prisma.invoice.count(),
    prisma.financeVoucher.count(),
    prisma.reportFile.count()
  ]);

  const accountsByOrganization = await Promise.all(
    organizations.map(async (organization) => {
      const accounts = await prisma.accountingAccount.findMany({
        where: {
          organizationId: organization.id,
          code: { in: requiredCodes }
        },
        select: {
          code: true,
          name: true,
          type: true,
          normalBalance: true
        },
        orderBy: { code: "asc" }
      });

      const duplicateCodes = await prisma.accountingAccount.groupBy({
        by: ["code"],
        where: { organizationId: organization.id },
        _count: { _all: true },
        having: {
          code: {
            _count: {
              gt: 1
            }
          }
        }
      });

      return {
        organizationId: organization.id,
        organizationName: organization.name,
        requiredAccountCount: accounts.length,
        missingCodes: requiredCodes.filter((code) => !accounts.some((account) => account.code === code)),
        duplicateCodes: duplicateCodes.map((item) => ({
          code: item.code,
          count: item._count._all
        })),
        accounts
      };
    })
  );

  console.log(
    JSON.stringify(
      {
        organizationCount: organizations.length,
        accountingAccountTotal,
        journalEntryTotal,
        paymentTotal,
        invoiceTotal,
        voucherTotal,
        reportFileTotal,
        accountsByOrganization
      },
      null,
      2
    )
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
