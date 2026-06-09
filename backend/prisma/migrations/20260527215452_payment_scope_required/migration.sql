/*
  Warnings:

  - Made the column `centerId` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill Payment scope from the required linked Invoice and its Center.
UPDATE "public"."payments" AS p
SET
  "centerId" = COALESCE(p."centerId", i."centerId"),
  "organizationId" = COALESCE(p."organizationId", c."organizationId")
FROM "public"."invoices" AS i
JOIN "public"."centers" AS c ON c."id" = i."centerId"
WHERE p."invoiceId" = i."id"
  AND (p."centerId" IS NULL OR p."organizationId" IS NULL);

-- AlterTable
ALTER TABLE "public"."payments" ALTER COLUMN "centerId" SET NOT NULL,
ALTER COLUMN "organizationId" SET NOT NULL;
