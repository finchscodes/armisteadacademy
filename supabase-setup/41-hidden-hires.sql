-- Run this in Supabase's SQL Editor after 40-scoped-roles.sql.
-- Adds "hidden hire" support — a job assignment can grant the same board
-- access as normal, but not show up on the Job List or the character's
-- own profile.

ALTER TABLE "character_jobs" ADD COLUMN "is_hidden" boolean DEFAULT false NOT NULL;