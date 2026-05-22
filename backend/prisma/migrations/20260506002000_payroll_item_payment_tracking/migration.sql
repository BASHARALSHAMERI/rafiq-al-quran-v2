ALTER TYPE "public"."PayrollItemStatus" ADD VALUE IF NOT EXISTS 'FAILED';

ALTER TABLE "public"."payroll_items"
ADD COLUMN "paymentMethod" "public"."PaymentMethod",
ADD COLUMN "paymentReference" VARCHAR(120),
ADD COLUMN "failureReason" VARCHAR(500);
