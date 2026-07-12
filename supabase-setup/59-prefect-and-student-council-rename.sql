-- Run this in Supabase's SQL Editor after 58-email-format-on-posts.sql.
--
-- Two renames, order matters (the first frees up the "student_council"
-- name for the second to reuse):
--   1. "student_council" (the job previously renamed from "enforcer") -> "prefect"
--   2. "school_board_member" -> "student_council"
--
-- Postgres requires enum value renames to run outside a transaction block,
-- so these are standalone statements, one per line.

ALTER TYPE "character_job" RENAME VALUE 'student_council' TO 'prefect';
ALTER TYPE "character_job" RENAME VALUE 'school_board_member' TO 'student_council';
