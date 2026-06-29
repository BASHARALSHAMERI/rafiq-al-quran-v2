DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "public"."centers"
    GROUP BY "organizationId", "name_ar"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add center name uniqueness: duplicate center names exist within an organization';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "centers_organizationId_name_ar_key"
  ON "public"."centers"("organizationId", "name_ar");