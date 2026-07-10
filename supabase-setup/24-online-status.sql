-- Run this in Supabase's SQL Editor after 23-fix-ledger-cascade.sql.
-- Adds the column behind "who's online" — updated by a periodic heartbeat
-- from each open tab. Drives the online list in chat and restricts
-- @mentions to characters who are actually online right now.

ALTER TABLE "characters" ADD COLUMN "last_active_at" timestamp;