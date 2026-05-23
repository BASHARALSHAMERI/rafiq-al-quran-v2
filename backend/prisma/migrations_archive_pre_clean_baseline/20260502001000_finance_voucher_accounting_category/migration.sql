-- FA-3.2.1: Voucher Schema / Mapping Foundation
-- Adds VoucherAccountingCategory enum and nullable accountingCategory field to finance_vouchers.
-- Safe migration: no DROP, no DELETE, no changes to other tables.

-- CreateEnum
CREATE TYPE "public"."VoucherAccountingCategory" AS ENUM ('DONATION', 'STUDENT_CONTRIBUTION', 'OTHER_INCOME', 'OPERATING_EXPENSE', 'EDUCATIONAL_EXPENSE', 'CENTER_EXPENSE', 'REWARD');

-- AlterTable: add nullable column (existing rows get NULL — no backfill needed)
ALTER TABLE "public"."finance_vouchers" ADD COLUMN "accountingCategory" "public"."VoucherAccountingCategory";
