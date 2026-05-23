ALTER TABLE "public"."payroll_items"
  ADD COLUMN "originalAmount" DECIMAL(12,2),
  ADD COLUMN "originalCurrencyCode" VARCHAR(3),
  ADD COLUMN "exchangeRateToBase" DECIMAL(18,6);

