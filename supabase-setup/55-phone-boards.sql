-- Run this in Supabase's SQL Editor after 54-sorting-quiz-blurb.sql.
--
-- Adds "phone" as a board kind — a texting/phone-call board where topics
-- replicate a phone conversation (message bubbles, left/right aligned by
-- who's talking) instead of a normal forum thread. Postgres requires enum
-- additions to run outside a transaction block, so this is a single
-- standalone statement.

ALTER TYPE "board_kind" ADD VALUE 'phone';
