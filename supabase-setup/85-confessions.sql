-- Run this in Supabase's SQL Editor after 84-graduate-ig-job.sql.
--
-- Confession widget — anonymous rumors/tips/intel, vetted by admins before
-- showing publicly. Submitter is tracked for moderation but never shown.
-- See lib/confessions.ts.

CREATE TYPE "confession_status" AS ENUM ('pending', 'approved');

CREATE TABLE "confessions" (
  "id" serial PRIMARY KEY,
  "character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "status" "confession_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "approved_at" timestamp
);
