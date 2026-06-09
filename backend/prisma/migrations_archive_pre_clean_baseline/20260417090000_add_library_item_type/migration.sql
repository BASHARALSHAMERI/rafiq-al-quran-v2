DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'LibraryItemType'
  ) THEN
    CREATE TYPE "public"."LibraryItemType" AS ENUM ('DOCUMENT', 'AUDIO', 'VIDEO');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'library_items'
      AND column_name = 'type'
  ) THEN
    ALTER TABLE "public"."library_items"
    ADD COLUMN "type" "public"."LibraryItemType";
  END IF;
END
$$;

UPDATE "public"."library_items"
SET "type" = CASE
  WHEN LOWER("mime_type") LIKE 'audio/%' THEN 'AUDIO'::"public"."LibraryItemType"
  WHEN LOWER("mime_type") LIKE 'video/%' THEN 'VIDEO'::"public"."LibraryItemType"
  ELSE 'DOCUMENT'::"public"."LibraryItemType"
END
WHERE "type" IS NULL;

ALTER TABLE "public"."library_items"
ALTER COLUMN "type" SET DEFAULT 'DOCUMENT'::"public"."LibraryItemType";

ALTER TABLE "public"."library_items"
ALTER COLUMN "type" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "library_items_type_idx"
ON "public"."library_items"("type");
