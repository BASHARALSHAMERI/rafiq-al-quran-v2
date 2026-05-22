-- CreateTable
CREATE TABLE "document_sequences" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "documentType" VARCHAR(40) NOT NULL,
    "year" SMALLINT NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_sequences_organizationId_documentType_year_key" ON "document_sequences"("organizationId", "documentType", "year");

-- AddForeignKey
ALTER TABLE "document_sequences" ADD CONSTRAINT "document_sequences_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "finance_vouchers" ADD COLUMN "manualReferenceNo" VARCHAR(120);
