DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExamQuestionSource') THEN
    CREATE TYPE "ExamQuestionSource" AS ENUM ('MANUAL', 'AUTO');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "public"."exam_question_bank_items" (
  "id" SERIAL NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "center_id" INTEGER,
  "circle_id" INTEGER,
  "from_surah" INTEGER NOT NULL,
  "from_ayah" INTEGER NOT NULL,
  "to_surah" INTEGER NOT NULL,
  "to_ayah" INTEGER NOT NULL,
  "suggested_text" TEXT,
  "source" "ExamQuestionSource" NOT NULL DEFAULT 'MANUAL',
  "created_by_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "exam_question_bank_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "exam_question_bank_items_organization_id_created_at_idx"
  ON "public"."exam_question_bank_items"("organization_id", "created_at");

CREATE INDEX IF NOT EXISTS "exam_question_bank_items_center_id_circle_id_created_at_idx"
  ON "public"."exam_question_bank_items"("center_id", "circle_id", "created_at");

CREATE INDEX IF NOT EXISTS "exam_question_bank_items_from_surah_to_surah_idx"
  ON "public"."exam_question_bank_items"("from_surah", "to_surah");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_question_bank_items_organization_id_fkey'
  ) THEN
    ALTER TABLE "public"."exam_question_bank_items"
      ADD CONSTRAINT "exam_question_bank_items_organization_id_fkey"
      FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_question_bank_items_center_id_fkey'
  ) THEN
    ALTER TABLE "public"."exam_question_bank_items"
      ADD CONSTRAINT "exam_question_bank_items_center_id_fkey"
      FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_question_bank_items_circle_id_fkey'
  ) THEN
    ALTER TABLE "public"."exam_question_bank_items"
      ADD CONSTRAINT "exam_question_bank_items_circle_id_fkey"
      FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_question_bank_items_created_by_id_fkey'
  ) THEN
    ALTER TABLE "public"."exam_question_bank_items"
      ADD CONSTRAINT "exam_question_bank_items_created_by_id_fkey"
      FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
