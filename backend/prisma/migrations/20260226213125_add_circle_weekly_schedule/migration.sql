-- CreateEnum
CREATE TYPE "public"."Weekday" AS ENUM ('FRIDAY', 'SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY');

-- CreateEnum
CREATE TYPE "public"."CircleScheduleMode" AS ENUM ('CLOCK', 'PRAYER');

-- CreateEnum
CREATE TYPE "public"."PrayerName" AS ENUM ('FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA');

-- CreateTable
CREATE TABLE "public"."circle_schedule_slots" (
    "id" SERIAL NOT NULL,
    "circle_id" INTEGER NOT NULL,
    "day_of_week" "public"."Weekday" NOT NULL,
    "mode" "public"."CircleScheduleMode" NOT NULL,
    "from_time" VARCHAR(5),
    "to_time" VARCHAR(5),
    "from_prayer" "public"."PrayerName",
    "to_prayer" "public"."PrayerName",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circle_schedule_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "circle_schedule_slots_circle_id_idx" ON "public"."circle_schedule_slots"("circle_id");

-- CreateIndex
CREATE UNIQUE INDEX "circle_schedule_slots_circle_id_day_of_week_key" ON "public"."circle_schedule_slots"("circle_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "public"."circle_schedule_slots" ADD CONSTRAINT "circle_schedule_slots_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."circles_centerId_name_key" RENAME TO "circles_centerId_name_ar_key";

-- RenameIndex
ALTER INDEX "public"."circles_teacherId_idx" RENAME TO "circles_primary_teacher_user_id_idx";
