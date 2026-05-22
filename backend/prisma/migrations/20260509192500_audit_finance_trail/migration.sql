-- AlterEnum
ALTER TYPE "public"."AuditEntityType" ADD VALUE 'EXPENSE_INVOICE';
ALTER TYPE "public"."AuditEntityType" ADD VALUE 'FIXED_ASSET';

-- RenameIndex
ALTER INDEX "public"."asset_depreciation_entries_asset_id_period_year_period_month_ke" RENAME TO "asset_depreciation_entries_asset_id_period_year_period_mont_key";
