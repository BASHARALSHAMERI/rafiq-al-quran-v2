-- FA-CENTER-FINANCIAL-TRACKING-1: Add center_id to payroll_items
-- Enables per-employee cost center tracking for payroll items,
-- even when the payroll batch is at org level.

-- AlterTable
ALTER TABLE "public"."payroll_items" ADD COLUMN "center_id" INTEGER;

-- CreateIndex
CREATE INDEX "payroll_items_center_id_idx" ON "public"."payroll_items"("center_id");
