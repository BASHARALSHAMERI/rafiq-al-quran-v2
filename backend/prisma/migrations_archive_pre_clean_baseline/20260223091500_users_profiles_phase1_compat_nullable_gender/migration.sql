ALTER TABLE "public"."centers"
  ALTER COLUMN "gender" SET DEFAULT 'MALE';

ALTER TABLE "public"."circles"
  ALTER COLUMN "gender" SET DEFAULT 'MALE',
  ALTER COLUMN "circle_type" SET DEFAULT 'HIFZ';

ALTER TABLE "public"."user_profiles"
  ALTER COLUMN "gender" DROP NOT NULL;
