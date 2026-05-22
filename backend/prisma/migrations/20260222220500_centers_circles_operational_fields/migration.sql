-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "public"."CircleType" AS ENUM ('HIFZ', 'REVIEW', 'HIFZ_REVIEW');

-- Rename center/circle display columns to explicit Arabic names
ALTER TABLE "public"."centers" RENAME COLUMN "name" TO "name_ar";
ALTER TABLE "public"."circles" RENAME COLUMN "name" TO "name_ar";
ALTER TABLE "public"."circles" RENAME COLUMN "teacherId" TO "primary_teacher_user_id";

-- Centers metadata
ALTER TABLE "public"."centers"
  ADD COLUMN "name_en" VARCHAR(120),
  ADD COLUMN "gender" "public"."Gender",
  ADD COLUMN "location_text" VARCHAR(255),
  ADD COLUMN "center_admin_user_id" INTEGER;

UPDATE "public"."centers"
SET "gender" = CASE
  WHEN "name_ar" ILIKE '%هدى%' THEN 'FEMALE'::"public"."Gender"
  ELSE 'MALE'::"public"."Gender"
END
WHERE "gender" IS NULL;

UPDATE "public"."centers" c
SET "center_admin_user_id" = COALESCE(
  (
    SELECT uca."userId"
    FROM "public"."user_center_accesses" uca
    JOIN "public"."users" u ON u."id" = uca."userId"
    WHERE uca."centerId" = c."id"
      AND u."organizationId" = c."organizationId"
      AND u."role" = 'CENTER_ADMIN'
      AND u."isActive" = true
    ORDER BY u."id" ASC
    LIMIT 1
  ),
  (
    SELECT u."id"
    FROM "public"."users" u
    WHERE u."organizationId" = c."organizationId"
      AND u."role" = 'CENTER_ADMIN'
      AND u."isActive" = true
    ORDER BY u."id" ASC
    LIMIT 1
  )
)
WHERE "center_admin_user_id" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "public"."centers"
    WHERE "center_admin_user_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Migration failed: one or more centers could not be assigned center_admin_user_id';
  END IF;
END $$;

ALTER TABLE "public"."centers"
  ALTER COLUMN "gender" SET DEFAULT 'MALE',
  ALTER COLUMN "gender" SET NOT NULL,
  ALTER COLUMN "center_admin_user_id" SET NOT NULL;

ALTER TABLE "public"."centers"
  ADD CONSTRAINT "centers_center_admin_user_id_fkey"
  FOREIGN KEY ("center_admin_user_id") REFERENCES "public"."users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "centers_center_admin_user_id_idx" ON "public"."centers"("center_admin_user_id");

-- Circle metadata
ALTER TABLE "public"."circles"
  ADD COLUMN "name_en" VARCHAR(120),
  ADD COLUMN "gender" "public"."Gender",
  ADD COLUMN "circle_type" "public"."CircleType",
  ADD COLUMN "location_text" VARCHAR(255);

UPDATE "public"."circles" ci
SET "gender" = c."gender"
FROM "public"."centers" c
WHERE c."id" = ci."centerId"
  AND ci."gender" IS NULL;

UPDATE "public"."circles"
SET "circle_type" = 'HIFZ'::"public"."CircleType"
WHERE "circle_type" IS NULL;

UPDATE "public"."circles" ci
SET "primary_teacher_user_id" = COALESCE(
  ci."primary_teacher_user_id",
  (
    SELECT uca."userId"
    FROM "public"."user_center_accesses" uca
    JOIN "public"."users" u ON u."id" = uca."userId"
    WHERE uca."centerId" = ci."centerId"
      AND u."role" = 'TEACHER'
      AND u."isActive" = true
    ORDER BY u."id" ASC
    LIMIT 1
  ),
  (
    SELECT u."id"
    FROM "public"."users" u
    JOIN "public"."centers" c ON c."id" = ci."centerId"
    WHERE u."organizationId" = c."organizationId"
      AND u."role" = 'TEACHER'
      AND u."isActive" = true
    ORDER BY u."id" ASC
    LIMIT 1
  )
)
WHERE ci."primary_teacher_user_id" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "public"."circles"
    WHERE "gender" IS NULL
       OR "circle_type" IS NULL
       OR "primary_teacher_user_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Migration failed: one or more circles could not be backfilled (gender/circle_type/primary_teacher_user_id)';
  END IF;
END $$;

ALTER TABLE "public"."circles" DROP CONSTRAINT IF EXISTS "circles_teacherId_fkey";

ALTER TABLE "public"."circles"
  ALTER COLUMN "gender" SET DEFAULT 'MALE',
  ALTER COLUMN "gender" SET NOT NULL,
  ALTER COLUMN "circle_type" SET DEFAULT 'HIFZ',
  ALTER COLUMN "circle_type" SET NOT NULL,
  ALTER COLUMN "primary_teacher_user_id" SET NOT NULL;

ALTER TABLE "public"."circles"
  ADD CONSTRAINT "circles_primary_teacher_user_id_fkey"
  FOREIGN KEY ("primary_teacher_user_id") REFERENCES "public"."users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "circles_gender_idx" ON "public"."circles"("gender");
CREATE INDEX "circles_circle_type_idx" ON "public"."circles"("circle_type");

-- Center supervisors (multi-center supervisors, soft active state)
CREATE TABLE "public"."center_supervisors" (
  "id" SERIAL NOT NULL,
  "centerId" INTEGER NOT NULL,
  "supervisor_user_id" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "center_supervisors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "center_supervisors_centerId_supervisor_user_id_key"
  ON "public"."center_supervisors"("centerId", "supervisor_user_id");
CREATE INDEX "center_supervisors_centerId_idx" ON "public"."center_supervisors"("centerId");
CREATE INDEX "center_supervisors_supervisor_user_id_idx" ON "public"."center_supervisors"("supervisor_user_id");
CREATE INDEX "center_supervisors_is_active_idx" ON "public"."center_supervisors"("is_active");

ALTER TABLE "public"."center_supervisors"
  ADD CONSTRAINT "center_supervisors_centerId_fkey"
  FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."center_supervisors"
  ADD CONSTRAINT "center_supervisors_supervisor_user_id_fkey"
  FOREIGN KEY ("supervisor_user_id") REFERENCES "public"."users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
