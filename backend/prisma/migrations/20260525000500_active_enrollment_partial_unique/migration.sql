-- Phase 5: FIX-DUPLICATE-ACTIVE-PROFILES
-- Replace the hard unique constraint on (studentId, circleId) with a partial
-- unique index scoped to ACTIVE enrollments only.
-- This allows a student to be re-enrolled in a circle after a previous ENDED enrollment,
-- while still preventing two ACTIVE enrollments for the same student/circle.

DROP INDEX IF EXISTS "student_circle_enrollments_studentId_circleId_key";

CREATE UNIQUE INDEX "student_circle_enrollments_active_unique"
  ON "public"."student_circle_enrollments"("studentId", "circleId")
  WHERE (status = 'ACTIVE');

CREATE INDEX IF NOT EXISTS "student_circle_enrollments_studentId_circleId_idx"
  ON "public"."student_circle_enrollments"("studentId", "circleId");
