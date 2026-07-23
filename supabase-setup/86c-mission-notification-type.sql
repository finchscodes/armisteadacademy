-- Run this in Supabase's SQL Editor after 86b-mission-board.sql.
--
-- Standalone (enum value additions can't run in the same transaction as
-- other DDL) — the "new mission posted" broadcast notification type.

ALTER TYPE "notification_type" ADD VALUE 'mission_posted';
