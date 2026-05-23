-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPER_ADMIN', 'CENTER_ADMIN', 'SUPERVISOR', 'TEACHER', 'PARENT', 'STUDENT');

-- CreateEnum
CREATE TYPE "public"."EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "public"."ParentRelationType" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('LOGIN', 'REFRESH_TOKEN', 'LOGOUT', 'ATTENDANCE_MARKED', 'ATTENDANCE_UPDATED', 'STUDENT_ENROLLED', 'USER_CREATED', 'GENERIC');

-- CreateEnum
CREATE TYPE "public"."ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ExamType" AS ENUM ('JUZ', 'FULL_QURAN', 'SURAH_RANGE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AttemptStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "public"."LibraryVisibility" AS ENUM ('ORG', 'CENTER', 'CIRCLE');

-- CreateEnum
CREATE TYPE "public"."LibraryItemStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."TuitionAssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'TRANSFER');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('ATTENDANCE', 'FOLLOW_UP', 'EXAMS', 'FINANCE');

-- CreateEnum
CREATE TYPE "public"."ReportRunStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ReportFileKind" AS ENUM ('PDF', 'XLSX');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('EXAM_PUBLISHED', 'EXAM_SCORED', 'LIBRARY_UPLOADED', 'INVOICE_ISSUED', 'PAYMENT_RECORDED', 'REPORT_EXPORTED');

