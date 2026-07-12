-- Run this in Supabase's SQL Editor after 55-phone-boards.sql.
--
-- Adds "email" as a board kind — an Emails/Letters board where each topic
-- is a single email (envelope-style header, rich-text body, no threaded
-- replies) with a comment section underneath, similar in shape to an
-- article board but open to everyone and styled like a letter instead.
-- Postgres requires enum additions to run outside a transaction block, so
-- this is a single standalone statement.

ALTER TYPE "board_kind" ADD VALUE 'email';
