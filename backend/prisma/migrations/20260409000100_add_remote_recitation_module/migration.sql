-- CreateEnum
CREATE TYPE "public"."RemoteRecitationBookingStatus" AS ENUM (
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED'
);

-- AlterEnum
ALTER TYPE "public"."NotificationType"
ADD VALUE IF NOT EXISTS 'REMOTE_RECITATION_REQUESTED';

ALTER TYPE "public"."NotificationType"
ADD VALUE IF NOT EXISTS 'REMOTE_RECITATION_APPROVED';

ALTER TYPE "public"."NotificationType"
ADD VALUE IF NOT EXISTS 'REMOTE_RECITATION_REJECTED';

ALTER TYPE "public"."NotificationType"
ADD VALUE IF NOT EXISTS 'REMOTE_RECITATION_CANCELLED';

ALTER TYPE "public"."NotificationType"
ADD VALUE IF NOT EXISTS 'REMOTE_RECITATION_COMPLETED';

-- AlterEnum
ALTER TYPE "public"."AuditEntityType"
ADD VALUE IF NOT EXISTS 'REMOTE_RECITATION_SLOT';

ALTER TYPE "public"."AuditEntityType"
ADD VALUE IF NOT EXISTS 'REMOTE_RECITATION_BOOKING';

-- CreateTable
CREATE TABLE "public"."remote_recitation_settings" (
  "id" SERIAL NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "center_id" INTEGER NOT NULL,
  "circle_id" INTEGER NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT false,
  "slot_duration_minutes" INTEGER NOT NULL DEFAULT 30,
  "booking_lead_hours" INTEGER NOT NULL DEFAULT 2,
  "cancellation_window_hours" INTEGER NOT NULL DEFAULT 2,
  "max_advance_days" INTEGER NOT NULL DEFAULT 21,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "remote_recitation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."remote_recitation_slots" (
  "id" SERIAL NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "center_id" INTEGER NOT NULL,
  "circle_id" INTEGER NOT NULL,
  "teacher_id" INTEGER NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "join_url" VARCHAR(500) NOT NULL,
  "provider_host" VARCHAR(120),
  "note" VARCHAR(500),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "lock_version" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "remote_recitation_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."remote_recitation_bookings" (
  "id" SERIAL NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "center_id" INTEGER NOT NULL,
  "circle_id" INTEGER NOT NULL,
  "slot_id" INTEGER NOT NULL,
  "student_id" INTEGER NOT NULL,
  "teacher_id" INTEGER NOT NULL,
  "status" "public"."RemoteRecitationBookingStatus" NOT NULL DEFAULT 'REQUESTED',
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewed_at" TIMESTAMP(3),
  "review_note" VARCHAR(500),
  "cancelled_at" TIMESTAMP(3),
  "cancellation_reason" VARCHAR(500),
  "completed_at" TIMESTAMP(3),
  "follow_up_record_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "lock_version" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "remote_recitation_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "remote_recitation_settings_circle_id_key"
ON "public"."remote_recitation_settings"("circle_id");

CREATE UNIQUE INDEX "remote_recitation_bookings_follow_up_record_id_key"
ON "public"."remote_recitation_bookings"("follow_up_record_id");

CREATE INDEX "remote_recitation_settings_organization_id_idx"
ON "public"."remote_recitation_settings"("organization_id");

CREATE INDEX "remote_recitation_settings_center_id_idx"
ON "public"."remote_recitation_settings"("center_id");

CREATE INDEX "remote_recitation_slots_organization_id_starts_at_idx"
ON "public"."remote_recitation_slots"("organization_id", "starts_at");

CREATE INDEX "remote_recitation_slots_center_id_starts_at_idx"
ON "public"."remote_recitation_slots"("center_id", "starts_at");

CREATE INDEX "remote_recitation_slots_circle_id_starts_at_idx"
ON "public"."remote_recitation_slots"("circle_id", "starts_at");

CREATE INDEX "remote_recitation_slots_teacher_id_starts_at_idx"
ON "public"."remote_recitation_slots"("teacher_id", "starts_at");

CREATE INDEX "remote_recitation_slots_is_active_starts_at_idx"
ON "public"."remote_recitation_slots"("is_active", "starts_at");

CREATE INDEX "remote_recitation_bookings_organization_id_status_requested_at_idx"
ON "public"."remote_recitation_bookings"("organization_id", "status", "requested_at");

CREATE INDEX "remote_recitation_bookings_center_id_status_requested_at_idx"
ON "public"."remote_recitation_bookings"("center_id", "status", "requested_at");

CREATE INDEX "remote_recitation_bookings_circle_id_status_requested_at_idx"
ON "public"."remote_recitation_bookings"("circle_id", "status", "requested_at");

CREATE INDEX "remote_recitation_bookings_slot_id_idx"
ON "public"."remote_recitation_bookings"("slot_id");

CREATE INDEX "remote_recitation_bookings_student_id_status_requested_at_idx"
ON "public"."remote_recitation_bookings"("student_id", "status", "requested_at");

CREATE INDEX "remote_recitation_bookings_teacher_id_status_requested_at_idx"
ON "public"."remote_recitation_bookings"("teacher_id", "status", "requested_at");

CREATE UNIQUE INDEX "remote_recitation_bookings_slot_active_unique"
ON "public"."remote_recitation_bookings"("slot_id")
WHERE "status" IN ('REQUESTED', 'APPROVED', 'COMPLETED');

-- AddForeignKey
ALTER TABLE "public"."remote_recitation_settings"
ADD CONSTRAINT "remote_recitation_settings_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_settings"
ADD CONSTRAINT "remote_recitation_settings_center_id_fkey"
FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_settings"
ADD CONSTRAINT "remote_recitation_settings_circle_id_fkey"
FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_slots"
ADD CONSTRAINT "remote_recitation_slots_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_slots"
ADD CONSTRAINT "remote_recitation_slots_center_id_fkey"
FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_slots"
ADD CONSTRAINT "remote_recitation_slots_circle_id_fkey"
FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_slots"
ADD CONSTRAINT "remote_recitation_slots_teacher_id_fkey"
FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_bookings"
ADD CONSTRAINT "remote_recitation_bookings_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_bookings"
ADD CONSTRAINT "remote_recitation_bookings_center_id_fkey"
FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_bookings"
ADD CONSTRAINT "remote_recitation_bookings_circle_id_fkey"
FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_bookings"
ADD CONSTRAINT "remote_recitation_bookings_slot_id_fkey"
FOREIGN KEY ("slot_id") REFERENCES "public"."remote_recitation_slots"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_bookings"
ADD CONSTRAINT "remote_recitation_bookings_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "public"."users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_bookings"
ADD CONSTRAINT "remote_recitation_bookings_teacher_id_fkey"
FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."remote_recitation_bookings"
ADD CONSTRAINT "remote_recitation_bookings_follow_up_record_id_fkey"
FOREIGN KEY ("follow_up_record_id") REFERENCES "public"."follow_up_records"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
