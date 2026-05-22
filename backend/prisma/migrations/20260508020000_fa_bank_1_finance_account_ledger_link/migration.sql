-- FA-BANK-1: link operational cash/bank accounts to real ledger accounts.
ALTER TYPE "FinanceAccountType" ADD VALUE IF NOT EXISTS 'ORG_BANK';
ALTER TYPE "FinanceAccountType" ADD VALUE IF NOT EXISTS 'CENTER_BANK';

ALTER TABLE "finance_accounts"
  ADD COLUMN "accounting_account_id" INTEGER;

UPDATE "finance_accounts" fa
SET "accounting_account_id" = aa.id
FROM "accounting_accounts" aa
WHERE aa."organizationId" = fa."organizationId"
  AND aa.type = 'ASSET'
  AND (
    aa."systemKey" = 'MAIN_CASH'
    OR aa.code = '1100'
  )
  AND fa."accounting_account_id" IS NULL;

CREATE INDEX "finance_accounts_accounting_account_id_idx"
  ON "finance_accounts"("accounting_account_id");

ALTER TABLE "finance_accounts"
  ADD CONSTRAINT "finance_accounts_accounting_account_id_fkey"
  FOREIGN KEY ("accounting_account_id")
  REFERENCES "accounting_accounts"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
