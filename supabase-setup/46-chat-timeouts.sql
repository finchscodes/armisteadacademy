-- Run this in Supabase's SQL Editor after 45-hall-blurb.sql.
-- Adds chat timeouts — a character can be temporarily blocked from posting
-- in chat, either manually by a moderator (admin/management, Assistant
-- Instructors, Enforcers) or automatically after 8 messages in a row.

ALTER TABLE "characters" ADD COLUMN "chat_timeout_until" timestamp;