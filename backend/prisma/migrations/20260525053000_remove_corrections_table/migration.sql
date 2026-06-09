-- Remove the deprecated supervisor corrections workflow.
DROP TABLE IF EXISTS "public"."correction_requests";

DROP TYPE IF EXISTS "public"."CorrectionRequestStatus";
DROP TYPE IF EXISTS "public"."CorrectionTargetType";
