-- Run this in Supabase's SQL Editor after 85-confessions.sql.
--
-- Mission board — handlers/management/admin post missions (title +
-- blurb + deadline + spot count), anyone can reserve a spot or comment.
-- A mission drops off the listing once full or past its deadline, but
-- isn't deleted, so reservation history is kept. See lib/missions.ts.

ALTER TYPE "board_kind" ADD VALUE 'mission';
