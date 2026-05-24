-- Phase 3: FIX-CASCADE-DELETE-DANGER
-- Prevent silent destruction of expense payments when an expense invoice is deleted.
-- Before: onDelete: Cascade → deleting an expense_invoice wiped all linked payments (including those tied to vouchers/journal entries)
-- After:  onDelete: Restrict → deleting an expense_invoice is blocked while payments exist

ALTER TABLE "expense_payments" DROP CONSTRAINT IF EXISTS "expense_payments_invoice_id_fkey";

ALTER TABLE "expense_payments"
  ADD CONSTRAINT "expense_payments_invoice_id_fkey"
  FOREIGN KEY ("invoice_id")
  REFERENCES "expense_invoices"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
