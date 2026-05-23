-- CreateEnum
CREATE TYPE "public"."AccountingAccountType" AS ENUM ('ASSET', 'LIABILITY', 'NET_ASSET', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "public"."AccountingNormalBalance" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "public"."JournalEntryStatus" AS ENUM ('DRAFT', 'POSTED', 'VOID');

-- CreateEnum
CREATE TYPE "public"."JournalSourceType" AS ENUM ('INVOICE', 'PAYMENT', 'VOUCHER', 'FUND_TRANSFER', 'MANUAL', 'PAYROLL', 'REWARD', 'DEDUCTION');

-- CreateTable
CREATE TABLE "public"."accounting_accounts" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "type" "public"."AccountingAccountType" NOT NULL,
    "normalBalance" "public"."AccountingNormalBalance" NOT NULL,
    "parentId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "systemKey" VARCHAR(80),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."journal_entries" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "entryNo" VARCHAR(80) NOT NULL,
    "entryDate" DATE NOT NULL,
    "sourceType" "public"."JournalSourceType" NOT NULL,
    "sourceId" INTEGER,
    "status" "public"."JournalEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "description" VARCHAR(500),
    "postedById" INTEGER,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."journal_entry_lines" (
    "id" SERIAL NOT NULL,
    "journalEntryId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "memo" VARCHAR(500),
    "sourceLineType" "public"."JournalSourceType",
    "sourceLineId" INTEGER,
    "organizationId" INTEGER NOT NULL,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounting_accounts_organizationId_type_isActive_idx" ON "public"."accounting_accounts"("organizationId", "type", "isActive");

-- CreateIndex
CREATE INDEX "accounting_accounts_organizationId_centerId_idx" ON "public"."accounting_accounts"("organizationId", "centerId");

-- CreateIndex
CREATE INDEX "accounting_accounts_parentId_idx" ON "public"."accounting_accounts"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_accounts_organizationId_code_key" ON "public"."accounting_accounts"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_accounts_organizationId_systemKey_key" ON "public"."accounting_accounts"("organizationId", "systemKey");

-- CreateIndex
CREATE INDEX "journal_entries_organizationId_entryDate_idx" ON "public"."journal_entries"("organizationId", "entryDate");

-- CreateIndex
CREATE INDEX "journal_entries_organizationId_status_entryDate_idx" ON "public"."journal_entries"("organizationId", "status", "entryDate");

-- CreateIndex
CREATE INDEX "journal_entries_centerId_entryDate_idx" ON "public"."journal_entries"("centerId", "entryDate");

-- CreateIndex
CREATE INDEX "journal_entries_postedById_idx" ON "public"."journal_entries"("postedById");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_organizationId_entryNo_key" ON "public"."journal_entries"("organizationId", "entryNo");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_organizationId_sourceType_sourceId_key" ON "public"."journal_entries"("organizationId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "journal_entry_lines_journalEntryId_idx" ON "public"."journal_entry_lines"("journalEntryId");

-- CreateIndex
CREATE INDEX "journal_entry_lines_accountId_idx" ON "public"."journal_entry_lines"("accountId");

-- CreateIndex
CREATE INDEX "journal_entry_lines_centerId_idx" ON "public"."journal_entry_lines"("centerId");

-- CreateIndex
CREATE INDEX "journal_entry_lines_organizationId_accountId_idx" ON "public"."journal_entry_lines"("organizationId", "accountId");

-- AddForeignKey
ALTER TABLE "public"."accounting_accounts" ADD CONSTRAINT "accounting_accounts_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounting_accounts" ADD CONSTRAINT "accounting_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounting_accounts" ADD CONSTRAINT "accounting_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."accounting_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "public"."journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "public"."journal_entry_lines"
ADD CONSTRAINT "journal_entry_lines_debit_non_negative"
CHECK ("debit" >= 0);

-- AddCheckConstraint
ALTER TABLE "public"."journal_entry_lines"
ADD CONSTRAINT "journal_entry_lines_credit_non_negative"
CHECK ("credit" >= 0);

-- AddCheckConstraint
ALTER TABLE "public"."journal_entry_lines"
ADD CONSTRAINT "journal_entry_lines_debit_credit_xor"
CHECK (
  (("debit" > 0 AND "credit" = 0)
   OR
   ("credit" > 0 AND "debit" = 0))
);

