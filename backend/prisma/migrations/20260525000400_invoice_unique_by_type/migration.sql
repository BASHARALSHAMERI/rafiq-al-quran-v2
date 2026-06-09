-- Phase 4: FIX-INVOICE-UNIQUE
-- Scope invoice uniqueness by invoiceType so different fee types (e.g., TUITION_MONTHLY,
-- REGISTRATION_ONE_TIME) can legitimately coexist for the same student/month/year,
-- while still preventing duplicate invoices of the same type.

DROP INDEX IF EXISTS "invoices_studentId_month_year_key";

CREATE UNIQUE INDEX "invoices_studentId_month_year_invoiceType_key"
  ON "public"."invoices"("studentId", "month", "year", "invoiceType");
