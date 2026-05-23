-- FA-ASSETS-2: Asset acquisition and depreciation posting

ALTER TYPE "JournalSourceType" ADD VALUE IF NOT EXISTS 'ASSET_ACQUISITION';
ALTER TYPE "JournalSourceType" ADD VALUE IF NOT EXISTS 'ASSET_DEPRECIATION';

ALTER TABLE "fixed_assets"
  ADD COLUMN "acquisition_journal_entry_id" INTEGER;

CREATE UNIQUE INDEX "fixed_assets_acquisition_journal_entry_id_key"
  ON "fixed_assets"("acquisition_journal_entry_id");

CREATE TABLE "asset_depreciation_entries" (
  "id" SERIAL NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "asset_id" INTEGER NOT NULL,
  "period_year" SMALLINT NOT NULL,
  "period_month" SMALLINT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "journal_entry_id" INTEGER,
  "notes" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "asset_depreciation_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "asset_depreciation_entries_journal_entry_id_key"
  ON "asset_depreciation_entries"("journal_entry_id");

CREATE UNIQUE INDEX "asset_depreciation_entries_asset_id_period_year_period_month_key"
  ON "asset_depreciation_entries"("asset_id", "period_year", "period_month");

CREATE INDEX "asset_depreciation_entries_organization_id_idx"
  ON "asset_depreciation_entries"("organization_id");

CREATE INDEX "asset_depreciation_entries_asset_id_idx"
  ON "asset_depreciation_entries"("asset_id");

ALTER TABLE "fixed_assets"
  ADD CONSTRAINT "fixed_assets_acquisition_journal_entry_id_fkey"
  FOREIGN KEY ("acquisition_journal_entry_id") REFERENCES "journal_entries"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "asset_depreciation_entries"
  ADD CONSTRAINT "asset_depreciation_entries_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "asset_depreciation_entries"
  ADD CONSTRAINT "asset_depreciation_entries_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "fixed_assets"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "asset_depreciation_entries"
  ADD CONSTRAINT "asset_depreciation_entries_journal_entry_id_fkey"
  FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
