import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";

export const accountingRepository = {
  async findFiscalPeriods(organizationId: number) {
    const rows = await prisma.fiscalPeriod.findMany({
      where: { organizationId },
      orderBy: [{ startDate: "desc" }, { periodNumber: "desc" }],
      include: {
        fiscalYear: { select: { id: true, year: true, status: true } },
        closedBy: { select: { id: true, fullName: true } },
        journalEntries: {
          select: {
            lines: {
              select: {
                debit: true,
                credit: true
              }
            }
          }
        },
        _count: { select: { journalEntries: true } }
      }
    });

    return rows.map((r) => {
      let debit = 0;
      let credit = 0;
      r.journalEntries.forEach((entry) => {
        entry.lines.forEach((line) => {
          debit += Number(line.debit) || 0;
          credit += Number(line.credit) || 0;
        });
      });

      return {
        id: r.id,
        organizationId: r.organizationId,
        fiscalYearId: r.fiscalYearId,
        periodNumber: r.periodNumber,
        periodName: r.periodName,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status,
        closedAt: r.closedAt,
        closedById: r.closedById,
        fiscalYear: r.fiscalYear,
        closedBy: r.closedBy,
        _count: r._count,
        debit,
        credit
      };
    });
  },

  findAccounts(where: Prisma.AccountingAccountWhereInput) {
    return prisma.accountingAccount.findMany({
      where,
      orderBy: [{ code: "asc" }, { id: "asc" }]
    });
  },

  findJournalEntries(where: Prisma.JournalEntryWhereInput) {
    return prisma.journalEntry.findMany({
      where,
      orderBy: [{ entryDate: "desc" }, { id: "desc" }],
      include: {
        center: { select: { id: true, name: true } },
        lines: {
          orderBy: { id: "asc" },
          include: {
            account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } },
            center: { select: { id: true, name: true } }
          }
        },
        postedBy: { select: { id: true, fullName: true } }
      }
    });
  }
};
