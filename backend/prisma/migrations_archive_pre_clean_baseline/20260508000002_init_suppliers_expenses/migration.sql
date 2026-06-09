-- ============================================================
-- FA-EXPENSES-AP-1: Suppliers, Expense Categories, Invoices & Payments
-- Migration: 20260508000002_init_suppliers_expenses
-- ============================================================

-- 1. New enum: ExpenseInvoiceStatus
CREATE TYPE "ExpenseInvoiceStatus" AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'PARTIALLY_PAID',
  'PAID',
  'VOIDED'
);

-- 2. Extend JournalSourceType enum with expense values
ALTER TYPE "JournalSourceType" ADD VALUE IF NOT EXISTS 'EXPENSE_INVOICE';
ALTER TYPE "JournalSourceType" ADD VALUE IF NOT EXISTS 'EXPENSE_PAYMENT';

-- 3. Extend VoucherSourceType enum with EXPENSE value
ALTER TYPE "VoucherSourceType" ADD VALUE IF NOT EXISTS 'EXPENSE';

-- 4. Table: suppliers
CREATE TABLE "suppliers" (
  "id"              SERIAL       NOT NULL,
  "organization_id" INTEGER      NOT NULL,
  "name"            VARCHAR(120) NOT NULL,
  "phone"           VARCHAR(32),
  "address"         VARCHAR(255),
  "notes"           VARCHAR(500),
  "is_active"       BOOLEAN      NOT NULL DEFAULT true,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "suppliers_organization_id_idx" ON "suppliers"("organization_id");
CREATE INDEX "suppliers_is_active_idx"       ON "suppliers"("is_active");

ALTER TABLE "suppliers"
  ADD CONSTRAINT "suppliers_organization_id_fkey"
  FOREIGN KEY ("organization_id")
  REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Table: expense_categories
CREATE TABLE "expense_categories" (
  "id"                   SERIAL       NOT NULL,
  "organization_id"      INTEGER      NOT NULL,
  "name"                 VARCHAR(120) NOT NULL,
  "type"                 VARCHAR(60),
  "accounting_account_id" INTEGER,
  "is_active"            BOOLEAN      NOT NULL DEFAULT true,
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3) NOT NULL,

  CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "expense_categories_organization_id_idx" ON "expense_categories"("organization_id");

ALTER TABLE "expense_categories"
  ADD CONSTRAINT "expense_categories_organization_id_fkey"
  FOREIGN KEY ("organization_id")
  REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expense_categories"
  ADD CONSTRAINT "expense_categories_accounting_account_id_fkey"
  FOREIGN KEY ("accounting_account_id")
  REFERENCES "accounting_accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Table: expense_invoices
CREATE TABLE "expense_invoices" (
  "id"              SERIAL                   NOT NULL,
  "organization_id" INTEGER                  NOT NULL,
  "center_id"       INTEGER,
  "supplier_id"     INTEGER,
  "category_id"     INTEGER                  NOT NULL,
  "invoice_no"      VARCHAR(80),
  "invoice_date"    DATE                     NOT NULL,
  "due_date"        DATE,
  "description"     VARCHAR(500)             NOT NULL,
  "amount"          DECIMAL(10,2)            NOT NULL,
  "status"          "ExpenseInvoiceStatus"   NOT NULL DEFAULT 'DRAFT',
  "approved_by_id"  INTEGER,
  "approved_at"     TIMESTAMP(3),
  "created_at"      TIMESTAMP(3)             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3)             NOT NULL,

  CONSTRAINT "expense_invoices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "expense_invoices_organization_id_idx" ON "expense_invoices"("organization_id");
CREATE INDEX "expense_invoices_center_id_idx"       ON "expense_invoices"("center_id");
CREATE INDEX "expense_invoices_supplier_id_idx"     ON "expense_invoices"("supplier_id");
CREATE INDEX "expense_invoices_status_idx"          ON "expense_invoices"("status");

ALTER TABLE "expense_invoices"
  ADD CONSTRAINT "expense_invoices_organization_id_fkey"
  FOREIGN KEY ("organization_id")
  REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expense_invoices"
  ADD CONSTRAINT "expense_invoices_center_id_fkey"
  FOREIGN KEY ("center_id")
  REFERENCES "centers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expense_invoices"
  ADD CONSTRAINT "expense_invoices_supplier_id_fkey"
  FOREIGN KEY ("supplier_id")
  REFERENCES "suppliers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expense_invoices"
  ADD CONSTRAINT "expense_invoices_category_id_fkey"
  FOREIGN KEY ("category_id")
  REFERENCES "expense_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expense_invoices"
  ADD CONSTRAINT "expense_invoices_approved_by_id_fkey"
  FOREIGN KEY ("approved_by_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Table: expense_payments
CREATE TABLE "expense_payments" (
  "id"                 SERIAL        NOT NULL,
  "organization_id"    INTEGER       NOT NULL,
  "invoice_id"         INTEGER       NOT NULL,
  "amount"             DECIMAL(10,2) NOT NULL,
  "paid_at"            TIMESTAMP(3)  NOT NULL,
  "finance_account_id" INTEGER,
  "voucher_id"         INTEGER,
  "journal_entry_id"   INTEGER,
  "notes"              VARCHAR(500),
  "created_at"         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"         TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "expense_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "expense_payments_organization_id_idx" ON "expense_payments"("organization_id");
CREATE INDEX "expense_payments_invoice_id_idx"      ON "expense_payments"("invoice_id");

ALTER TABLE "expense_payments"
  ADD CONSTRAINT "expense_payments_organization_id_fkey"
  FOREIGN KEY ("organization_id")
  REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expense_payments"
  ADD CONSTRAINT "expense_payments_invoice_id_fkey"
  FOREIGN KEY ("invoice_id")
  REFERENCES "expense_invoices"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expense_payments"
  ADD CONSTRAINT "expense_payments_finance_account_id_fkey"
  FOREIGN KEY ("finance_account_id")
  REFERENCES "finance_accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expense_payments"
  ADD CONSTRAINT "expense_payments_voucher_id_fkey"
  FOREIGN KEY ("voucher_id")
  REFERENCES "finance_vouchers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expense_payments"
  ADD CONSTRAINT "expense_payments_journal_entry_id_fkey"
  FOREIGN KEY ("journal_entry_id")
  REFERENCES "journal_entries"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
