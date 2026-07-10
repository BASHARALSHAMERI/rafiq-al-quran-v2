ALTER TABLE "supervisor_visit_plan_items" ADD COLUMN IF NOT EXISTS "planned_start_at" TIMESTAMP(3);
ALTER TABLE "supervisor_visit_plan_items" ADD COLUMN IF NOT EXISTS "planned_end_at" TIMESTAMP(3);
