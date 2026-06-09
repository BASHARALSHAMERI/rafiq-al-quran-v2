-- Fix: Previous migration used snake_case column names but this project uses camelCase.

-- ===== supervisor_profiles: rename columns =====
ALTER TABLE "supervisor_profiles" RENAME COLUMN "education_level" TO "educationLevel";
ALTER TABLE "supervisor_profiles" RENAME COLUMN "years_experience" TO "yearsExperience";
ALTER TABLE "supervisor_profiles" RENAME COLUMN "quran_qualification" TO "quranQualification";
ALTER TABLE "supervisor_profiles" RENAME COLUMN "professional_notes" TO "professionalNotes";

-- ===== center_admin_profiles: rename columns =====
ALTER TABLE "center_admin_profiles" RENAME COLUMN "education_level" TO "educationLevel";
ALTER TABLE "center_admin_profiles" RENAME COLUMN "years_experience" TO "yearsExperience";
ALTER TABLE "center_admin_profiles" RENAME COLUMN "administrative_experience_years" TO "administrativeExperienceYears";
ALTER TABLE "center_admin_profiles" RENAME COLUMN "professional_notes" TO "professionalNotes";

-- ===== payroll_profiles: rename columns and fix FK =====
ALTER TABLE "payroll_profiles" DROP CONSTRAINT IF EXISTS "payroll_profiles_approved_by_id_fkey";
ALTER TABLE "payroll_profiles" RENAME COLUMN "salary_source" TO "salarySource";
ALTER TABLE "payroll_profiles" RENAME COLUMN "override_reason" TO "overrideReason";
ALTER TABLE "payroll_profiles" RENAME COLUMN "approved_by_id" TO "approvedById";
ALTER TABLE "payroll_profiles" RENAME COLUMN "approved_at" TO "approvedAt";
ALTER TABLE "payroll_profiles" ADD CONSTRAINT "payroll_profiles_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ===== staff_assignments: drop and recreate with camelCase columns =====
DROP TABLE IF EXISTS "staff_assignments" CASCADE;

CREATE TABLE "staff_assignments" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignmentType" "StaffAssignmentType" NOT NULL,
    "centerId" INTEGER,
    "circleId" INTEGER,
    "effectiveFrom" DATE NOT NULL DEFAULT CURRENT_DATE,
    "effectiveTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "endReason" VARCHAR(500),
    "notes" VARCHAR(500),
    "createdById" INTEGER,
    "endedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_assignments_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "staff_assignments_organizationId_userId_isActive_idx" ON "staff_assignments"("organizationId", "userId", "isActive");
CREATE INDEX "staff_assignments_centerId_assignmentType_isActive_idx" ON "staff_assignments"("centerId", "assignmentType", "isActive");
CREATE INDEX "staff_assignments_circleId_assignmentType_isActive_idx" ON "staff_assignments"("circleId", "assignmentType", "isActive");
CREATE INDEX "staff_assignments_userId_assignmentType_isActive_idx" ON "staff_assignments"("userId", "assignmentType", "isActive");

-- Foreign Keys
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_endedById_fkey" FOREIGN KEY ("endedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
