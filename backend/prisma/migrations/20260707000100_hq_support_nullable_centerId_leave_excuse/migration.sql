-- Safe migration: HQ support – make centerId nullable in leave/excuse tables
-- and add isHeadquarters flag to both tables.
-- No data is altered or dropped.

-- StaffLeaveRequest: make center_id nullable, add is_headquarters
ALTER TABLE "staff_leave_requests" ALTER COLUMN "center_id" DROP NOT NULL;
ALTER TABLE "staff_leave_requests" ADD COLUMN IF NOT EXISTS "is_headquarters" BOOLEAN NOT NULL DEFAULT false;

-- StaffExcuseRequest: make center_id nullable, add is_headquarters
ALTER TABLE "staff_excuse_requests" ALTER COLUMN "center_id" DROP NOT NULL;
ALTER TABLE "staff_excuse_requests" ADD COLUMN IF NOT EXISTS "is_headquarters" BOOLEAN NOT NULL DEFAULT false;
