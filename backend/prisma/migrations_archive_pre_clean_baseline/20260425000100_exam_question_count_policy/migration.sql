ALTER TABLE "public"."exam_criteria"
ADD COLUMN "min_question_count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "default_question_count" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN "max_question_count" INTEGER NOT NULL DEFAULT 10;
