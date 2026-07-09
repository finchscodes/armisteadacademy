-- Run this in Supabase's SQL Editor after 19-guide-sections.sql.
-- Adds article scheduling — a future-dated article stays hidden from
-- everyone except management/granted writers and its own author until the
-- scheduled time arrives (nothing else needed, no cron job — it's just
-- checked at request time).

ALTER TABLE "threads" ADD COLUMN "scheduled_for" timestamp;