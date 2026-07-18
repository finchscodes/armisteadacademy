-- Run this in Supabase's SQL Editor after 76-hunger-thirst.sql.
--
-- Replaces the fixed "fainted_until" timestamp with a remaining-time
-- counter, so the one-hour faint clock can pause while a character is
-- offline instead of ticking down unattended. See lib/needs.ts.

ALTER TABLE "characters" DROP COLUMN IF EXISTS "fainted_until";
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "faint_remaining_ms" integer;
