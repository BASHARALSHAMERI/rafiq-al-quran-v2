DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MatnProgressStatus') THEN
    CREATE TYPE "public"."MatnProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CorrectionTargetType') THEN
    CREATE TYPE "public"."CorrectionTargetType" AS ENUM ('ATTENDANCE', 'FOLLOW_UP', 'EXAM_ATTEMPT');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CorrectionRequestStatus') THEN
    CREATE TYPE "public"."CorrectionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'CANCELLED');
  END IF;
END
$$;

ALTER TABLE "public"."centers"
  ADD COLUMN IF NOT EXISTS "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Riyadh';

CREATE INDEX IF NOT EXISTS "centers_organizationId_timezone_idx"
  ON "public"."centers"("organizationId", "timezone");

ALTER TABLE "public"."attendance_records"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "lock_version" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "attendance_records_circleId_attendanceDate_lock_version_idx"
  ON "public"."attendance_records"("circleId", "attendanceDate", "lock_version");

ALTER TABLE "public"."follow_up_records"
  ADD COLUMN IF NOT EXISTS "from_surah" INTEGER,
  ADD COLUMN IF NOT EXISTS "to_surah" INTEGER,
  ADD COLUMN IF NOT EXISTS "ayah_count" INTEGER,
  ADD COLUMN IF NOT EXISTS "from_page" INTEGER,
  ADD COLUMN IF NOT EXISTS "to_page" INTEGER,
  ADD COLUMN IF NOT EXISTS "matn_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "lock_version" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "follow_up_records_matn_id_idx"
  ON "public"."follow_up_records"("matn_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'follow_up_records_from_surah_range_check'
  ) THEN
    ALTER TABLE "public"."follow_up_records"
      ADD CONSTRAINT "follow_up_records_from_surah_range_check"
      CHECK ("from_surah" IS NULL OR ("from_surah" >= 1 AND "from_surah" <= 114));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'follow_up_records_to_surah_range_check'
  ) THEN
    ALTER TABLE "public"."follow_up_records"
      ADD CONSTRAINT "follow_up_records_to_surah_range_check"
      CHECK ("to_surah" IS NULL OR ("to_surah" >= 1 AND "to_surah" <= 114));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'follow_up_records_ayah_count_check'
  ) THEN
    ALTER TABLE "public"."follow_up_records"
      ADD CONSTRAINT "follow_up_records_ayah_count_check"
      CHECK ("ayah_count" IS NULL OR "ayah_count" > 0);
  END IF;
END
$$;

