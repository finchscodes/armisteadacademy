-- Run this in Supabase's SQL Editor after 52-account-timeouts-and-email-auth.sql.
--
-- Renames the "enforcer" job to "student_council" at the database level too
-- (the display label was already changed to "Student Council" in a prior
-- update — this catches up the underlying enum value/DB key to match, so
-- the app code and the stored data use the same name).

ALTER TYPE "character_job" RENAME VALUE 'enforcer' TO 'student_council';
