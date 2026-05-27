-- AlterTable
ALTER TABLE "public"."journal_entries" ADD COLUMN     "fiscal_period_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."monthly_plans" ADD COLUMN     "approved_by_id" INTEGER;

-- CreateIndex
CREATE INDEX "journal_entries_organizationId_fiscal_period_id_idx" ON "public"."journal_entries"("organizationId", "fiscal_period_id");

-- CreateIndex
CREATE INDEX "monthly_plans_approved_by_id_idx" ON "public"."monthly_plans"("approved_by_id");

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_fiscal_period_id_fkey" FOREIGN KEY ("fiscal_period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_plans" ADD CONSTRAINT "monthly_plans_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_settings" ADD CONSTRAINT "finance_settings_defaultCashAccountId_fkey" FOREIGN KEY ("defaultCashAccountId") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_settings" ADD CONSTRAINT "finance_settings_defaultBankAccountId_fkey" FOREIGN KEY ("defaultBankAccountId") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_settings" ADD CONSTRAINT "finance_settings_defaultStudentRevenueAccountId_fkey" FOREIGN KEY ("defaultStudentRevenueAccountId") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_settings" ADD CONSTRAINT "finance_settings_defaultDonationRevenueAccountId_fkey" FOREIGN KEY ("defaultDonationRevenueAccountId") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_settings" ADD CONSTRAINT "finance_settings_defaultPayrollExpenseAccountId_fkey" FOREIGN KEY ("defaultPayrollExpenseAccountId") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_settings" ADD CONSTRAINT "finance_settings_defaultOperatingExpenseAccountId_fkey" FOREIGN KEY ("defaultOperatingExpenseAccountId") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
