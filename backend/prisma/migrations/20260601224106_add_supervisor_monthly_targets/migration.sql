-- AlterTable
ALTER TABLE "public"."supervisor_profiles" ADD COLUMN     "monthly_hours_target" INTEGER NOT NULL DEFAULT 80,
ADD COLUMN     "monthly_visits_target" INTEGER NOT NULL DEFAULT 20;
