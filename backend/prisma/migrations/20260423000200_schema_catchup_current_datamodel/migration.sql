-- CreateEnum
CREATE TYPE "public"."BookCategory" AS ENUM ('TAFSIR', 'FIQH', 'HADITH', 'MATN', 'SIRA', 'GENERAL');

-- CreateEnum
CREATE TYPE "public"."AttendanceSource" AS ENUM ('MANUAL', 'SELF_CHECK_IN', 'SYSTEM', 'IMPORT');

-- CreateEnum
CREATE TYPE "public"."StaffRoleType" AS ENUM ('TEACHER', 'SUPERVISOR', 'CENTER_ADMIN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LeaveType" AS ENUM ('MEDICAL', 'OFFICIAL', 'PERSONAL', 'UNPAID');

-- CreateEnum
CREATE TYPE "public"."LeaveRequestStatus" AS ENUM ('LEAVE_PENDING', 'LEAVE_APPROVED', 'LEAVE_REJECTED');

-- CreateEnum
CREATE TYPE "public"."ScheduleSourceType" AS ENUM ('CIRCLE_SYNC', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."VisitPlanStatus" AS ENUM ('VISIT_PLAN_DRAFT', 'VISIT_PLAN_ACTIVE', 'VISIT_PLAN_COMPLETED');

-- CreateEnum
CREATE TYPE "public"."VisitPlanItemStatus" AS ENUM ('VISIT_ITEM_PENDING', 'VISIT_ITEM_COMPLETED', 'VISIT_ITEM_MISSED');

-- CreateEnum
CREATE TYPE "public"."VisitPriority" AS ENUM ('NORMAL', 'LOW', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."DeductionTriggerType" AS ENUM ('UNEXCUSED_ABSENCE', 'LATE_THRESHOLD', 'EARLY_DEPARTURE', 'UNPAID_LEAVE', 'MISSED_VISIT');

-- CreateEnum
CREATE TYPE "public"."DeductionCalcType" AS ENUM ('FIXED', 'PER_DAY', 'PER_OCCURRENCE');

-- CreateEnum
CREATE TYPE "public"."DeductionEventStatus" AS ENUM ('DEDUCTION_PENDING', 'DEDUCTION_APPROVED', 'DEDUCTION_REJECTED', 'DEDUCTION_WAIVED');

-- CreateEnum
CREATE TYPE "public"."GeoState" AS ENUM ('INSIDE', 'OUTSIDE', 'NOT_SENT');

-- CreateEnum
CREATE TYPE "public"."GeoEnforcement" AS ENUM ('DISABLED', 'WARN_ONLY', 'STRICT');

-- CreateEnum
CREATE TYPE "public"."SupervisorNoteCategory" AS ENUM ('GENERAL', 'PRAISE', 'WARNING', 'VISIT', 'EVALUATION');

-- CreateEnum
CREATE TYPE "public"."SupervisorNoteStatus" AS ENUM ('PENDING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "public"."ExcuseRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."MonthlyPlanStatus" AS ENUM ('PENDING', 'APPROVED', 'MODIFIED');

-- CreateEnum
CREATE TYPE "public"."GroupActivityType" AS ENUM ('LECTURE', 'TAFSEER', 'SEERAH', 'FIQH', 'TAJWEED', 'HADITH', 'EDUCATIONAL');

-- AlterEnum
ALTER TYPE "public"."ActivityType" ADD VALUE 'FOLLOW_UP_RECORDED';

-- AlterEnum
ALTER TYPE "public"."AttendanceStatus" ADD VALUE 'ON_LEAVE';

-- AlterEnum
ALTER TYPE "public"."GoldenRecordSource" ADD VALUE 'EXAM_BASED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'EXAM_ATTEMPT_SCHEDULED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'EXAM_RESULT_SHARED';

-- DropForeignKey
ALTER TABLE "public"."exams" DROP CONSTRAINT "exams_center_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_invoiceId_fkey";

-- DropIndex
DROP INDEX "public"."exam_attempts_exam_id_student_id_key";

-- DropIndex
DROP INDEX "public"."library_items_type_idx";

-- DropIndex
DROP INDEX "public"."password_reset_tokens_expires_at_idx";

-- DropIndex
DROP INDEX "public"."refresh_tokens_expiresAt_idx";

-- DropIndex
DROP INDEX "public"."student_profiles_nationalId_key";

-- DropIndex
DROP INDEX "public"."teacher_profiles_employmentStatus_idx";

-- AlterTable
ALTER TABLE "public"."attendance_records" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."centers" DROP COLUMN "name_en",
ADD COLUMN     "allowed_radius_meters" INTEGER DEFAULT 500,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "longitude" DECIMAL(10,7),
ADD COLUMN     "mosque_name" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."circles" DROP COLUMN "name_en",
ADD COLUMN     "allowed_radius_meters" INTEGER,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "longitude" DECIMAL(10,7),
ADD COLUMN     "mosque_name" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."exam_attempt_breakdown" ALTER COLUMN "memorization_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "tajweed_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "performance_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "prompting_deductions" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "reminding_deductions" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "tajweed_deductions" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "theoretical_tajweed_score" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."exam_attempts" ADD COLUMN     "exam_date" DATE NOT NULL,
ADD COLUMN     "full_quran_completed_at" DATE,
ALTER COLUMN "total_score" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."exam_criteria" ALTER COLUMN "memorization_score" SET DEFAULT 0,
ALTER COLUMN "memorization_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "tajweed_score" SET DEFAULT 0,
ALTER COLUMN "tajweed_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "performance_score" SET DEFAULT 0,
ALTER COLUMN "performance_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "prompting_penalty" SET DEFAULT 0,
ALTER COLUMN "prompting_penalty" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "reminding_penalty" SET DEFAULT 0,
ALTER COLUMN "reminding_penalty" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "tajweed_penalty" SET DEFAULT 0,
ALTER COLUMN "tajweed_penalty" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "theoretical_tajweed_score" SET DEFAULT 0,
ALTER COLUMN "theoretical_tajweed_score" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."exam_nomination_requests" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."exams" ADD COLUMN     "exam_branch" VARCHAR(120),
ALTER COLUMN "center_id" DROP NOT NULL,
ALTER COLUMN "max_score" SET DEFAULT 100,
ALTER COLUMN "max_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "pass_score" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."follow_up_records" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."library_items" ADD COLUMN     "bookCategory" "public"."BookCategory",
ADD COLUMN     "cover_storage_key" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."student_profiles" DROP COLUMN "nationalId",
ADD COLUMN     "current_juzz" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."teacher_profiles" DROP COLUMN "employmentStatus";

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."staff_attendance_records" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "attendance_date" DATE NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL,
    "source" "public"."AttendanceSource" NOT NULL DEFAULT 'MANUAL',
    "staff_role" "public"."StaffRoleType" NOT NULL DEFAULT 'TEACHER',
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "late_minutes" INTEGER,
    "early_departure_minutes" INTEGER,
    "marked_by_id" INTEGER,
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_excuse_requests" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "absence_date" DATE NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "status" "public"."ExcuseRequestStatus" NOT NULL DEFAULT 'PENDING',
    "handled_by_id" INTEGER,
    "handled_at" TIMESTAMP(3),
    "response_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_excuse_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_policies" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "grace_period_minutes" INTEGER NOT NULL DEFAULT 15,
    "auto_absence_delay_minutes" INTEGER NOT NULL DEFAULT 60,
    "weekend_days" JSONB NOT NULL DEFAULT '["FRIDAY", "SATURDAY"]',
    "holidays" JSONB NOT NULL DEFAULT '[]',
    "geo_enforcement" "public"."GeoEnforcement" NOT NULL DEFAULT 'WARN_ONLY',
    "default_shift_duration_minutes" INTEGER NOT NULL DEFAULT 480,
    "early_departure_threshold_minutes" INTEGER NOT NULL DEFAULT 15,
    "prayer_api_source" VARCHAR(120) NOT NULL DEFAULT 'ALADHAN',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Riyadh',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_schedule_assignments" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "staff_role" "public"."StaffRoleType" NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "source_type" "public"."ScheduleSourceType" NOT NULL DEFAULT 'MANUAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_schedule_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_schedule_slots" (
    "id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "day_of_week" "public"."Weekday" NOT NULL,
    "mode" "public"."CircleScheduleMode" NOT NULL,
    "from_time" VARCHAR(5),
    "to_time" VARCHAR(5),
    "from_prayer" "public"."PrayerName",
    "to_prayer" "public"."PrayerName",
    "from_prayer_offset_minutes" INTEGER NOT NULL DEFAULT 0,
    "to_prayer_offset_minutes" INTEGER NOT NULL DEFAULT 0,
    "default_duration_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_schedule_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_leave_requests" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "leave_type" "public"."LeaveType" NOT NULL,
    "status" "public"."LeaveRequestStatus" NOT NULL DEFAULT 'LEAVE_PENDING',
    "total_days" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "attachment_url" VARCHAR(500),
    "handled_by_id" INTEGER,
    "handled_at" TIMESTAMP(3),
    "response_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supervisor_visit_plans" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "supervisor_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "public"."VisitPlanStatus" NOT NULL DEFAULT 'VISIT_PLAN_DRAFT',
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_visit_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supervisor_visit_plan_items" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "planned_date" DATE NOT NULL,
    "planned_time_window" VARCHAR(100),
    "priority" "public"."VisitPriority" NOT NULL DEFAULT 'NORMAL',
    "notes" VARCHAR(500),
    "status" "public"."VisitPlanItemStatus" NOT NULL DEFAULT 'VISIT_ITEM_PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_visit_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supervisor_visit_logs" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "supervisor_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "plan_item_id" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "start_latitude" DECIMAL(10,7),
    "start_longitude" DECIMAL(10,7),
    "end_latitude" DECIMAL(10,7),
    "end_longitude" DECIMAL(10,7),
    "start_distance_meters" INTEGER,
    "end_distance_meters" INTEGER,
    "start_geo_state" "public"."GeoState" NOT NULL DEFAULT 'NOT_SENT',
    "end_geo_state" "public"."GeoState" NOT NULL DEFAULT 'NOT_SENT',
    "checklist" JSONB,
    "rating" INTEGER,
    "observations" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_visit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_deduction_rules" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "trigger_type" "public"."DeductionTriggerType" NOT NULL,
    "threshold_count" INTEGER,
    "deduction_amount_sar" DECIMAL(10,2) NOT NULL,
    "deduction_type" "public"."DeductionCalcType" NOT NULL DEFAULT 'FIXED',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_deduction_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_deduction_events" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "rule_id" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "trigger_type" "public"."DeductionTriggerType" NOT NULL,
    "occurrence_count" INTEGER NOT NULL DEFAULT 1,
    "calculated_amount_sar" DECIMAL(10,2) NOT NULL,
    "status" "public"."DeductionEventStatus" NOT NULL DEFAULT 'DEDUCTION_PENDING',
    "details" JSONB,
    "reviewed_by_id" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "review_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_deduction_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prayer_time_cache" (
    "center_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "fajr" VARCHAR(5) NOT NULL,
    "dhuhr" VARCHAR(5) NOT NULL,
    "asr" VARCHAR(5) NOT NULL,
    "maghrib" VARCHAR(5) NOT NULL,
    "isha" VARCHAR(5) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prayer_time_cache_pkey" PRIMARY KEY ("center_id","date")
);

-- CreateTable
CREATE TABLE "public"."supervisor_notes" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "supervisor_id" INTEGER NOT NULL,
    "category" "public"."SupervisorNoteCategory" NOT NULL DEFAULT 'GENERAL',
    "status" "public"."SupervisorNoteStatus" NOT NULL DEFAULT 'PENDING',
    "target_label" VARCHAR(255),
    "content" TEXT NOT NULL,
    "scores" JSONB,
    "visit_checklist" JSONB,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_attempt_questions" (
    "id" SERIAL NOT NULL,
    "attempt_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "source" "public"."ExamQuestionSource" NOT NULL DEFAULT 'AUTO',
    "from_surah" INTEGER NOT NULL,
    "from_ayah" INTEGER NOT NULL,
    "to_surah" INTEGER NOT NULL,
    "to_ayah" INTEGER NOT NULL,
    "prompting_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reminding_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tajweed_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_evaluated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_attempt_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_grade_scales" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "min_percentage" DECIMAL(5,2) NOT NULL,
    "max_percentage" DECIMAL(5,2) NOT NULL,
    "color" VARCHAR(20),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_grade_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."monthly_plans" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "month" SMALLINT NOT NULL,
    "year" SMALLINT NOT NULL,
    "hifz_from_surah" INTEGER,
    "hifz_from_ayah" INTEGER,
    "hifz_to_surah" INTEGER,
    "hifz_to_ayah" INTEGER,
    "hifz_target_pages" DECIMAL(5,1),
    "hifz_daily_rate" DECIMAL(5,2),
    "review_from_surah" INTEGER,
    "review_from_ayah" INTEGER,
    "review_to_surah" INTEGER,
    "review_to_ayah" INTEGER,
    "review_target_pages" DECIMAL(5,1),
    "review_daily_rate" DECIMAL(5,2),
    "status" "public"."MonthlyPlanStatus" NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMP(3),
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_activities" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "activity_date" DATE NOT NULL,
    "activityType" "public"."GroupActivityType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_activity_participants" (
    "id" SERIAL NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_activity_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."review_plan_settings" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "teacher_id" INTEGER NOT NULL,
    "juz_threshold_5" DECIMAL(5,1) NOT NULL DEFAULT 10,
    "juz_threshold_10" DECIMAL(5,1) NOT NULL DEFAULT 15,
    "juz_threshold_20" DECIMAL(5,1) NOT NULL DEFAULT 20,
    "juz_threshold_30" DECIMAL(5,1) NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_plan_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_attendance_records_center_id_attendance_date_idx" ON "public"."staff_attendance_records"("center_id", "attendance_date");

-- CreateIndex
CREATE INDEX "staff_attendance_records_organization_id_attendance_date_idx" ON "public"."staff_attendance_records"("organization_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_records_user_id_attendance_date_key" ON "public"."staff_attendance_records"("user_id", "attendance_date");

-- CreateIndex
CREATE INDEX "staff_excuse_requests_center_id_status_idx" ON "public"."staff_excuse_requests"("center_id", "status");

-- CreateIndex
CREATE INDEX "staff_excuse_requests_user_id_absence_date_idx" ON "public"."staff_excuse_requests"("user_id", "absence_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_policies_organization_id_key" ON "public"."attendance_policies"("organization_id");

-- CreateIndex
CREATE INDEX "staff_schedule_assignments_organization_id_idx" ON "public"."staff_schedule_assignments"("organization_id");

-- CreateIndex
CREATE INDEX "staff_schedule_assignments_user_id_is_active_idx" ON "public"."staff_schedule_assignments"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "staff_schedule_assignments_center_id_idx" ON "public"."staff_schedule_assignments"("center_id");

-- CreateIndex
CREATE INDEX "staff_schedule_slots_assignment_id_idx" ON "public"."staff_schedule_slots"("assignment_id");

-- CreateIndex
CREATE INDEX "staff_leave_requests_organization_id_status_idx" ON "public"."staff_leave_requests"("organization_id", "status");

-- CreateIndex
CREATE INDEX "staff_leave_requests_user_id_start_date_idx" ON "public"."staff_leave_requests"("user_id", "start_date");

-- CreateIndex
CREATE INDEX "staff_leave_requests_center_id_idx" ON "public"."staff_leave_requests"("center_id");

-- CreateIndex
CREATE INDEX "supervisor_visit_plans_organization_id_idx" ON "public"."supervisor_visit_plans"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "supervisor_visit_plans_supervisor_id_center_id_month_year_key" ON "public"."supervisor_visit_plans"("supervisor_id", "center_id", "month", "year");

-- CreateIndex
CREATE INDEX "supervisor_visit_plan_items_plan_id_idx" ON "public"."supervisor_visit_plan_items"("plan_id");

-- CreateIndex
CREATE INDEX "supervisor_visit_plan_items_planned_date_idx" ON "public"."supervisor_visit_plan_items"("planned_date");

-- CreateIndex
CREATE INDEX "supervisor_visit_logs_organization_id_idx" ON "public"."supervisor_visit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "supervisor_visit_logs_supervisor_id_started_at_idx" ON "public"."supervisor_visit_logs"("supervisor_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "finance_deduction_rules_organization_id_trigger_type_key" ON "public"."finance_deduction_rules"("organization_id", "trigger_type");

-- CreateIndex
CREATE INDEX "finance_deduction_events_organization_id_month_year_idx" ON "public"."finance_deduction_events"("organization_id", "month", "year");

-- CreateIndex
CREATE INDEX "finance_deduction_events_user_id_idx" ON "public"."finance_deduction_events"("user_id");

-- CreateIndex
CREATE INDEX "supervisor_notes_organization_id_center_id_idx" ON "public"."supervisor_notes"("organization_id", "center_id");

-- CreateIndex
CREATE INDEX "supervisor_notes_circle_id_idx" ON "public"."supervisor_notes"("circle_id");

-- CreateIndex
CREATE INDEX "supervisor_notes_supervisor_id_idx" ON "public"."supervisor_notes"("supervisor_id");

-- CreateIndex
CREATE INDEX "supervisor_notes_category_idx" ON "public"."supervisor_notes"("category");

-- CreateIndex
CREATE INDEX "supervisor_notes_status_idx" ON "public"."supervisor_notes"("status");

-- CreateIndex
CREATE INDEX "exam_attempt_questions_attempt_id_source_idx" ON "public"."exam_attempt_questions"("attempt_id", "source");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempt_questions_attempt_id_order_index_key" ON "public"."exam_attempt_questions"("attempt_id", "order_index");

-- CreateIndex
CREATE INDEX "exam_grade_scales_organization_id_is_active_idx" ON "public"."exam_grade_scales"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "monthly_plans_circle_id_month_year_idx" ON "public"."monthly_plans"("circle_id", "month", "year");

-- CreateIndex
CREATE INDEX "monthly_plans_organization_id_center_id_month_year_idx" ON "public"."monthly_plans"("organization_id", "center_id", "month", "year");

-- CreateIndex
CREATE INDEX "monthly_plans_teacher_id_idx" ON "public"."monthly_plans"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_plans_student_id_circle_id_month_year_key" ON "public"."monthly_plans"("student_id", "circle_id", "month", "year");

-- CreateIndex
CREATE INDEX "group_activities_circle_id_activity_date_idx" ON "public"."group_activities"("circle_id", "activity_date");

-- CreateIndex
CREATE INDEX "group_activities_organization_id_center_id_activity_date_idx" ON "public"."group_activities"("organization_id", "center_id", "activity_date");

-- CreateIndex
CREATE INDEX "group_activities_teacher_id_idx" ON "public"."group_activities"("teacher_id");

-- CreateIndex
CREATE INDEX "group_activity_participants_student_id_idx" ON "public"."group_activity_participants"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_activity_participants_activity_id_student_id_key" ON "public"."group_activity_participants"("activity_id", "student_id");

-- CreateIndex
CREATE INDEX "review_plan_settings_teacher_id_idx" ON "public"."review_plan_settings"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_plan_settings_organization_id_teacher_id_circle_id_key" ON "public"."review_plan_settings"("organization_id", "teacher_id", "circle_id");

-- CreateIndex
CREATE INDEX "exam_attempts_exam_date_idx" ON "public"."exam_attempts"("exam_date");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempts_exam_id_student_id_exam_date_key" ON "public"."exam_attempts"("exam_id", "student_id", "exam_date");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_used_at_idx" ON "public"."password_reset_tokens"("user_id", "used_at");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_used_at_idx" ON "public"."password_reset_tokens"("expires_at", "used_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_revokedAt_idx" ON "public"."refresh_tokens"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_revokedAt_idx" ON "public"."refresh_tokens"("expiresAt", "revokedAt");

-- AddForeignKey
ALTER TABLE "public"."staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_marked_by_id_fkey" FOREIGN KEY ("marked_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_excuse_requests" ADD CONSTRAINT "staff_excuse_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_excuse_requests" ADD CONSTRAINT "staff_excuse_requests_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_excuse_requests" ADD CONSTRAINT "staff_excuse_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_excuse_requests" ADD CONSTRAINT "staff_excuse_requests_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_policies" ADD CONSTRAINT "attendance_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_schedule_assignments" ADD CONSTRAINT "staff_schedule_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_schedule_assignments" ADD CONSTRAINT "staff_schedule_assignments_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_schedule_assignments" ADD CONSTRAINT "staff_schedule_assignments_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_schedule_assignments" ADD CONSTRAINT "staff_schedule_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_schedule_slots" ADD CONSTRAINT "staff_schedule_slots_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."staff_schedule_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_leave_requests" ADD CONSTRAINT "staff_leave_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_leave_requests" ADD CONSTRAINT "staff_leave_requests_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_leave_requests" ADD CONSTRAINT "staff_leave_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_leave_requests" ADD CONSTRAINT "staff_leave_requests_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plans" ADD CONSTRAINT "supervisor_visit_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plans" ADD CONSTRAINT "supervisor_visit_plans_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plans" ADD CONSTRAINT "supervisor_visit_plans_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plans" ADD CONSTRAINT "supervisor_visit_plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plan_items" ADD CONSTRAINT "supervisor_visit_plan_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."supervisor_visit_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plan_items" ADD CONSTRAINT "supervisor_visit_plan_items_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_plan_items" ADD CONSTRAINT "supervisor_visit_plan_items_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_logs" ADD CONSTRAINT "supervisor_visit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_logs" ADD CONSTRAINT "supervisor_visit_logs_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_logs" ADD CONSTRAINT "supervisor_visit_logs_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_logs" ADD CONSTRAINT "supervisor_visit_logs_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_visit_logs" ADD CONSTRAINT "supervisor_visit_logs_plan_item_id_fkey" FOREIGN KEY ("plan_item_id") REFERENCES "public"."supervisor_visit_plan_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_deduction_rules" ADD CONSTRAINT "finance_deduction_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_deduction_events" ADD CONSTRAINT "finance_deduction_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_deduction_events" ADD CONSTRAINT "finance_deduction_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_deduction_events" ADD CONSTRAINT "finance_deduction_events_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_deduction_events" ADD CONSTRAINT "finance_deduction_events_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."finance_deduction_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_deduction_events" ADD CONSTRAINT "finance_deduction_events_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prayer_time_cache" ADD CONSTRAINT "prayer_time_cache_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_notes" ADD CONSTRAINT "supervisor_notes_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_notes" ADD CONSTRAINT "supervisor_notes_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_notes" ADD CONSTRAINT "supervisor_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supervisor_notes" ADD CONSTRAINT "supervisor_notes_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempt_questions" ADD CONSTRAINT "exam_attempt_questions_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_grade_scales" ADD CONSTRAINT "exam_grade_scales_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_plans" ADD CONSTRAINT "monthly_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_plans" ADD CONSTRAINT "monthly_plans_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_plans" ADD CONSTRAINT "monthly_plans_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_plans" ADD CONSTRAINT "monthly_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_plans" ADD CONSTRAINT "monthly_plans_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_activities" ADD CONSTRAINT "group_activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_activities" ADD CONSTRAINT "group_activities_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_activities" ADD CONSTRAINT "group_activities_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_activities" ADD CONSTRAINT "group_activities_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_activity_participants" ADD CONSTRAINT "group_activity_participants_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."group_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_activity_participants" ADD CONSTRAINT "group_activity_participants_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_plan_settings" ADD CONSTRAINT "review_plan_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_plan_settings" ADD CONSTRAINT "review_plan_settings_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_plan_settings" ADD CONSTRAINT "review_plan_settings_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."remote_recitation_bookings_organization_id_status_requested_at_" RENAME TO "remote_recitation_bookings_organization_id_status_requested_idx";

-- RenameIndex
ALTER INDEX "public"."student_yearly_achievement_snapshots_organization_id_student_id" RENAME TO "student_yearly_achievement_snapshots_organization_id_studen_key";

-- RenameIndex
ALTER INDEX "public"."student_yearly_achievement_snapshots_organization_id_year_achie" RENAME TO "student_yearly_achievement_snapshots_organization_id_year_a_idx";

-- RenameIndex
ALTER INDEX "public"."student_yearly_achievement_snapshots_organization_id_year_cente" RENAME TO "student_yearly_achievement_snapshots_organization_id_year_c_idx";

