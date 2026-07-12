-- Run this in Supabase's SQL Editor after 51-chief-editor-boards.sql.
--
-- Three unrelated changes bundled together since they all touch the users
-- table:
--
-- 1. Chat timeouts move from characters to users — a timeout now applies to
--    the whole account (every character on it), not just the one character
--    that got called out in chat. Old per-character timeouts are dropped
--    rather than migrated: they're short-lived (minutes) and any that still
--    mattered will have long since expired.
--
-- 2. Usernames are removed — accounts are identified by email only now.
--    Existing usernames aren't preserved anywhere; login/registration/admin
--    screens all switch to email.
--
-- 3. Password reset tokens — supports "forgot password" email links.

ALTER TABLE "users" ADD COLUMN "chat_timeout_until" timestamp;
ALTER TABLE "characters" DROP COLUMN "chat_timeout_until";

DROP INDEX IF EXISTS "users_username_idx";
ALTER TABLE "users" DROP COLUMN "username";

CREATE TABLE "password_reset_tokens" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" varchar(64) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens" ("token");
