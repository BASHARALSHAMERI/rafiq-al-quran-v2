-- CreateEnum
CREATE TYPE "public"."ExamPurpose" AS ENUM ('NORMAL', 'MONTHLY', 'LEVEL', 'GOLDEN_RECORD_MUSHAF');

-- AlterTable
ALTER TABLE "public"."exams"
    ADD COLUMN "purpose" "public"."ExamPurpose" NOT NULL DEFAULT 'NORMAL';

-- CreateIndex
CREATE INDEX "exams_organization_id_center_id_purpose_status_idx"
    ON "public"."exams"("organization_id", "center_id", "purpose", "status");

-- CreateIndex
CREATE INDEX "exams_purpose_scheduled_at_idx"
    ON "public"."exams"("purpose", "scheduled_at");
