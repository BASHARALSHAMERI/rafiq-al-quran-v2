-- Backfill JournalEntry fiscalPeriodId from the matching organization fiscal period.
UPDATE "public"."journal_entries" AS je
SET "fiscal_period_id" = fp."id"
FROM "public"."fiscal_periods" AS fp
WHERE je."fiscal_period_id" IS NULL
  AND fp."organizationId" = je."organizationId"
  AND je."entryDate" BETWEEN fp."startDate" AND fp."endDate";
