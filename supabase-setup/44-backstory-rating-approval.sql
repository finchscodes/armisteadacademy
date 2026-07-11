-- Run this in Supabase's SQL Editor after 43-wall-notifications.sql.
-- Adds a content rating to backstories (same 1-5 scale as topics) plus a
-- Gatekeeper/management approval flag. Nothing is blocked while pending —
-- it's purely an informational badge on the profile.

ALTER TABLE "characters" ADD COLUMN "backstory_rating" integer;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "backstory_approved" boolean DEFAULT false NOT NULL;