-- CreateEnum
CREATE TYPE "public"."AuditEntityType" AS ENUM ('USER', 'CENTER', 'CIRCLE', 'EXAM', 'EXAM_ATTEMPT', 'LIBRARY_ITEM', 'INVOICE', 'PAYMENT', 'REPORT_EXPORT', 'SETTINGS');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'ARCHIVE', 'DOWNLOAD', 'EXPORT', 'SCORE', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."centers" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."circles" (
    "id" SERIAL NOT NULL,
    "centerId" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "teacherId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "role" "public"."Role" NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_center_accesses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "centerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_center_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_circle_accesses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "circleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_circle_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_circle_enrollments" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "circleId" INTEGER NOT NULL,
    "status" "public"."EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "student_circle_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parent_student_links" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "relationType" "public"."ParentRelationType" NOT NULL DEFAULT 'GUARDIAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_student_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_records" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "circleId" INTEGER NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL,
    "markedById" INTEGER NOT NULL,
    "note" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "userAgent" VARCHAR(255),
    "ipAddress" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "userId" INTEGER,
    "centerId" INTEGER,
    "circleId" INTEGER,
    "activityType" "public"."ActivityType" NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" INTEGER,
    "message" VARCHAR(255) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exams" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "circle_id" INTEGER,
    "title" VARCHAR(160) NOT NULL,
    "type" "public"."ExamType" NOT NULL,
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "pass_score" INTEGER NOT NULL,
    "status" "public"."ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_criteria" (
    "id" SERIAL NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "memorization_score" INTEGER NOT NULL DEFAULT 0,
    "tajweed_score" INTEGER NOT NULL DEFAULT 0,
    "performance_score" INTEGER NOT NULL DEFAULT 0,
    "prompting_penalty" INTEGER NOT NULL DEFAULT 0,
    "reminding_penalty" INTEGER NOT NULL DEFAULT 0,
    "tajweed_penalty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "exam_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_attempts" (
    "id" SERIAL NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "committee_notes" TEXT,
    "total_score" INTEGER,
    "grade_label" VARCHAR(40),
    "status" "public"."AttemptStatus" NOT NULL DEFAULT 'SCHEDULED',
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "evaluated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_attempt_breakdown" (
    "id" SERIAL NOT NULL,
    "attempt_id" INTEGER NOT NULL,
    "memorization_score" INTEGER,
    "tajweed_score" INTEGER,
    "performance_score" INTEGER,
    "prompting_deductions" INTEGER,
    "reminding_deductions" INTEGER,
    "tajweed_deductions" INTEGER,

    CONSTRAINT "exam_attempt_breakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tuition_plans" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "monthlyAmount" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tuition_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_tuition_assignments" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "tuitionPlanId" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "status" "public"."TuitionAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "student_tuition_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "centerId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "public"."PaymentMethod" NOT NULL DEFAULT 'CASH',
    "receivedById" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_files" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "circleId" INTEGER,
    "name" VARCHAR(180) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" VARCHAR(255) NOT NULL,
    "kind" "public"."ReportFileKind" NOT NULL,
    "createdById" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_runs" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "circleId" INTEGER,
    "reportType" "public"."ReportType" NOT NULL,
    "status" "public"."ReportRunStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" INTEGER NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "filters" JSONB NOT NULL,
    "summary" JSONB,
    "errorMessage" VARCHAR(500),
    "outputFileId" INTEGER,

    CONSTRAINT "report_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "circleId" INTEGER,
    "type" "public"."NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "payload" JSONB NOT NULL,
    "recipientUserId" INTEGER NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "circleId" INTEGER,
    "actorUserId" INTEGER,
    "actorRole" VARCHAR(40) NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "entityType" "public"."AuditEntityType" NOT NULL,
    "entityId" INTEGER NOT NULL,
    "summary" VARCHAR(255) NOT NULL,
    "metadata" JSONB NOT NULL,
    "ip" VARCHAR(64),
    "userAgent" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."library_categories" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."library_items" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "center_id" INTEGER,
    "circle_id" INTEGER,
    "category_id" INTEGER,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "visibility" "public"."LibraryVisibility" NOT NULL,
    "status" "public"."LibraryItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "public"."organizations"("code");

-- CreateIndex
CREATE INDEX "centers_organizationId_idx" ON "public"."centers"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "centers_organizationId_code_key" ON "public"."centers"("organizationId", "code");

-- CreateIndex
CREATE INDEX "circles_centerId_idx" ON "public"."circles"("centerId");

-- CreateIndex
CREATE INDEX "circles_teacherId_idx" ON "public"."circles"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "circles_centerId_name_key" ON "public"."circles"("centerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "public"."users"("organizationId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "public"."users"("isActive");

-- CreateIndex
CREATE INDEX "user_center_accesses_centerId_idx" ON "public"."user_center_accesses"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "user_center_accesses_userId_centerId_key" ON "public"."user_center_accesses"("userId", "centerId");

-- CreateIndex
CREATE INDEX "user_circle_accesses_circleId_idx" ON "public"."user_circle_accesses"("circleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_circle_accesses_userId_circleId_key" ON "public"."user_circle_accesses"("userId", "circleId");

-- CreateIndex
CREATE INDEX "student_circle_enrollments_circleId_idx" ON "public"."student_circle_enrollments"("circleId");

-- CreateIndex
CREATE INDEX "student_circle_enrollments_status_idx" ON "public"."student_circle_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_circle_enrollments_studentId_circleId_key" ON "public"."student_circle_enrollments"("studentId", "circleId");

-- CreateIndex
CREATE INDEX "parent_student_links_studentId_idx" ON "public"."parent_student_links"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "parent_student_links_parentId_studentId_key" ON "public"."parent_student_links"("parentId", "studentId");

-- CreateIndex
CREATE INDEX "attendance_records_circleId_attendanceDate_idx" ON "public"."attendance_records"("circleId", "attendanceDate");

-- CreateIndex
CREATE INDEX "attendance_records_studentId_attendanceDate_idx" ON "public"."attendance_records"("studentId", "attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_studentId_circleId_attendanceDate_key" ON "public"."attendance_records"("studentId", "circleId", "attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "public"."refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "public"."refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "public"."refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "activity_logs_organizationId_createdAt_idx" ON "public"."activity_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_centerId_createdAt_idx" ON "public"."activity_logs"("centerId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_circleId_createdAt_idx" ON "public"."activity_logs"("circleId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_createdAt_idx" ON "public"."activity_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "exams_organization_id_center_id_status_idx" ON "public"."exams"("organization_id", "center_id", "status");

-- CreateIndex
CREATE INDEX "exams_circle_id_idx" ON "public"."exams"("circle_id");

-- CreateIndex
CREATE INDEX "exams_scheduled_at_idx" ON "public"."exams"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "exam_criteria_exam_id_key" ON "public"."exam_criteria"("exam_id");

-- CreateIndex
CREATE INDEX "exam_attempts_exam_id_status_idx" ON "public"."exam_attempts"("exam_id", "status");

-- CreateIndex
CREATE INDEX "exam_attempts_circle_id_idx" ON "public"."exam_attempts"("circle_id");

-- CreateIndex
CREATE INDEX "exam_attempts_student_id_status_idx" ON "public"."exam_attempts"("student_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempts_exam_id_student_id_key" ON "public"."exam_attempts"("exam_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempt_breakdown_attempt_id_key" ON "public"."exam_attempt_breakdown"("attempt_id");

-- CreateIndex
CREATE INDEX "tuition_plans_organizationId_idx" ON "public"."tuition_plans"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "tuition_plans_centerId_name_key" ON "public"."tuition_plans"("centerId", "name");

-- CreateIndex
CREATE INDEX "student_tuition_assignments_tuitionPlanId_idx" ON "public"."student_tuition_assignments"("tuitionPlanId");

-- CreateIndex
CREATE INDEX "student_tuition_assignments_status_idx" ON "public"."student_tuition_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_tuition_assignments_studentId_tuitionPlanId_key" ON "public"."student_tuition_assignments"("studentId", "tuitionPlanId");

-- CreateIndex
CREATE INDEX "invoices_centerId_year_month_idx" ON "public"."invoices"("centerId", "year", "month");

-- CreateIndex
CREATE INDEX "invoices_studentId_idx" ON "public"."invoices"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_studentId_month_year_key" ON "public"."invoices"("studentId", "month", "year");

-- CreateIndex
CREATE INDEX "payments_invoiceId_receivedAt_idx" ON "public"."payments"("invoiceId", "receivedAt");

-- CreateIndex
CREATE INDEX "payments_receivedById_idx" ON "public"."payments"("receivedById");

-- CreateIndex
CREATE INDEX "report_files_organizationId_createdAt_idx" ON "public"."report_files"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "report_files_createdById_createdAt_idx" ON "public"."report_files"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "report_files_expiresAt_idx" ON "public"."report_files"("expiresAt");

-- CreateIndex
CREATE INDEX "report_runs_organizationId_requestedAt_idx" ON "public"."report_runs"("organizationId", "requestedAt");

-- CreateIndex
CREATE INDEX "report_runs_requestedById_requestedAt_idx" ON "public"."report_runs"("requestedById", "requestedAt");

-- CreateIndex
CREATE INDEX "report_runs_reportType_requestedAt_idx" ON "public"."report_runs"("reportType", "requestedAt");

-- CreateIndex
CREATE INDEX "report_runs_status_requestedAt_idx" ON "public"."report_runs"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_isRead_createdAt_idx" ON "public"."notifications"("recipientUserId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_organizationId_createdAt_idx" ON "public"."notifications"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "public"."audit_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_centerId_createdAt_idx" ON "public"."audit_logs"("centerId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_circleId_createdAt_idx" ON "public"."audit_logs"("circleId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "public"."audit_logs"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "public"."audit_logs"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "public"."audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "library_categories_organization_id_idx" ON "public"."library_categories"("organization_id");

-- CreateIndex
CREATE INDEX "library_categories_center_id_idx" ON "public"."library_categories"("center_id");

-- CreateIndex
CREATE UNIQUE INDEX "library_categories_organization_id_code_key" ON "public"."library_categories"("organization_id", "code");

-- CreateIndex
CREATE INDEX "library_items_organization_id_created_at_idx" ON "public"."library_items"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "library_items_center_id_idx" ON "public"."library_items"("center_id");

-- CreateIndex
CREATE INDEX "library_items_circle_id_idx" ON "public"."library_items"("circle_id");

-- CreateIndex
CREATE INDEX "library_items_category_id_idx" ON "public"."library_items"("category_id");

-- CreateIndex
CREATE INDEX "library_items_status_idx" ON "public"."library_items"("status");

-- CreateIndex
CREATE INDEX "library_items_visibility_idx" ON "public"."library_items"("visibility");

-- AddForeignKey
ALTER TABLE "public"."centers" ADD CONSTRAINT "centers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."circles" ADD CONSTRAINT "circles_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."circles" ADD CONSTRAINT "circles_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_center_accesses" ADD CONSTRAINT "user_center_accesses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_center_accesses" ADD CONSTRAINT "user_center_accesses_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_circle_accesses" ADD CONSTRAINT "user_circle_accesses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_circle_accesses" ADD CONSTRAINT "user_circle_accesses_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_circle_enrollments" ADD CONSTRAINT "student_circle_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_circle_enrollments" ADD CONSTRAINT "student_circle_enrollments_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parent_student_links" ADD CONSTRAINT "parent_student_links_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parent_student_links" ADD CONSTRAINT "parent_student_links_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_criteria" ADD CONSTRAINT "exam_criteria_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempts" ADD CONSTRAINT "exam_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempts" ADD CONSTRAINT "exam_attempts_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempts" ADD CONSTRAINT "exam_attempts_evaluated_by_id_fkey" FOREIGN KEY ("evaluated_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_attempt_breakdown" ADD CONSTRAINT "exam_attempt_breakdown_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tuition_plans" ADD CONSTRAINT "tuition_plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tuition_plans" ADD CONSTRAINT "tuition_plans_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_tuition_assignments" ADD CONSTRAINT "student_tuition_assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_tuition_assignments" ADD CONSTRAINT "student_tuition_assignments_tuitionPlanId_fkey" FOREIGN KEY ("tuitionPlanId") REFERENCES "public"."tuition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_files" ADD CONSTRAINT "report_files_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_files" ADD CONSTRAINT "report_files_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_files" ADD CONSTRAINT "report_files_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_files" ADD CONSTRAINT "report_files_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_runs" ADD CONSTRAINT "report_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_runs" ADD CONSTRAINT "report_runs_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_runs" ADD CONSTRAINT "report_runs_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_runs" ADD CONSTRAINT "report_runs_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_runs" ADD CONSTRAINT "report_runs_outputFileId_fkey" FOREIGN KEY ("outputFileId") REFERENCES "public"."report_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_categories" ADD CONSTRAINT "library_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_categories" ADD CONSTRAINT "library_categories_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_items" ADD CONSTRAINT "library_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_items" ADD CONSTRAINT "library_items_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_items" ADD CONSTRAINT "library_items_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_items" ADD CONSTRAINT "library_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."library_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_items" ADD CONSTRAINT "library_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
