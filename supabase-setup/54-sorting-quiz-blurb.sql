-- Run this in Supabase's SQL Editor after 53-rename-enforcer-to-student-council.sql.
--
-- Adds a single-row table for an intro blurb shown at the top of the
-- sorting quiz, before the questions — same pattern as home_announcement.

CREATE TABLE "sorting_quiz_blurb" (
  "id" integer PRIMARY KEY DEFAULT 1,
  "content" text NOT NULL DEFAULT '',
  "updated_at" timestamp NOT NULL DEFAULT now()
);
