DO $$
BEGIN
  CREATE TYPE "AccountStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "activation_token_hash" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "activation_token_expires_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "activation_sent_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "activated_at" TIMESTAMP(3);
