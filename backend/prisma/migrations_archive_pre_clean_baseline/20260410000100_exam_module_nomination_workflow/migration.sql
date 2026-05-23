-- Create enums required by the final exams workflow.
CREATE TYPE "NominationRequestStatus" AS ENUM (
  'SUBMITTED',
  'RETURNED',
  'REJECTED',
  'DEFERRED',
  'SUPERVISOR_APPROVED',
  'CENTER_APPROVED'
);

CREATE TYPE "CommitteeRole" AS ENUM ('CHAIR', 'MEMBER');

-- Replace the old attempt status enum with the institutional workflow.
ALTER TYPE "AttemptStatus" RENAME TO "AttemptStatus_old";

CREATE TYPE "AttemptStatus" AS ENUM (
  'SCHEDULED',
  'IN_PROGRESS',
  'EVALUATED',
  'APPROVED',
  'PUBLISHED',
  'CANCELLED'
);

ALTER TABLE "exam_attempts"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "AttemptStatus"
  USING (
    CASE
      WHEN "status"::text = 'SUBMITTED' THEN 'IN_PROGRESS'::"AttemptStatus"
      WHEN "status"::text = 'REVIEWED' THEN 'APPROVED'::"AttemptStatus"
      ELSE "status"::text::"AttemptStatus"
    END
  ),
  ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';

DROP TYPE "AttemptStatus_old";

-- Add the nomination request table.
CREATE TABLE "exam_nomination_requests" (
  "id" SERIAL NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "center_id" INTEGER NOT NULL,
  "exam_id" INTEGER NOT NULL,
  "student_id" INTEGER NOT NULL,
  "circle_id" INTEGER NOT NULL,
  "proposed_exam_date" DATE,
  "teacher_notes" VARCHAR(2000),
  "readiness_score" INTEGER,
  "status" "NominationRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
  "supervisor_review_notes" VARCHAR(2000),
  "supervisor_reviewed_by_id" INTEGER,
  "supervisor_reviewed_at" TIMESTAMP(3),
  "center_approval_notes" VARCHAR(2000),
  "center_approved_by_id" INTEGER,
  "center_approved_at" TIMESTAMP(3),
  "created_by_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "exam_nomination_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "exam_nomination_requests_organization_id_status_created_at_idx"
  ON "exam_nomination_requests"("organization_id", "status", "created_at");
CREATE INDEX "exam_nomination_requests_center_id_status_created_at_idx"
  ON "exam_nomination_requests"("center_id", "status", "created_at");
CREATE INDEX "exam_nomination_requests_circle_id_status_created_at_idx"
  ON "exam_nomination_requests"("circle_id", "status", "created_at");
CREATE INDEX "exam_nomination_requests_student_id_status_created_at_idx"
  ON "exam_nomination_requests"("student_id", "status", "created_at");
CREATE INDEX "exam_nomination_requests_exam_id_status_created_at_idx"
  ON "exam_nomination_requests"("exam_id", "status", "created_at");

ALTER TABLE "exam_nomination_requests"
  ADD CONSTRAINT "exam_nomination_requests_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "exam_nomination_requests_center_id_fkey"
    FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "exam_nomination_requests_exam_id_fkey"
    FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "exam_nomination_requests_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "exam_nomination_requests_circle_id_fkey"
    FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "exam_nomination_requests_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "exam_nomination_requests_supervisor_reviewed_by_id_fkey"
    FOREIGN KEY ("supervisor_reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "exam_nomination_requests_center_approved_by_id_fkey"
    FOREIGN KEY ("center_approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Extend exam attempts with nomination, closure, approval and publication metadata.
ALTER TABLE "exam_attempts"
  ADD COLUMN "nomination_request_id" INTEGER,
  ADD COLUMN "evaluation_closed_by_id" INTEGER,
  ADD COLUMN "evaluation_closed_at" TIMESTAMP(3),
  ADD COLUMN "approved_by_id" INTEGER,
  ADD COLUMN "approved_at" TIMESTAMP(3),
  ADD COLUMN "published_by_id" INTEGER,
  ADD COLUMN "published_at" TIMESTAMP(3);

ALTER TABLE "exam_attempts"
  ADD CONSTRAINT "exam_attempts_nomination_request_id_fkey"
    FOREIGN KEY ("nomination_request_id") REFERENCES "exam_nomination_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "exam_attempts_evaluation_closed_by_id_fkey"
    FOREIGN KEY ("evaluation_closed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "exam_attempts_approved_by_id_fkey"
    FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "exam_attempts_published_by_id_fkey"
    FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "exam_attempts_nomination_request_id_key"
  ON "exam_attempts"("nomination_request_id");
CREATE INDEX "exam_attempts_status_approved_at_idx"
  ON "exam_attempts"("status", "approved_at");
CREATE INDEX "exam_attempts_status_published_at_idx"
  ON "exam_attempts"("status", "published_at");

-- Extend committee members with explicit committee role.
ALTER TABLE "exam_attempt_committee_members"
  ADD COLUMN "committee_role" "CommitteeRole" NOT NULL DEFAULT 'MEMBER';

-- Backfill legacy reviewed attempts into the new approval/evaluation fields.
UPDATE "exam_attempts"
SET
  "evaluation_closed_by_id" = COALESCE("evaluation_closed_by_id", "evaluated_by_id"),
  "evaluation_closed_at" = COALESCE("evaluation_closed_at", "reviewed_at", "updated_at", "created_at"),
  "approved_by_id" = COALESCE("approved_by_id", "evaluated_by_id"),
  "approved_at" = COALESCE("approved_at", "reviewed_at", "updated_at", "created_at")
WHERE "reviewed_at" IS NOT NULL
   OR "status" = 'APPROVED';

-- Ensure every historical committee has exactly one chair.
WITH ranked_members AS (
  SELECT
    eacm."id",
    eacm."attempt_id",
    ROW_NUMBER() OVER (
      PARTITION BY eacm."attempt_id"
      ORDER BY
        CASE WHEN eacm."role_at_assignment" = 'SUPERVISOR' THEN 0 ELSE 1 END,
        eacm."created_at" ASC,
        eacm."id" ASC
    ) AS chair_rank
  FROM "exam_attempt_committee_members" eacm
)
UPDATE "exam_attempt_committee_members" AS target
SET "committee_role" = CASE WHEN ranked_members."chair_rank" = 1 THEN 'CHAIR'::"CommitteeRole" ELSE 'MEMBER'::"CommitteeRole" END
FROM ranked_members
WHERE ranked_members."id" = target."id";
