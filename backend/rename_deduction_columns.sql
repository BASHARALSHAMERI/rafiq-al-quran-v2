-- Execute this SQL directly against PostgreSQL to rename deduction columns
-- This is a safe RENAME (not DROP/ADD) - all data is preserved

ALTER TABLE "public"."finance_deduction_rules"
  RENAME COLUMN "deduction_amount_sar" TO "amount";

ALTER TABLE "public"."finance_deduction_events"
  RENAME COLUMN "calculated_amount_sar" TO "calculated_amount";
