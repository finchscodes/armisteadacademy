-- Run this in Supabase's SQL Editor after 70-records-board.sql.
--
-- Reputation "resets" each in-game year in the sense that leaderboards and
-- hall totals only count the current year's entries — a character's
-- profile still shows their lifetime total separately. Existing rows get
-- backfilled to game_year 1 (adjust manually if your game clock has
-- already moved past Year 1 by the time this runs).

ALTER TABLE "reputation_ledger" ADD COLUMN "game_year" integer NOT NULL DEFAULT 1;
