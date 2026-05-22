-- Payroll profiles: support org-wide profiles + banking + currency.
ALTER TABLE "public"."payroll_profiles"
  ALTER COLUMN "centerId" DROP NOT NULL;

ALTER TABLE "public"."payroll_profiles"
  ADD COLUMN IF NOT EXISTS "salaryCurrencyCode" VARCHAR(8) NOT NULL DEFAULT 'YER',
  ADD COLUMN IF NOT EXISTS "bankAccountNumber" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "bankName" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "iban" VARCHAR(34);

ALTER TABLE "public"."payroll_profiles"
  DROP CONSTRAINT IF EXISTS "payroll_profiles_centerId_fkey";

ALTER TABLE "public"."payroll_profiles"
  ADD CONSTRAINT "payroll_profiles_centerId_fkey"
  FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Payroll batches: support org-wide batches (centerId nullable).
ALTER TABLE "public"."payroll_batches"
  ALTER COLUMN "centerId" DROP NOT NULL;

DROP INDEX IF EXISTS "public"."payroll_batches_centerId_periodYear_periodMonth_key";

CREATE UNIQUE INDEX IF NOT EXISTS "payroll_batches_center_period_unique"
  ON "public"."payroll_batches"("centerId", "periodYear", "periodMonth")
  WHERE "centerId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "payroll_batches_org_period_unique"
  ON "public"."payroll_batches"("organizationId", "periodYear", "periodMonth")
  WHERE "centerId" IS NULL;

ALTER TABLE "public"."payroll_batches"
  DROP CONSTRAINT IF EXISTS "payroll_batches_centerId_fkey";

ALTER TABLE "public"."payroll_batches"
  ADD CONSTRAINT "payroll_batches_centerId_fkey"
  FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

