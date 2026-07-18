-- Run this in Supabase's SQL Editor after 75b-social-boards.sql.
--
-- Adds hunger/thirst to characters (drain over one real week, fainting at
-- 0, items that restore them) — see lib/needs.ts.

ALTER TABLE "characters" ADD COLUMN "hunger" integer NOT NULL DEFAULT 100;
ALTER TABLE "characters" ADD COLUMN "thirst" integer NOT NULL DEFAULT 100;
ALTER TABLE "characters" ADD COLUMN "last_needs_update" timestamp NOT NULL DEFAULT now();
ALTER TABLE "characters" ADD COLUMN "fainted_until" timestamp;

ALTER TABLE "items" ADD COLUMN "hunger_restore" integer;
ALTER TABLE "items" ADD COLUMN "thirst_restore" integer;
