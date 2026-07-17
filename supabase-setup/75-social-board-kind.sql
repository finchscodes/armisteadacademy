-- Run this in Supabase's SQL Editor after 74-remove-records-board.sql.
--
-- Postgres requires enum value additions to run outside a transaction
-- block, so this is a standalone statement — the rest of the social board
-- feature (posts.image_url, social_follows) is in 75b-social-boards.sql.

ALTER TYPE "board_kind" ADD VALUE 'social';
