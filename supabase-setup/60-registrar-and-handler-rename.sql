-- Run this in Supabase's SQL Editor after 59-prefect-and-student-council-rename.sql.
--
-- Renames two more jobs at the database level, matching the label changes:
--   "gatekeeper" -> "registrar"
--   "operator" -> "handler"
--
-- Postgres requires enum value renames to run outside a transaction block,
-- so these are standalone statements.

ALTER TYPE "character_job" RENAME VALUE 'gatekeeper' TO 'registrar';
ALTER TYPE "character_job" RENAME VALUE 'operator' TO 'handler';
