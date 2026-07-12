-- Run this in Supabase's SQL Editor after 56-email-boards.sql.
--
-- Adds "letter" as an alternate layout for email boards — a to/body/from
-- letter format instead of the From/Date/Subject envelope. email_format
-- is null for every board except email boards, where it's "email" or
-- "letter"; letter_to/letter_from are only used when it's "letter".

ALTER TABLE "threads" ADD COLUMN "email_format" varchar(10);
ALTER TABLE "threads" ADD COLUMN "letter_to" varchar(200);
ALTER TABLE "threads" ADD COLUMN "letter_from" varchar(200);
