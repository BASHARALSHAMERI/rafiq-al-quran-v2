CREATE TYPE "public"."RewardType" AS ENUM ('GENERAL', 'PERFORMANCE', 'ATTENDANCE', 'COMPETITION', 'OTHER');

ALTER TYPE "public"."RewardCycle" ADD VALUE IF NOT EXISTS 'ANNUAL';
ALTER TYPE "public"."RewardItemStatus" ADD VALUE IF NOT EXISTS 'FAILED';

ALTER TABLE "public"."reward_profiles"
ADD COLUMN "rewardType" "public"."RewardType";

ALTER TABLE "public"."reward_batches"
ADD COLUMN "rewardType" "public"."RewardType";

ALTER TABLE "public"."reward_items"
ADD COLUMN "rewardType" "public"."RewardType",
ADD COLUMN "paymentMethod" "public"."PaymentMethod",
ADD COLUMN "paymentReference" VARCHAR(120),
ADD COLUMN "failureReason" VARCHAR(500);
