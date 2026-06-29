-- Migration: rename deduction amount columns (safe rename, preserves data)
-- deduction_amount_sar -> amount  (finance_deduction_rules)
-- calculated_amount_sar -> calculated_amount  (finance_deduction_events)

ALTER TABLE "public"."finance_deduction_rules"
  RENAME COLUMN "deduction_amount_sar" TO "amount";

ALTER TABLE "public"."finance_deduction_events"
  RENAME COLUMN "calculated_amount_sar" TO "calculated_amount";
