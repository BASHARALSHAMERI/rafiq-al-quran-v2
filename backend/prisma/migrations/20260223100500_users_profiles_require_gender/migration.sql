UPDATE "public"."user_profiles"
SET "gender" = 'MALE'
WHERE "gender" IS NULL;

ALTER TABLE "public"."user_profiles"
ALTER COLUMN "gender" SET NOT NULL;

