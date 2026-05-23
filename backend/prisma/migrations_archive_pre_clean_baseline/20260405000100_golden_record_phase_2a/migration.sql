-- CreateEnum
CREATE TYPE "public"."GraduationCandidateStatus" AS ENUM ('NOMINATED', 'SCHEDULED', 'TESTED', 'APPROVED', 'REJECTED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "public"."GoldenRecordStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."GoldenRecordType" AS ENUM ('KHATEM', 'IJAZAH');

-- CreateEnum
CREATE TYPE "public"."GoldenRecordSource" AS ENUM ('CANDIDATE', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."AchievementCategory" AS ENUM ('LESS_THAN_10_JUZ', 'JUZ_10', 'JUZ_20', 'JUZ_30');

-- AlterEnum
ALTER TYPE "public"."KhatmType" ADD VALUE 'QIRAAT';

-- CreateTable
CREATE TABLE "public"."graduation_candidates" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "year" SMALLINT NOT NULL,
    "student_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "exam_id" INTEGER,
    "exam_attempt_id" INTEGER,
    "student_name_snapshot" VARCHAR(120) NOT NULL,
    "center_name_snapshot" VARCHAR(120) NOT NULL,
    "circle_name_snapshot" VARCHAR(120) NOT NULL,
    "memorization_completion_date" DATE,
    "khatma_test_date" DATE,
    "memorization_start_date" DATE,
    "memorization_duration_months" SMALLINT,
    "grade_snapshot" VARCHAR(40),
    "average_snapshot" DECIMAL(5,2),
    "notes" VARCHAR(1000),
    "status" "public"."GraduationCandidateStatus" NOT NULL DEFAULT 'NOMINATED',
    "status_note" VARCHAR(1000),
    "approved_by_id" INTEGER,
    "approved_at" TIMESTAMP(3),
    "rejected_by_id" INTEGER,
    "rejected_at" TIMESTAMP(3),
    "deferred_by_id" INTEGER,
    "deferred_at" TIMESTAMP(3),
    "created_by_id" INTEGER NOT NULL,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "graduation_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."golden_records" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "year" SMALLINT NOT NULL,
    "source" "public"."GoldenRecordSource" NOT NULL,
    "candidate_id" INTEGER,
    "exam_id" INTEGER,
    "exam_attempt_id" INTEGER,
    "student_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "student_name_snapshot" VARCHAR(120) NOT NULL,
    "center_name_snapshot" VARCHAR(120) NOT NULL,
    "circle_name_snapshot" VARCHAR(120),
    "registry_serial" VARCHAR(40),
    "grade" VARCHAR(40) NOT NULL,
    "average" DECIMAL(5,2) NOT NULL,
    "appreciation" VARCHAR(60) NOT NULL,
    "exam_date" DATE NOT NULL,
    "type" "public"."GoldenRecordType" NOT NULL,
    "riwaya" "public"."RiwayaType",
    "notes" VARCHAR(1000),
    "status" "public"."GoldenRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "status_note" VARCHAR(1000),
    "submitted_by_id" INTEGER,
    "submitted_at" TIMESTAMP(3),
    "approved_by_id" INTEGER,
    "approved_at" TIMESTAMP(3),
    "rejected_by_id" INTEGER,
    "rejected_at" TIMESTAMP(3),
    "created_by_id" INTEGER NOT NULL,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "golden_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_yearly_achievement_snapshots" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "year" SMALLINT NOT NULL,
    "student_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "achievement_category" "public"."AchievementCategory" NOT NULL,
    "juz_count" SMALLINT NOT NULL,
    "golden_record_id" INTEGER,
    "snapshot_source" VARCHAR(30) NOT NULL,
    "captured_by_id" INTEGER,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" VARCHAR(500),

    CONSTRAINT "student_yearly_achievement_snapshots_pkey" PRIMARY KEY ("id")
);

-- Check constraints not expressible in Prisma schema
ALTER TABLE "public"."graduation_candidates"
    ADD CONSTRAINT "graduation_candidates_year_check" CHECK ("year" BETWEEN 2000 AND 2100),
    ADD CONSTRAINT "graduation_candidates_memorization_duration_months_check" CHECK ("memorization_duration_months" IS NULL OR "memorization_duration_months" >= 0),
    ADD CONSTRAINT "graduation_candidates_average_snapshot_check" CHECK ("average_snapshot" IS NULL OR ("average_snapshot" >= 0 AND "average_snapshot" <= 100));

ALTER TABLE "public"."golden_records"
    ADD CONSTRAINT "golden_records_year_check" CHECK ("year" BETWEEN 2000 AND 2100),
    ADD CONSTRAINT "golden_records_average_check" CHECK ("average" >= 0 AND "average" <= 100),
    ADD CONSTRAINT "golden_records_riwaya_for_ijazah_check" CHECK ("type" <> 'IJAZAH' OR "riwaya" IS NOT NULL);

ALTER TABLE "public"."student_yearly_achievement_snapshots"
    ADD CONSTRAINT "student_yearly_achievement_snapshots_year_check" CHECK ("year" BETWEEN 2000 AND 2100),
    ADD CONSTRAINT "student_yearly_achievement_snapshots_juz_count_check" CHECK ("juz_count" BETWEEN 0 AND 30),
    ADD CONSTRAINT "student_yearly_achievement_snapshots_category_check" CHECK (
        ("achievement_category" = 'LESS_THAN_10_JUZ' AND "juz_count" BETWEEN 0 AND 9)
        OR ("achievement_category" = 'JUZ_10' AND "juz_count" BETWEEN 10 AND 19)
        OR ("achievement_category" = 'JUZ_20' AND "juz_count" BETWEEN 20 AND 29)
        OR ("achievement_category" = 'JUZ_30' AND "juz_count" = 30)
    );

-- CreateIndex
CREATE UNIQUE INDEX "graduation_candidates_exam_attempt_id_key" ON "public"."graduation_candidates"("exam_attempt_id");

-- CreateIndex
CREATE INDEX "graduation_candidates_organization_id_year_center_id_status_idx" ON "public"."graduation_candidates"("organization_id", "year", "center_id", "status");

-- CreateIndex
CREATE INDEX "graduation_candidates_student_id_year_idx" ON "public"."graduation_candidates"("student_id", "year");

-- CreateIndex
CREATE INDEX "graduation_candidates_center_id_year_idx" ON "public"."graduation_candidates"("center_id", "year");

-- CreateIndex
CREATE INDEX "graduation_candidates_circle_id_year_idx" ON "public"."graduation_candidates"("circle_id", "year");

-- CreateIndex
CREATE INDEX "graduation_candidates_status_year_idx" ON "public"."graduation_candidates"("status", "year");

-- CreateIndex
CREATE INDEX "graduation_candidates_exam_id_idx" ON "public"."graduation_candidates"("exam_id");

-- CreateIndex
CREATE INDEX "graduation_candidates_created_by_id_idx" ON "public"."graduation_candidates"("created_by_id");

-- CreateIndex
CREATE INDEX "graduation_candidates_updated_by_id_idx" ON "public"."graduation_candidates"("updated_by_id");

-- CreateIndex
CREATE INDEX "graduation_candidates_approved_by_id_idx" ON "public"."graduation_candidates"("approved_by_id");

-- CreateIndex
CREATE INDEX "graduation_candidates_rejected_by_id_idx" ON "public"."graduation_candidates"("rejected_by_id");

-- CreateIndex
CREATE INDEX "graduation_candidates_deferred_by_id_idx" ON "public"."graduation_candidates"("deferred_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "graduation_candidates_organization_id_student_id_year_key" ON "public"."graduation_candidates"("organization_id", "student_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "golden_records_candidate_id_key" ON "public"."golden_records"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "golden_records_exam_attempt_id_key" ON "public"."golden_records"("exam_attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "golden_records_registry_serial_key" ON "public"."golden_records"("registry_serial");

-- CreateIndex
CREATE INDEX "golden_records_organization_id_year_center_id_status_idx" ON "public"."golden_records"("organization_id", "year", "center_id", "status");

-- CreateIndex
CREATE INDEX "golden_records_organization_id_year_type_idx" ON "public"."golden_records"("organization_id", "year", "type");

-- CreateIndex
CREATE INDEX "golden_records_organization_id_year_riwaya_idx" ON "public"."golden_records"("organization_id", "year", "riwaya");

-- CreateIndex
CREATE INDEX "golden_records_student_id_year_idx" ON "public"."golden_records"("student_id", "year");

-- CreateIndex
CREATE INDEX "golden_records_exam_id_idx" ON "public"."golden_records"("exam_id");

-- CreateIndex
CREATE INDEX "golden_records_circle_id_idx" ON "public"."golden_records"("circle_id");

-- CreateIndex
CREATE INDEX "golden_records_created_by_id_idx" ON "public"."golden_records"("created_by_id");

-- CreateIndex
CREATE INDEX "golden_records_updated_by_id_idx" ON "public"."golden_records"("updated_by_id");

-- CreateIndex
CREATE INDEX "golden_records_submitted_by_id_idx" ON "public"."golden_records"("submitted_by_id");

-- CreateIndex
CREATE INDEX "golden_records_approved_by_id_idx" ON "public"."golden_records"("approved_by_id");

-- CreateIndex
CREATE INDEX "golden_records_rejected_by_id_idx" ON "public"."golden_records"("rejected_by_id");

-- CreateIndex
CREATE INDEX "golden_records_approved_at_idx" ON "public"."golden_records"("approved_at");

-- CreateIndex
CREATE UNIQUE INDEX "golden_records_organization_id_student_id_year_type_key" ON "public"."golden_records"("organization_id", "student_id", "year", "type");

-- CreateIndex
CREATE UNIQUE INDEX "student_yearly_achievement_snapshots_golden_record_id_key" ON "public"."student_yearly_achievement_snapshots"("golden_record_id");

-- CreateIndex
CREATE INDEX "student_yearly_achievement_snapshots_organization_id_year_center_id_achievement_category_idx" ON "public"."student_yearly_achievement_snapshots"("organization_id", "year", "center_id", "achievement_category");

-- CreateIndex
CREATE INDEX "student_yearly_achievement_snapshots_organization_id_year_achievement_category_idx" ON "public"."student_yearly_achievement_snapshots"("organization_id", "year", "achievement_category");

-- CreateIndex
CREATE INDEX "student_yearly_achievement_snapshots_student_id_year_idx" ON "public"."student_yearly_achievement_snapshots"("student_id", "year");

-- CreateIndex
CREATE INDEX "student_yearly_achievement_snapshots_center_id_year_idx" ON "public"."student_yearly_achievement_snapshots"("center_id", "year");

-- CreateIndex
CREATE INDEX "student_yearly_achievement_snapshots_circle_id_year_idx" ON "public"."student_yearly_achievement_snapshots"("circle_id", "year");

-- CreateIndex
CREATE INDEX "student_yearly_achievement_snapshots_captured_by_id_idx" ON "public"."student_yearly_achievement_snapshots"("captured_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_yearly_achievement_snapshots_organization_id_student_id_year_key" ON "public"."student_yearly_achievement_snapshots"("organization_id", "student_id", "year");

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_deferred_by_id_fkey" FOREIGN KEY ("deferred_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_exam_attempt_id_fkey" FOREIGN KEY ("exam_attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_candidates" ADD CONSTRAINT "graduation_candidates_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."graduation_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_exam_attempt_id_fkey" FOREIGN KEY ("exam_attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."golden_records" ADD CONSTRAINT "golden_records_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_yearly_achievement_snapshots" ADD CONSTRAINT "student_yearly_achievement_snapshots_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_yearly_achievement_snapshots" ADD CONSTRAINT "student_yearly_achievement_snapshots_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_yearly_achievement_snapshots" ADD CONSTRAINT "student_yearly_achievement_snapshots_captured_by_id_fkey" FOREIGN KEY ("captured_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_yearly_achievement_snapshots" ADD CONSTRAINT "student_yearly_achievement_snapshots_golden_record_id_fkey" FOREIGN KEY ("golden_record_id") REFERENCES "public"."golden_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_yearly_achievement_snapshots" ADD CONSTRAINT "student_yearly_achievement_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_yearly_achievement_snapshots" ADD CONSTRAINT "student_yearly_achievement_snapshots_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
