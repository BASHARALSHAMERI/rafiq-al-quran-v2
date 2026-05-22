DO $$
BEGIN
  CREATE TYPE "public"."ParentProfileRelationType" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "public"."KhatmType" AS ENUM ('HAFIZ', 'KHATIM', 'MUJAZ');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "public"."RiwayaType" AS ENUM ('HAFS', 'WARSH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "public"."EmploymentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRANSFERRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "public"."SupervisorProfileStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "public"."StudentLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "public"."StudentProfileStatus" AS ENUM ('REGULAR', 'DROPPED', 'GRADUATED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "public"."users"
  ADD COLUMN IF NOT EXISTS "createdByUserId" INTEGER,
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "username" VARCHAR(80);

ALTER TABLE "public"."parent_student_links"
  ADD COLUMN IF NOT EXISTS "createdByUserId" INTEGER;

CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
  "userId" INTEGER NOT NULL,
  "fullName" VARCHAR(160) NOT NULL,
  "gender" "public"."Gender",
  "birthDate" DATE,
  "phone" VARCHAR(32),
  "address" VARCHAR(255),
  "avatarUrl" VARCHAR(500),
  "createdByUserId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "public"."teacher_profiles" (
  "userId" INTEGER NOT NULL,
  "hireDate" DATE,
  "khatmType" "public"."KhatmType",
  "riwaya" "public"."RiwayaType",
  "educationLevel" VARCHAR(120),
  "yearsExperience" INTEGER,
  "employmentStatus" "public"."EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByUserId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "public"."supervisor_profiles" (
  "userId" INTEGER NOT NULL,
  "assignedAt" DATE,
  "status" "public"."SupervisorProfileStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByUserId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "supervisor_profiles_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "public"."center_admin_profiles" (
  "userId" INTEGER NOT NULL,
  "assignedAt" DATE,
  "employmentStatus" "public"."EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByUserId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "center_admin_profiles_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "public"."student_profiles" (
  "userId" INTEGER NOT NULL,
  "nickname" VARCHAR(80),
  "nationalId" VARCHAR(50),
  "level" "public"."StudentLevel" NOT NULL DEFAULT 'BEGINNER',
  "studentStatus" "public"."StudentProfileStatus" NOT NULL DEFAULT 'REGULAR',
  "joinDate" DATE,
  "createdByUserId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "public"."parent_profiles" (
  "userId" INTEGER NOT NULL,
  "relationType" "public"."ParentProfileRelationType",
  "createdByUserId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "public"."centers"
  ALTER COLUMN "gender" SET DEFAULT 'MALE';

ALTER TABLE "public"."circles"
  ALTER COLUMN "gender" SET DEFAULT 'MALE',
  ALTER COLUMN "circle_type" SET DEFAULT 'HIFZ';

ALTER TABLE "public"."user_profiles"
  ALTER COLUMN "gender" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_phone_key" ON "public"."user_profiles"("phone");
CREATE INDEX IF NOT EXISTS "user_profiles_fullName_idx" ON "public"."user_profiles"("fullName");
CREATE INDEX IF NOT EXISTS "user_profiles_createdByUserId_idx" ON "public"."user_profiles"("createdByUserId");

CREATE INDEX IF NOT EXISTS "teacher_profiles_employmentStatus_idx" ON "public"."teacher_profiles"("employmentStatus");
CREATE INDEX IF NOT EXISTS "teacher_profiles_createdByUserId_idx" ON "public"."teacher_profiles"("createdByUserId");

CREATE INDEX IF NOT EXISTS "supervisor_profiles_status_idx" ON "public"."supervisor_profiles"("status");
CREATE INDEX IF NOT EXISTS "supervisor_profiles_createdByUserId_idx" ON "public"."supervisor_profiles"("createdByUserId");

CREATE INDEX IF NOT EXISTS "center_admin_profiles_employmentStatus_idx" ON "public"."center_admin_profiles"("employmentStatus");
CREATE INDEX IF NOT EXISTS "center_admin_profiles_createdByUserId_idx" ON "public"."center_admin_profiles"("createdByUserId");

CREATE UNIQUE INDEX IF NOT EXISTS "student_profiles_nationalId_key" ON "public"."student_profiles"("nationalId");
CREATE INDEX IF NOT EXISTS "student_profiles_level_idx" ON "public"."student_profiles"("level");
CREATE INDEX IF NOT EXISTS "student_profiles_studentStatus_idx" ON "public"."student_profiles"("studentStatus");
CREATE INDEX IF NOT EXISTS "student_profiles_createdByUserId_idx" ON "public"."student_profiles"("createdByUserId");

CREATE INDEX IF NOT EXISTS "parent_profiles_relationType_idx" ON "public"."parent_profiles"("relationType");
CREATE INDEX IF NOT EXISTS "parent_profiles_createdByUserId_idx" ON "public"."parent_profiles"("createdByUserId");

CREATE INDEX IF NOT EXISTS "parent_student_links_createdByUserId_idx" ON "public"."parent_student_links"("createdByUserId");
CREATE INDEX IF NOT EXISTS "student_circle_enrollments_studentId_status_idx" ON "public"."student_circle_enrollments"("studentId", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "public"."users"("username");
CREATE INDEX IF NOT EXISTS "users_createdByUserId_idx" ON "public"."users"("createdByUserId");
CREATE INDEX IF NOT EXISTS "users_lastLoginAt_idx" ON "public"."users"("lastLoginAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "public"."users"
      ADD CONSTRAINT "users_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_userId_fkey'
  ) THEN
    ALTER TABLE "public"."user_profiles"
      ADD CONSTRAINT "user_profiles_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "public"."user_profiles"
      ADD CONSTRAINT "user_profiles_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teacher_profiles_userId_fkey'
  ) THEN
    ALTER TABLE "public"."teacher_profiles"
      ADD CONSTRAINT "teacher_profiles_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teacher_profiles_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "public"."teacher_profiles"
      ADD CONSTRAINT "teacher_profiles_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supervisor_profiles_userId_fkey'
  ) THEN
    ALTER TABLE "public"."supervisor_profiles"
      ADD CONSTRAINT "supervisor_profiles_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supervisor_profiles_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "public"."supervisor_profiles"
      ADD CONSTRAINT "supervisor_profiles_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'center_admin_profiles_userId_fkey'
  ) THEN
    ALTER TABLE "public"."center_admin_profiles"
      ADD CONSTRAINT "center_admin_profiles_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'center_admin_profiles_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "public"."center_admin_profiles"
      ADD CONSTRAINT "center_admin_profiles_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_profiles_userId_fkey'
  ) THEN
    ALTER TABLE "public"."student_profiles"
      ADD CONSTRAINT "student_profiles_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_profiles_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "public"."student_profiles"
      ADD CONSTRAINT "student_profiles_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parent_profiles_userId_fkey'
  ) THEN
    ALTER TABLE "public"."parent_profiles"
      ADD CONSTRAINT "parent_profiles_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parent_profiles_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "public"."parent_profiles"
      ADD CONSTRAINT "parent_profiles_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parent_student_links_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "public"."parent_student_links"
      ADD CONSTRAINT "parent_student_links_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
