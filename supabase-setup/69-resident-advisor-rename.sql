-- Run this in Supabase's SQL Editor after 68b-time-progression.sql.
--
-- Renames the "field_agent" job to "resident_advisor" — the label was
-- already "Resident Advisor", this brings the underlying key in line with
-- it, same as the Prefect/Student Council/Registrar/Handler renames before.
--
-- Postgres requires enum value renames to run outside a transaction block,
-- so this is a standalone statement.

ALTER TYPE "character_job" RENAME VALUE 'field_agent' TO 'resident_advisor';
