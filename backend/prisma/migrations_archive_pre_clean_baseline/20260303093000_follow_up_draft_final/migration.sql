DO $$
BEGIN
  CREATE TYPE "public"."FollowUpRecordStatus" AS ENUM ('DRAFT', 'FINAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "public"."follow_up_records"
  ADD COLUMN IF NOT EXISTS "status" "public"."FollowUpRecordStatus" NOT NULL DEFAULT 'FINAL',
  ADD COLUMN IF NOT EXISTS "finalized_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "follow_up_records_status_record_date_idx"
  ON "public"."follow_up_records"("status", "record_date");
