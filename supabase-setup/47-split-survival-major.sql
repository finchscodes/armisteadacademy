-- Run this in Supabase's SQL Editor after 46-chat-timeouts.sql.
--
-- Splits the "Survival, Communications, & Navigation" major into two:
-- "Survival & Navigation" and "Communications & Relay". Also fixes a
-- long-standing stale default value on characters.major (it still said
-- "Undecided/Witness Protection" from before that major was renamed to
-- just "Undecided").
--
-- IMPORTANT: any existing character with the old combined major is
-- automatically reassigned to "Survival & Navigation" below, since that's
-- the closer match of the two new options. If you'd rather some of them
-- were "Communications & Relay" instead, run this migration first, then
-- manually update those specific characters afterward — either through
-- the admin panel or a follow-up SQL UPDATE.

ALTER TABLE "characters" ALTER COLUMN "major" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DEFAULT 'Undecided'::text;--> statement-breakpoint
-- Reassign anyone still on the old combined major before the enum is
-- recreated without it — otherwise the final cast below fails outright.
UPDATE "characters" SET "major" = 'Survival & Navigation' WHERE "major" = 'Survival, Communications, & Navigation';--> statement-breakpoint
DROP TYPE "public"."character_major";--> statement-breakpoint
CREATE TYPE "public"."character_major" AS ENUM('Threat Elimination', 'Precision Shooting', 'Covert Operations', 'Linguistics, Culture, & Assimilation', 'Advanced Encryption', 'Survival & Navigation', 'Communications & Relay', 'Research & Development', 'Medicine, Chemistry, & Criminology', 'Seduction, Interrogation, & Influence Tactics', 'Protection & Enforcement', 'Undecided');--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DEFAULT 'Undecided'::character_major;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DATA TYPE character_major USING "major"::character_major;