ALTER TABLE "public"."exam_attempts"
  ADD COLUMN IF NOT EXISTS "lock_version" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "public"."matn_catalogs" (
  "id" SERIAL NOT NULL,
  "organization_id" INTEGER,
  "code" VARCHAR(80) NOT NULL,
  "title_ar" VARCHAR(160) NOT NULL,
  "title_en" VARCHAR(160),
  "category" VARCHAR(80) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "matn_catalogs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "matn_catalogs_organization_id_code_key"
  ON "public"."matn_catalogs"("organization_id", "code");

CREATE INDEX IF NOT EXISTS "matn_catalogs_organization_id_is_active_idx"
  ON "public"."matn_catalogs"("organization_id", "is_active");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matn_catalogs_organization_id_fkey'
  ) THEN
    ALTER TABLE "public"."matn_catalogs"
      ADD CONSTRAINT "matn_catalogs_organization_id_fkey"
      FOREIGN KEY ("organization_id")
      REFERENCES "public"."organizations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'follow_up_records_matn_id_fkey'
  ) THEN
    ALTER TABLE "public"."follow_up_records"
      ADD CONSTRAINT "follow_up_records_matn_id_fkey"
      FOREIGN KEY ("matn_id")
      REFERENCES "public"."matn_catalogs"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "public"."student_matn_progress" (
  "id" SERIAL NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "center_id" INTEGER NOT NULL,
  "circle_id" INTEGER NOT NULL,
  "student_id" INTEGER NOT NULL,
  "matn_id" INTEGER NOT NULL,
  "status" "public"."MatnProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "current_unit" VARCHAR(120),
  "completion_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "last_follow_up_id" INTEGER,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "student_matn_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "student_matn_progress_student_id_matn_id_circle_id_key"
  ON "public"."student_matn_progress"("student_id", "matn_id", "circle_id");

CREATE INDEX IF NOT EXISTS "student_matn_progress_organization_id_center_id_circle_id_idx"
  ON "public"."student_matn_progress"("organization_id", "center_id", "circle_id");

CREATE INDEX IF NOT EXISTS "student_matn_progress_status_idx"
  ON "public"."student_matn_progress"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_matn_progress_organization_id_fkey'
  ) THEN
    ALTER TABLE "public"."student_matn_progress"
      ADD CONSTRAINT "student_matn_progress_organization_id_fkey"
      FOREIGN KEY ("organization_id")
      REFERENCES "public"."organizations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_matn_progress_center_id_fkey'
  ) THEN
    ALTER TABLE "public"."student_matn_progress"
      ADD CONSTRAINT "student_matn_progress_center_id_fkey"
      FOREIGN KEY ("center_id")
      REFERENCES "public"."centers"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_matn_progress_circle_id_fkey'
  ) THEN
    ALTER TABLE "public"."student_matn_progress"
      ADD CONSTRAINT "student_matn_progress_circle_id_fkey"
      FOREIGN KEY ("circle_id")
      REFERENCES "public"."circles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_matn_progress_student_id_fkey'
  ) THEN
    ALTER TABLE "public"."student_matn_progress"
      ADD CONSTRAINT "student_matn_progress_student_id_fkey"
      FOREIGN KEY ("student_id")
      REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_matn_progress_matn_id_fkey'
  ) THEN
    ALTER TABLE "public"."student_matn_progress"
      ADD CONSTRAINT "student_matn_progress_matn_id_fkey"
      FOREIGN KEY ("matn_id")
      REFERENCES "public"."matn_catalogs"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_matn_progress_last_follow_up_id_fkey'
  ) THEN
    ALTER TABLE "public"."student_matn_progress"
      ADD CONSTRAINT "student_matn_progress_last_follow_up_id_fkey"
      FOREIGN KEY ("last_follow_up_id")
      REFERENCES "public"."follow_up_records"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "public"."correction_requests" (
  "id" SERIAL NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "center_id" INTEGER NOT NULL,
  "circle_id" INTEGER NOT NULL,
  "target_type" "public"."CorrectionTargetType" NOT NULL,
  "target_id" INTEGER NOT NULL,
  "requested_by_id" INTEGER NOT NULL,
  "requested_by_role" "public"."Role" NOT NULL,
  "reason" TEXT NOT NULL,
  "proposed_changes" JSONB NOT NULL,
  "current_snapshot" JSONB NOT NULL,
  "status" "public"."CorrectionRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewed_by_id" INTEGER,
  "review_note" VARCHAR(500),
  "reviewed_at" TIMESTAMP(3),
  "applied_by_id" INTEGER,
  "applied_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "correction_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "correction_requests_organization_id_status_created_at_idx"
  ON "public"."correction_requests"("organization_id", "status", "created_at");

CREATE INDEX IF NOT EXISTS "correction_requests_target_type_target_id_idx"
  ON "public"."correction_requests"("target_type", "target_id");

CREATE INDEX IF NOT EXISTS "correction_requests_requested_by_id_created_at_idx"
  ON "public"."correction_requests"("requested_by_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'correction_requests_organization_id_fkey'
  ) THEN
    ALTER TABLE "public"."correction_requests"
      ADD CONSTRAINT "correction_requests_organization_id_fkey"
      FOREIGN KEY ("organization_id")
      REFERENCES "public"."organizations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'correction_requests_center_id_fkey'
  ) THEN
    ALTER TABLE "public"."correction_requests"
      ADD CONSTRAINT "correction_requests_center_id_fkey"
      FOREIGN KEY ("center_id")
      REFERENCES "public"."centers"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'correction_requests_circle_id_fkey'
  ) THEN
    ALTER TABLE "public"."correction_requests"
      ADD CONSTRAINT "correction_requests_circle_id_fkey"
      FOREIGN KEY ("circle_id")
      REFERENCES "public"."circles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'correction_requests_requested_by_id_fkey'
  ) THEN
    ALTER TABLE "public"."correction_requests"
      ADD CONSTRAINT "correction_requests_requested_by_id_fkey"
      FOREIGN KEY ("requested_by_id")
      REFERENCES "public"."users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'correction_requests_reviewed_by_id_fkey'
  ) THEN
    ALTER TABLE "public"."correction_requests"
      ADD CONSTRAINT "correction_requests_reviewed_by_id_fkey"
      FOREIGN KEY ("reviewed_by_id")
      REFERENCES "public"."users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'correction_requests_applied_by_id_fkey'
  ) THEN
    ALTER TABLE "public"."correction_requests"
      ADD CONSTRAINT "correction_requests_applied_by_id_fkey"
      FOREIGN KEY ("applied_by_id")
      REFERENCES "public"."users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "public"."quran_ayah_index" (
  "id" SERIAL NOT NULL,
  "surah_number" INTEGER NOT NULL,
  "ayah_number" INTEGER NOT NULL,
  "page_number" INTEGER NOT NULL,
  "juz_number" INTEGER NOT NULL,
  "hizb_quarter" INTEGER,
  "provider" VARCHAR(120) NOT NULL,
  "provider_version" VARCHAR(120),
  "fetched_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "quran_ayah_index_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "quran_ayah_index_surah_number_ayah_number_key"
  ON "public"."quran_ayah_index"("surah_number", "ayah_number");

CREATE INDEX IF NOT EXISTS "quran_ayah_index_page_number_idx"
  ON "public"."quran_ayah_index"("page_number");

CREATE INDEX IF NOT EXISTS "quran_ayah_index_fetched_at_idx"
  ON "public"."quran_ayah_index"("fetched_at");
