-- Run this in Supabase's SQL Editor after 25-communications-boards.sql.
-- Renames the "Undecided/Witness Protection" major to just "Undecided".
-- RENAME VALUE updates every existing character with this major
-- automatically — nothing to double-check afterward.

ALTER TYPE "public"."character_major" RENAME VALUE 'Undecided/Witness Protection' TO 'Undecided';--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DEFAULT 'Undecided'::character_major;
