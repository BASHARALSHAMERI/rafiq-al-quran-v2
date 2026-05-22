-- FA-UX-4: Currencies Lite + Safe Donations/Vouchers Integration
-- Safe migration: CREATE TABLE + ALTER TABLE ADD COLUMN nullable only

-- Create currencies table
CREATE TABLE "currencies" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "nameAr" VARCHAR(60) NOT NULL,
    "nameEn" VARCHAR(60) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- Create exchange_rates table
CREATE TABLE "exchange_rates" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL,
    "rateToBase" DECIMAL(18,6) NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "source" VARCHAR(60),
    "notes" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- Add unique index for currencies per organization
CREATE UNIQUE INDEX "currencies_organizationId_code_key" ON "currencies"("organizationId", "code");

-- Add indexes for currencies
CREATE INDEX "currencies_organizationId_isActive_idx" ON "currencies"("organizationId", "isActive");
CREATE INDEX "currencies_organizationId_isBase_idx" ON "currencies"("organizationId", "isBase");

-- Add indexes for exchange_rates
CREATE INDEX "exchange_rates_organizationId_currencyCode_effectiveDat_idx" ON "exchange_rates"("organizationId", "currencyCode", "effectiveDate");
CREATE INDEX "exchange_rates_organizationId_currencyCode_createdAt_idx" ON "exchange_rates"("organizationId", "currencyCode", "createdAt");

-- Add foreign key for currencies -> organizations
ALTER TABLE "currencies" ADD CONSTRAINT "currencies_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key for exchange_rates -> organizations
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key for exchange_rates -> currencies (composite)
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_organizationId_currencyCode_fkey" 
    FOREIGN KEY ("organizationId", "currencyCode") REFERENCES "currencies"("organizationId", "code") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add nullable currency fields to donations (safe - backward compatible)
ALTER TABLE "donations" ADD COLUMN "originalAmount" DECIMAL(12,2);
ALTER TABLE "donations" ADD COLUMN "originalCurrencyCode" VARCHAR(3);
ALTER TABLE "donations" ADD COLUMN "exchangeRateToBase" DECIMAL(18,6);

-- Add nullable currency fields to finance_vouchers (safe - backward compatible)
ALTER TABLE "finance_vouchers" ADD COLUMN "originalAmount" DECIMAL(12,2);
ALTER TABLE "finance_vouchers" ADD COLUMN "originalCurrencyCode" VARCHAR(3);
ALTER TABLE "finance_vouchers" ADD COLUMN "exchangeRateToBase" DECIMAL(18,6);
