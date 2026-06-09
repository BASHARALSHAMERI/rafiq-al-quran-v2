-- CreateEnum
CREATE TYPE "public"."FiscalPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."finance_settings" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "baseCurrencyCode" VARCHAR(8) NOT NULL DEFAULT 'YER',
    "fiscalYearStartMonth" SMALLINT NOT NULL DEFAULT 1,
    "roundingPolicy" VARCHAR(40),
    "defaultCashAccountId" INTEGER,
    "defaultBankAccountId" INTEGER,
    "defaultStudentRevenueAccountId" INTEGER,
    "defaultDonationRevenueAccountId" INTEGER,
    "defaultPayrollExpenseAccountId" INTEGER,
    "defaultOperatingExpenseAccountId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fiscal_years" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "public"."FiscalPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fiscal_periods" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    "periodNumber" SMALLINT NOT NULL,
    "periodName" VARCHAR(60) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "public"."FiscalPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_settings_organizationId_key" ON "public"."finance_settings"("organizationId");

-- CreateIndex
CREATE INDEX "fiscal_years_organizationId_status_idx" ON "public"."fiscal_years"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_years_organizationId_year_key" ON "public"."fiscal_years"("organizationId", "year");

-- CreateIndex
CREATE INDEX "fiscal_periods_organizationId_startDate_endDate_idx" ON "public"."fiscal_periods"("organizationId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "fiscal_periods_organizationId_status_idx" ON "public"."fiscal_periods"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_periods_fiscalYearId_periodNumber_key" ON "public"."fiscal_periods"("fiscalYearId", "periodNumber");

-- AddForeignKey
ALTER TABLE "public"."finance_settings" ADD CONSTRAINT "finance_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_years" ADD CONSTRAINT "fiscal_years_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_years" ADD CONSTRAINT "fiscal_years_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_periods" ADD CONSTRAINT "fiscal_periods_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."fiscal_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_periods" ADD CONSTRAINT "fiscal_periods_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_periods" ADD CONSTRAINT "fiscal_periods_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
