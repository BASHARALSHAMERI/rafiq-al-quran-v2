-- DB-FINAL-B: Matn linking and Remote Recitation scope cleanup.
-- MatnCatalog remains as source of truth.
-- RemoteRecitation models are scoped by Center/Circle instead of Organization.

-- DropForeignKey
ALTER TABLE "public"."remote_recitation_bookings" DROP CONSTRAINT "remote_recitation_bookings_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."remote_recitation_settings" DROP CONSTRAINT "remote_recitation_settings_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."remote_recitation_slots" DROP CONSTRAINT "remote_recitation_slots_organization_id_fkey";

-- DropIndex
DROP INDEX "public"."remote_recitation_bookings_organization_id_status_requested_idx";

-- DropIndex
DROP INDEX "public"."remote_recitation_settings_organization_id_idx";

-- DropIndex
DROP INDEX "public"."remote_recitation_slots_organization_id_starts_at_idx";

-- AlterTable
ALTER TABLE "public"."follow_up_records" ADD COLUMN     "matn_from_ref" VARCHAR(80),
ADD COLUMN     "matn_to_ref" VARCHAR(80);

-- AlterTable
ALTER TABLE "public"."remote_recitation_bookings" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "public"."remote_recitation_settings" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "public"."remote_recitation_slots" DROP COLUMN "organization_id";
