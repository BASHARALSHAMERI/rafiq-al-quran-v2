-- CreateEnum: SalarySource
CREATE TYPE "SalarySource" AS ENUM ('GRADE', 'OVERRIDE');

-- CreateEnum: StaffAssignmentType
CREATE TYPE "StaffAssignmentType" AS ENUM ('CENTER_ADMIN', 'CENTER_SUPERVISOR', 'CIRCLE_TEACHER', 'CIRCLE_SUPERVISOR');

-- AlterTable: SupervisorProfile — add professional fields
ALTER TABLE "supervisor_profiles" ADD COLUMN "education_level" VARCHAR(120);
ALTER TABLE "supervisor_profiles" ADD COLUMN "years_experience" INTEGER;
ALTER TABLE "supervisor_profiles" ADD COLUMN "quran_qualification" "KhatmType";
ALTER TABLE "supervisor_profiles" ADD COLUMN "professional_notes" VARCHAR(500);

-- AlterTable: CenterAdminProfile — add professional fields
ALTER TABLE "center_admin_profiles" ADD COLUMN "education_level" VARCHAR(120);
ALTER TABLE "center_admin_profiles" ADD COLUMN "years_experience" INTEGER;
ALTER TABLE "center_admin_profiles" ADD COLUMN "administrative_experience_years" INTEGER;
ALTER TABLE "center_admin_profiles" ADD COLUMN "professional_notes" VARCHAR(500);

-- AlterTable: PayrollProfile — add salary source, override, approval fields
ALTER TABLE "payroll_profiles" ADD COLUMN "salary_source" "SalarySource" NOT NULL DEFAULT 'GRADE';
ALTER TABLE "payroll_profiles" ADD COLUMN "override_reason" VARCHAR(500);
ALTER TABLE "payroll_profiles" ADD COLUMN "approved_by_id" INTEGER;
ALTER TABLE "payroll_profiles" ADD COLUMN "approved_at" TIMESTAMP(3);

-- CreateTable: StaffAssignment
CREATE TABLE "staff_assignments" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "assignment_type" "StaffAssignmentType" NOT NULL,
    "center_id" INTEGER,
    "circle_id" INTEGER,
    "effective_from" DATE NOT NULL DEFAULT CURRENT_DATE,
    "effective_to" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "end_reason" VARCHAR(500),
    "notes" VARCHAR(500),
    "created_by_id" INTEGER,
    "ended_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_assignments_organization_id_user_id_is_active_idx" ON "staff_assignments"("organization_id", "user_id", "is_active");
CREATE INDEX "staff_assignments_center_id_assignment_type_is_active_idx" ON "staff_assignments"("center_id", "assignment_type", "is_active");
CREATE INDEX "staff_assignments_circle_id_assignment_type_is_active_idx" ON "staff_assignments"("circle_id", "assignment_type", "is_active");
CREATE INDEX "staff_assignments_user_id_assignment_type_is_active_idx" ON "staff_assignments"("user_id", "assignment_type", "is_active");

-- AddForeignKey
ALTER TABLE "payroll_profiles" ADD CONSTRAINT "payroll_profiles_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_ended_by_id_fkey" FOREIGN KEY ("ended_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
