-- Fix missing exam scoring columns that are used by current backend code/schema.
ALTER TABLE "public"."exam_criteria"
ADD COLUMN IF NOT EXISTS "theoretical_tajweed_score" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "public"."exam_attempt_breakdown"
ADD COLUMN IF NOT EXISTS "theoretical_tajweed_score" INTEGER;

ALTER TABLE "public"."exam_attempt_breakdown"
ADD COLUMN IF NOT EXISTS "strength_notes" TEXT;

ALTER TABLE "public"."exam_attempt_breakdown"
ADD COLUMN IF NOT EXISTS "weakness_notes" TEXT;
