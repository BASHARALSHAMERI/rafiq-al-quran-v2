ALTER TABLE "public"."exam_question_bank_items"
  DROP CONSTRAINT IF EXISTS "exam_question_bank_items_center_id_fkey";

ALTER TABLE "public"."exam_question_bank_items"
  DROP CONSTRAINT IF EXISTS "exam_question_bank_items_circle_id_fkey";

DROP INDEX IF EXISTS "public"."exam_question_bank_items_center_id_circle_id_created_at_idx";

ALTER TABLE "public"."exam_question_bank_items"
  DROP COLUMN IF EXISTS "center_id",
  DROP COLUMN IF EXISTS "circle_id";

ALTER TABLE "public"."exam_question_bank_items"
  ADD COLUMN IF NOT EXISTS "page_number" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "line_count" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "difficulty_level" INTEGER NOT NULL DEFAULT 3;
