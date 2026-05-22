import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";

export const accountingRepository = {
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
