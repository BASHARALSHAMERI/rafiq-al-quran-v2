-- DropForeignKey
ALTER TABLE "public"."accounting_accounts" DROP CONSTRAINT "accounting_accounts_parentId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_organizationId_currencyCode_effectiveDate_key" ON "public"."exchange_rates"("organizationId", "currencyCode", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_items_batchId_beneficiaryUserId_key" ON "public"."payroll_items"("batchId", "beneficiaryUserId");

-- CreateIndex
CREATE UNIQUE INDEX "reward_items_batchId_beneficiaryUserId_key" ON "public"."reward_items"("batchId", "beneficiaryUserId");

-- AddForeignKey
ALTER TABLE "public"."accounting_accounts" ADD CONSTRAINT "accounting_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."accounting_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
