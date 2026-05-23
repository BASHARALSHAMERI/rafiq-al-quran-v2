CREATE TYPE "DonorType" AS ENUM (
  'CHARITY_FOUNDATION',
  'CHARITY_ASSOCIATION',
  'INDIVIDUAL_DONOR',
  'MERCHANT',
  'PARENT_DONOR',
  'GOVERNMENT_ENTITY',
  'CORPORATE_SPONSOR'
);

CREATE TYPE "DonationStatus" AS ENUM (
  'PLEDGED',
  'RECEIVED',
  'CANCELLED'
);

CREATE TABLE "donors" (
  "id" SERIAL NOT NULL,
  "organizationId" INTEGER NOT NULL,
  "centerId" INTEGER,
  "name" VARCHAR(180) NOT NULL,
  "donorType" "DonorType" NOT NULL,
  "phone" VARCHAR(40),
  "email" VARCHAR(180),
  "address" VARCHAR(255),
  "contactPerson" VARCHAR(180),
  "notes" VARCHAR(500),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "donations" (
  "id" SERIAL NOT NULL,
  "organizationId" INTEGER NOT NULL,
  "centerId" INTEGER,
  "donorId" INTEGER NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "donationDate" DATE NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "purpose" VARCHAR(255),
  "status" "DonationStatus" NOT NULL DEFAULT 'PLEDGED',
  "isPledge" BOOLEAN NOT NULL DEFAULT true,
  "pledgeDueDate" DATE,
  "receivedDate" DATE,
  "voucherId" INTEGER,
  "notes" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "donations_voucherId_key" ON "donations"("voucherId");
CREATE INDEX "donors_organizationId_centerId_isActive_idx" ON "donors"("organizationId", "centerId", "isActive");
CREATE INDEX "donors_organizationId_donorType_idx" ON "donors"("organizationId", "donorType");
CREATE INDEX "donations_organizationId_centerId_status_donationDate_idx" ON "donations"("organizationId", "centerId", "status", "donationDate");
CREATE INDEX "donations_donorId_status_idx" ON "donations"("donorId", "status");

ALTER TABLE "donors" ADD CONSTRAINT "donors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "donors" ADD CONSTRAINT "donors_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "donations" ADD CONSTRAINT "donations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "donations" ADD CONSTRAINT "donations_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "donations" ADD CONSTRAINT "donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "donations" ADD CONSTRAINT "donations_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "finance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
