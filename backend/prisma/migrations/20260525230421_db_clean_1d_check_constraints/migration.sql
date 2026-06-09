-- Phase D: CHECK constraints
-- All constraints verified safe on rafiq_v2_clean_dev:
--   jel_negative_debit=0, jel_negative_credit=0, jel_both_nonzero=0
--   monthly_plan_bad_month=0, monthly_plan_bad_year=0
--   payment_zero_or_neg=0
--   invoice_bad_month=0, invoice_bad_year=0

-- JournalEntryLine: debit and credit must be non-negative; both cannot be non-zero simultaneously
ALTER TABLE "public"."journal_entry_lines"
  ADD CONSTRAINT "journal_entry_lines_debit_non_negative"  CHECK (debit  >= 0),
  ADD CONSTRAINT "journal_entry_lines_credit_non_negative" CHECK (credit >= 0),
  ADD CONSTRAINT "journal_entry_lines_not_both_nonzero"    CHECK (NOT (debit > 0 AND credit > 0));

-- MonthlyPlan: month must be 1-12, year must be in a sane range
ALTER TABLE "public"."monthly_plans"
  ADD CONSTRAINT "monthly_plans_month_range" CHECK (month >= 1 AND month <= 12),
  ADD CONSTRAINT "monthly_plans_year_range"  CHECK (year  >= 2000 AND year <= 2100);

-- Payment: amount must be positive
ALTER TABLE "public"."payments"
  ADD CONSTRAINT "payments_amount_positive" CHECK (amount > 0);

-- Invoice: month must be 1-12, year must be in a sane range
ALTER TABLE "public"."invoices"
  ADD CONSTRAINT "invoices_month_range" CHECK (month >= 1 AND month <= 12),
  ADD CONSTRAINT "invoices_year_range"  CHECK (year  >= 2000 AND year <= 2100);