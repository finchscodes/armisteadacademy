-- Run this in Supabase's SQL Editor after 44-backstory-rating-approval.sql.
-- Adds an admin-only hall blurb — lore/info about the hall itself, separate
-- from the Resident Advisor's personal welcome message. RAs can't see or
-- edit this field; only /admin/hall-welcome can.

ALTER TABLE "hall_welcome_messages" ADD COLUMN "blurb" text DEFAULT '' NOT NULL;