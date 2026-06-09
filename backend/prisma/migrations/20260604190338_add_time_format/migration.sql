-- CreateEnum
CREATE TYPE "public"."TimeFormat" AS ENUM ('HOUR_12', 'HOUR_24');

-- AlterTable
ALTER TABLE "public"."attendance_policies" ADD COLUMN     "time_format" "public"."TimeFormat" NOT NULL DEFAULT 'HOUR_12',
ALTER COLUMN "timezone" SET DEFAULT 'Asia/Aden';

-- AlterTable
ALTER TABLE "public"."centers" ALTER COLUMN "timezone" SET DEFAULT 'Asia/Aden';
