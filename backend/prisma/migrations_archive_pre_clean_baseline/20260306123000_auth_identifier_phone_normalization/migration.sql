ALTER TABLE "public"."user_profiles"
ADD COLUMN IF NOT EXISTS "phone_normalized" VARCHAR(32);

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_phone_normalized_key"
ON "public"."user_profiles" ("phone_normalized");

CREATE TABLE IF NOT EXISTS "public"."password_reset_tokens" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "token_hash" VARCHAR(128) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "user_agent" VARCHAR(255),
  "ip_address" VARCHAR(64),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "password_reset_tokens_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "public"."users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_hash_key"
ON "public"."password_reset_tokens" ("token_hash");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx"
ON "public"."password_reset_tokens" ("user_id");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_at_idx"
ON "public"."password_reset_tokens" ("expires_at");
