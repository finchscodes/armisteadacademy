-- Run this in Supabase's SQL Editor after 32-class-enrollment-and-flat-reward.sql.
-- Adds an optional "requirements" field to lessons — shown as its own
-- section on the lesson page, separate from the main assignment prompt.

ALTER TABLE "lessons" ADD COLUMN "requirements" text;