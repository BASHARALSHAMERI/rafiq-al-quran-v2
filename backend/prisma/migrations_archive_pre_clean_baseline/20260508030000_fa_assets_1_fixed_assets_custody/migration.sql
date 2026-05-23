-- FA-ASSETS-1: Fixed assets and custody register

CREATE TYPE "FixedAssetStatus" AS ENUM (
  'ACTIVE',
  'UNDER_MAINTENANCE',
  'DISPOSED',
  'LOST',
  'INACTIVE'
);

CREATE TABLE "asset_categories" (
  "id" SERIAL NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "asset_account_id" INTEGER,
  "depreciation_expense_account_id" INTEGER,
  "accumulated_depreciation_account_id" INTEGER,
  "useful_life_months" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_assets" (
  "id" SERIAL NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "center_id" INTEGER,
  "category_id" INTEGER NOT NULL,
  "asset_code" VARCHAR(80) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" VARCHAR(500),
  "purchase_date" DATE NOT NULL,
  "purchase_cost" DECIMAL(12,2) NOT NULL,
  "current_value" DECIMAL(12,2),
  "useful_life_months" INTEGER,
  "status" "FixedAssetStatus" NOT NULL DEFAULT 'ACTIVE',
  "location" VARCHAR(255),
  "custodian_user_id" INTEGER,
  "supplier_id" INTEGER,
  "expense_invoice_id" INTEGER,
  "notes" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "fixed_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "asset_custody_logs" (
  "id" SERIAL NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "asset_id" INTEGER NOT NULL,
  "from_user_id" INTEGER,
  "to_user_id" INTEGER,
  "center_id" INTEGER,
  "assigned_at" TIMESTAMP(3) NOT NULL,
  "returned_at" TIMESTAMP(3),
  "notes" VARCHAR(500),
  "created_by_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "asset_custody_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "asset_categories_organization_id_name_key" ON "asset_categories"("organization_id", "name");
CREATE INDEX "asset_categories_organization_id_is_active_idx" ON "asset_categories"("organization_id", "is_active");
CREATE INDEX "asset_categories_asset_account_id_idx" ON "asset_categories"("asset_account_id");
CREATE INDEX "asset_categories_depreciation_expense_account_id_idx" ON "asset_categories"("depreciation_expense_account_id");
CREATE INDEX "asset_categories_accumulated_depreciation_account_id_idx" ON "asset_categories"("accumulated_depreciation_account_id");

CREATE UNIQUE INDEX "fixed_assets_organization_id_asset_code_key" ON "fixed_assets"("organization_id", "asset_code");
CREATE INDEX "fixed_assets_organization_id_status_idx" ON "fixed_assets"("organization_id", "status");
CREATE INDEX "fixed_assets_center_id_idx" ON "fixed_assets"("center_id");
CREATE INDEX "fixed_assets_category_id_idx" ON "fixed_assets"("category_id");
CREATE INDEX "fixed_assets_custodian_user_id_idx" ON "fixed_assets"("custodian_user_id");
CREATE INDEX "fixed_assets_supplier_id_idx" ON "fixed_assets"("supplier_id");
CREATE INDEX "fixed_assets_expense_invoice_id_idx" ON "fixed_assets"("expense_invoice_id");

CREATE INDEX "asset_custody_logs_organization_id_assigned_at_idx" ON "asset_custody_logs"("organization_id", "assigned_at");
CREATE INDEX "asset_custody_logs_asset_id_assigned_at_idx" ON "asset_custody_logs"("asset_id", "assigned_at");
CREATE INDEX "asset_custody_logs_to_user_id_idx" ON "asset_custody_logs"("to_user_id");
CREATE INDEX "asset_custody_logs_center_id_idx" ON "asset_custody_logs"("center_id");

ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_asset_account_id_fkey" FOREIGN KEY ("asset_account_id") REFERENCES "accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_depreciation_expense_account_id_fkey" FOREIGN KEY ("depreciation_expense_account_id") REFERENCES "accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_accumulated_depreciation_account_id_fkey" FOREIGN KEY ("accumulated_depreciation_account_id") REFERENCES "accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_custodian_user_id_fkey" FOREIGN KEY ("custodian_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_expense_invoice_id_fkey" FOREIGN KEY ("expense_invoice_id") REFERENCES "expense_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "asset_custody_logs" ADD CONSTRAINT "asset_custody_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "asset_custody_logs" ADD CONSTRAINT "asset_custody_logs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "asset_custody_logs" ADD CONSTRAINT "asset_custody_logs_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asset_custody_logs" ADD CONSTRAINT "asset_custody_logs_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asset_custody_logs" ADD CONSTRAINT "asset_custody_logs_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asset_custody_logs" ADD CONSTRAINT "asset_custody_logs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
