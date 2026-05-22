import { AccountingAccountType, JournalSourceType } from "@prisma/client";
import { z } from "zod";

const optionalId = z.coerce.number().int().positive().optional();
const moneyAmount = z.coerce.number().min(0).max(9999999999.99);
const optionalMoneyAmount = z.coerce.number().min(0).max(9999999999.99).optional();

export const accountingEntityIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive()
  })
  .strict();

export const listAccountsQuerySchema = z
  .object({
    centerId: optionalId,
    type: z.nativeEnum(AccountingAccountType).optional(),
    isActive: z.coerce.boolean().optional()
  })
  .strict();

export const createAccountingAccountBodySchema = z
  .object({
    centerId: optionalId,
    parentId: optionalId,
    code: z.string().trim().min(1).max(32),
    type: z.nativeEnum(AccountingAccountType),
    name: z.string().trim().min(1).max(180),
    nameEn: z.string().trim().max(180).optional(),
    openingBalance: optionalMoneyAmount,
    isSubAccount: z.coerce.boolean().optional(),
    isPostingAllowed: z.coerce.boolean().optional(),
    notes: z.string().trim().max(500).optional()
  })
  .strict();

export const updateAccountingAccountBodySchema = createAccountingAccountBodySchema.partial().strict();

export const listJournalEntriesQuerySchema = z
  .object({
    centerId: optionalId,
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
    sourceType: z.nativeEnum(JournalSourceType).optional()
  })
  .strict();

export const ledgerQuerySchema = z
  .object({
    accountId: z.coerce.number().int().positive(),
    centerId: optionalId,
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional()
  })
  .strict();

export const trialBalanceQuerySchema = z
  .object({
    centerId: optionalId,
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional()
  })
  .strict();

const journalLineSchema = z
  .object({
    accountId: z.coerce.number().int().positive(),
    centerId: optionalId,
    debit: moneyAmount.default(0),
    credit: moneyAmount.default(0),
    memo: z.string().trim().max(500).optional(),
    sourceLineType: z.nativeEnum(JournalSourceType).optional(),
    sourceLineId: z.coerce.number().int().positive().optional()
  })
  .strict()
  .refine((line) => (line.debit > 0) !== (line.credit > 0), {
    message: "Each journal line must contain either debit or credit, not both"
  });

export const createJournalEntryBodySchema = z
  .object({
    entryNo: z.string().trim().max(80).optional(),
    centerId: optionalId,
    entryDate: z.string().trim().min(1),
    sourceType: z.nativeEnum(JournalSourceType).default(JournalSourceType.MANUAL),
    sourceId: z.coerce.number().int().positive().optional(),
    description: z.string().trim().max(500).optional(),
    lines: z.array(journalLineSchema).min(2)
  })
  .strict();
