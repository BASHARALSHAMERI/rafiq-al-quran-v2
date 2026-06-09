-- CreateEnum
CREATE TYPE "public"."FinanceAccountType" AS ENUM ('ORG_FUND', 'CENTER_FUND');

-- CreateEnum
CREATE TYPE "public"."VoucherType" AS ENUM ('RECEIPT', 'DISBURSEMENT');

-- CreateEnum
CREATE TYPE "public"."VoucherSourceType" AS ENUM ('PAYMENT', 'PAYROLL_ITEM', 'REWARD_ITEM', 'FUND_TRANSFER', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."VoucherStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'POSTED', 'VOID_REQUESTED', 'VOIDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."FinanceMovementType" AS ENUM ('PAYMENT_COLLECTION', 'VOUCHER_DISBURSEMENT', 'FUND_TRANSFER_OUT', 'FUND_TRANSFER_IN', 'PAYROLL_PAYOUT', 'REWARD_PAYOUT', 'VOID_REVERSAL', 'LEGACY_BACKFILL');

-- CreateEnum
CREATE TYPE "public"."FinanceMovementDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "public"."FundTransferStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."FeeMode" AS ENUM ('FREE', 'SYMBOLIC_ONE_TIME', 'PLAN_MONTHLY');

-- CreateEnum
CREATE TYPE "public"."InvoiceType" AS ENUM ('TUITION_MONTHLY', 'REGISTRATION_ONE_TIME', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TuitionPlanKind" AS ENUM ('MONTHLY', 'ONE_TIME_REGISTRATION');

-- CreateEnum
CREATE TYPE "public"."PayrollBatchStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'PARTIALLY_PAID', 'PAID', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PayrollItemStatus" AS ENUM ('PENDING', 'PAID', 'VOIDED');

-- CreateEnum
CREATE TYPE "public"."RewardCycle" AS ENUM ('MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "public"."RewardBatchStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'PARTIALLY_PAID', 'PAID', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RewardItemStatus" AS ENUM ('PENDING', 'PAID', 'VOIDED');

-- CreateEnum
CREATE TYPE "public"."RewardBeneficiaryRole" AS ENUM ('TEACHER', 'STUDENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AuditEntityType" ADD VALUE 'VOUCHER';
ALTER TYPE "public"."AuditEntityType" ADD VALUE 'FINANCE_ACCOUNT';
ALTER TYPE "public"."AuditEntityType" ADD VALUE 'FUND_TRANSFER';
ALTER TYPE "public"."AuditEntityType" ADD VALUE 'PAYROLL_BATCH';
ALTER TYPE "public"."AuditEntityType" ADD VALUE 'PAYROLL_ITEM';
ALTER TYPE "public"."AuditEntityType" ADD VALUE 'REWARD_BATCH';
ALTER TYPE "public"."AuditEntityType" ADD VALUE 'REWARD_ITEM';

-- AlterEnum
ALTER TYPE "public"."InvoiceStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'VOUCHER_SUBMITTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'VOUCHER_APPROVED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PAYROLL_APPROVED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'REWARD_APPROVED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TRANSFER_APPROVED';

-- AlterTable
ALTER TABLE "public"."invoices" ADD COLUMN     "cancel_reason" VARCHAR(500),
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by_id" INTEGER,
ADD COLUMN     "dueDate" DATE,
ADD COLUMN     "invoiceType" "public"."InvoiceType" NOT NULL DEFAULT 'TUITION_MONTHLY',
ADD COLUMN     "lock_version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notes" VARCHAR(500);

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "attachment_storage_key" VARCHAR(255),
ADD COLUMN     "centerId" INTEGER,
ADD COLUMN     "external_transfer_ref" VARCHAR(120),
ADD COLUMN     "idempotencyKey" VARCHAR(128),
ADD COLUMN     "organizationId" INTEGER,
ADD COLUMN     "voucherId" INTEGER;

-- AlterTable
ALTER TABLE "public"."tuition_plans" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "planKind" "public"."TuitionPlanKind" NOT NULL DEFAULT 'MONTHLY';

-- CreateTable
CREATE TABLE "public"."finance_policy_profiles" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "requireTransferAttachment" BOOLEAN NOT NULL DEFAULT true,
    "requireApprovalDisbursement" BOOLEAN NOT NULL DEFAULT true,
    "requireApprovalReceipt" BOOLEAN NOT NULL DEFAULT false,
    "allowFreeStudents" BOOLEAN NOT NULL DEFAULT true,
    "allowSymbolicOneTimeFee" BOOLEAN NOT NULL DEFAULT true,
    "allowOverdraft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_policy_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_accounts" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "accountType" "public"."FinanceAccountType" NOT NULL,
    "openingBalance" DECIMAL(12,2) NOT NULL,
    "currentBalance" DECIMAL(12,2) NOT NULL,
    "currencyCode" VARCHAR(8) NOT NULL DEFAULT 'YER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_vouchers" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "accountId" INTEGER NOT NULL,
    "voucherType" "public"."VoucherType" NOT NULL,
    "voucherNo" VARCHAR(80) NOT NULL,
    "sourceType" "public"."VoucherSourceType" NOT NULL,
    "sourceId" INTEGER,
    "paymentMethod" "public"."PaymentMethod",
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."VoucherStatus" NOT NULL DEFAULT 'DRAFT',
    "attachmentStorageKey" VARCHAR(255),
    "externalTransferRef" VARCHAR(120),
    "notes" VARCHAR(500),
    "createdById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    "postedById" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" VARCHAR(500),
    "postedAt" TIMESTAMP(3),
    "voidRequestedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_account_movements" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "voucherId" INTEGER NOT NULL,
    "movementType" "public"."FinanceMovementType" NOT NULL,
    "direction" "public"."FinanceMovementDirection" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "reversalOfMovementId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_account_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_fund_transfers" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "fromAccountId" INTEGER NOT NULL,
    "toAccountId" INTEGER NOT NULL,
    "fromCenterId" INTEGER,
    "toCenterId" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."FundTransferStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    "voucherOutId" INTEGER,
    "voucherInId" INTEGER,
    "notes" VARCHAR(500),
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" VARCHAR(500),
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_fund_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_fee_profiles" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "feeMode" "public"."FeeMode" NOT NULL,
    "tuitionPlanId" INTEGER,
    "symbolicAmount" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_fee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_profiles" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "monthlyBaseAmount" DECIMAL(12,2) NOT NULL,
    "paymentMethodDefault" "public"."PaymentMethod" NOT NULL DEFAULT 'CASH',
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_batches" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "status" "public"."PayrollBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "totalNetAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "approvedById" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" VARCHAR(500),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_items" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "beneficiaryUserId" INTEGER NOT NULL,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "bonusAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "status" "public"."PayrollItemStatus" NOT NULL DEFAULT 'PENDING',
    "voucherId" INTEGER,
    "notes" VARCHAR(500),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reward_profiles" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "beneficiaryUserId" INTEGER NOT NULL,
    "beneficiaryRole" "public"."RewardBeneficiaryRole" NOT NULL,
    "cycle" "public"."RewardCycle" NOT NULL,
    "defaultAmount" DECIMAL(12,2) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reward_batches" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "cycle" "public"."RewardCycle" NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER,
    "periodQuarter" INTEGER,
    "status" "public"."RewardBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "approvedById" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" VARCHAR(500),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reward_items" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "beneficiaryUserId" INTEGER NOT NULL,
    "beneficiaryRole" "public"."RewardBeneficiaryRole" NOT NULL,
    "centerId" INTEGER NOT NULL,
    "circleId" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "rankInCircle" INTEGER,
    "status" "public"."RewardItemStatus" NOT NULL DEFAULT 'PENDING',
    "voucherId" INTEGER,
    "notes" VARCHAR(500),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_policy_profiles_organizationId_centerId_idx" ON "public"."finance_policy_profiles"("organizationId", "centerId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_policy_profiles_organizationId_centerId_key" ON "public"."finance_policy_profiles"("organizationId", "centerId");

-- CreateIndex
CREATE INDEX "finance_accounts_organizationId_centerId_isActive_idx" ON "public"."finance_accounts"("organizationId", "centerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "finance_accounts_organizationId_accountType_centerId_key" ON "public"."finance_accounts"("organizationId", "accountType", "centerId");

-- CreateIndex
CREATE INDEX "finance_vouchers_organizationId_centerId_status_createdAt_idx" ON "public"."finance_vouchers"("organizationId", "centerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "finance_vouchers_sourceType_sourceId_idx" ON "public"."finance_vouchers"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "finance_vouchers_accountId_postedAt_idx" ON "public"."finance_vouchers"("accountId", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "finance_vouchers_organizationId_voucherNo_key" ON "public"."finance_vouchers"("organizationId", "voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "finance_account_movements_voucherId_key" ON "public"."finance_account_movements"("voucherId");

-- CreateIndex
CREATE INDEX "finance_account_movements_accountId_postedAt_id_idx" ON "public"."finance_account_movements"("accountId", "postedAt", "id");

-- CreateIndex
CREATE INDEX "finance_account_movements_organizationId_movementType_poste_idx" ON "public"."finance_account_movements"("organizationId", "movementType", "postedAt");

-- CreateIndex
CREATE INDEX "finance_account_movements_reversalOfMovementId_idx" ON "public"."finance_account_movements"("reversalOfMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_fund_transfers_voucherOutId_key" ON "public"."finance_fund_transfers"("voucherOutId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_fund_transfers_voucherInId_key" ON "public"."finance_fund_transfers"("voucherInId");

-- CreateIndex
CREATE INDEX "finance_fund_transfers_organizationId_status_createdAt_idx" ON "public"."finance_fund_transfers"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "finance_fund_transfers_fromAccountId_toAccountId_status_idx" ON "public"."finance_fund_transfers"("fromAccountId", "toAccountId", "status");

-- CreateIndex
CREATE INDEX "student_fee_profiles_centerId_studentId_isActive_idx" ON "public"."student_fee_profiles"("centerId", "studentId", "isActive");

-- CreateIndex
CREATE INDEX "student_fee_profiles_organizationId_feeMode_isActive_idx" ON "public"."student_fee_profiles"("organizationId", "feeMode", "isActive");

-- CreateIndex
CREATE INDEX "payroll_profiles_centerId_userId_isActive_idx" ON "public"."payroll_profiles"("centerId", "userId", "isActive");

-- CreateIndex
CREATE INDEX "payroll_profiles_organizationId_isActive_idx" ON "public"."payroll_profiles"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "payroll_batches_organizationId_centerId_status_idx" ON "public"."payroll_batches"("organizationId", "centerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_batches_centerId_periodYear_periodMonth_key" ON "public"."payroll_batches"("centerId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_items_voucherId_key" ON "public"."payroll_items"("voucherId");

-- CreateIndex
CREATE INDEX "payroll_items_batchId_status_idx" ON "public"."payroll_items"("batchId", "status");

-- CreateIndex
CREATE INDEX "payroll_items_beneficiaryUserId_status_idx" ON "public"."payroll_items"("beneficiaryUserId", "status");

-- CreateIndex
CREATE INDEX "reward_profiles_organizationId_beneficiaryUserId_isActive_idx" ON "public"."reward_profiles"("organizationId", "beneficiaryUserId", "isActive");

-- CreateIndex
CREATE INDEX "reward_profiles_centerId_cycle_isActive_idx" ON "public"."reward_profiles"("centerId", "cycle", "isActive");

-- CreateIndex
CREATE INDEX "reward_batches_organizationId_cycle_periodYear_status_idx" ON "public"."reward_batches"("organizationId", "cycle", "periodYear", "status");

-- CreateIndex
CREATE INDEX "reward_batches_centerId_status_idx" ON "public"."reward_batches"("centerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reward_items_voucherId_key" ON "public"."reward_items"("voucherId");

-- CreateIndex
CREATE INDEX "reward_items_batchId_status_idx" ON "public"."reward_items"("batchId", "status");

-- CreateIndex
CREATE INDEX "reward_items_beneficiaryUserId_status_idx" ON "public"."reward_items"("beneficiaryUserId", "status");

-- CreateIndex
CREATE INDEX "invoices_status_dueDate_idx" ON "public"."invoices"("status", "dueDate");

-- CreateIndex
CREATE INDEX "invoices_cancelled_at_idx" ON "public"."invoices"("cancelled_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_voucherId_key" ON "public"."payments"("voucherId");

-- CreateIndex
CREATE INDEX "payments_organizationId_centerId_createdAt_idx" ON "public"."payments"("organizationId", "centerId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_method_createdAt_idx" ON "public"."payments"("method", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_organizationId_idempotencyKey_key" ON "public"."payments"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "tuition_plans_planKind_isActive_idx" ON "public"."tuition_plans"("planKind", "isActive");

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_policy_profiles" ADD CONSTRAINT "finance_policy_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_policy_profiles" ADD CONSTRAINT "finance_policy_profiles_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_accounts" ADD CONSTRAINT "finance_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_accounts" ADD CONSTRAINT "finance_accounts_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_vouchers" ADD CONSTRAINT "finance_vouchers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_vouchers" ADD CONSTRAINT "finance_vouchers_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_vouchers" ADD CONSTRAINT "finance_vouchers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."finance_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_vouchers" ADD CONSTRAINT "finance_vouchers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_vouchers" ADD CONSTRAINT "finance_vouchers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_vouchers" ADD CONSTRAINT "finance_vouchers_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_account_movements" ADD CONSTRAINT "finance_account_movements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_account_movements" ADD CONSTRAINT "finance_account_movements_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."finance_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_account_movements" ADD CONSTRAINT "finance_account_movements_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."finance_vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_account_movements" ADD CONSTRAINT "finance_account_movements_reversalOfMovementId_fkey" FOREIGN KEY ("reversalOfMovementId") REFERENCES "public"."finance_account_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "public"."finance_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "public"."finance_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_fromCenterId_fkey" FOREIGN KEY ("fromCenterId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_toCenterId_fkey" FOREIGN KEY ("toCenterId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_voucherOutId_fkey" FOREIGN KEY ("voucherOutId") REFERENCES "public"."finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_fund_transfers" ADD CONSTRAINT "finance_fund_transfers_voucherInId_fkey" FOREIGN KEY ("voucherInId") REFERENCES "public"."finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_fee_profiles" ADD CONSTRAINT "student_fee_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_fee_profiles" ADD CONSTRAINT "student_fee_profiles_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_fee_profiles" ADD CONSTRAINT "student_fee_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_fee_profiles" ADD CONSTRAINT "student_fee_profiles_tuitionPlanId_fkey" FOREIGN KEY ("tuitionPlanId") REFERENCES "public"."tuition_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_profiles" ADD CONSTRAINT "payroll_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_profiles" ADD CONSTRAINT "payroll_profiles_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_profiles" ADD CONSTRAINT "payroll_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_batches" ADD CONSTRAINT "payroll_batches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_batches" ADD CONSTRAINT "payroll_batches_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_batches" ADD CONSTRAINT "payroll_batches_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_items" ADD CONSTRAINT "payroll_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."payroll_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_items" ADD CONSTRAINT "payroll_items_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_items" ADD CONSTRAINT "payroll_items_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_profiles" ADD CONSTRAINT "reward_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_profiles" ADD CONSTRAINT "reward_profiles_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_profiles" ADD CONSTRAINT "reward_profiles_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_batches" ADD CONSTRAINT "reward_batches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_batches" ADD CONSTRAINT "reward_batches_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_batches" ADD CONSTRAINT "reward_batches_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_items" ADD CONSTRAINT "reward_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."reward_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_items" ADD CONSTRAINT "reward_items_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_items" ADD CONSTRAINT "reward_items_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_items" ADD CONSTRAINT "reward_items_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_items" ADD CONSTRAINT "reward_items_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
