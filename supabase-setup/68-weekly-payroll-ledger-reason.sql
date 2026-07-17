-- Run this in Supabase's SQL Editor after 67-account-and-ip-banning.sql.
--
-- Postgres requires enum value additions to run outside a transaction
-- block, so this is a standalone statement — the rest of the time
-- progression system (game_time, exams, birthdays, year-restricted
-- boards) is in 68b-time-progression.sql, which depends on this.

ALTER TYPE "ledger_reason" ADD VALUE 'weekly_payroll';
