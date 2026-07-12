-- Run this in Supabase's SQL Editor after 57-letter-format.sql.
--
-- Moves the email/letter format fields from threads to posts — replies now
-- need to independently be an email or a letter (a correspondence can mix
-- formats), so this can't live on the thread anymore. Since 57 only just
-- shipped, there's no real letter/email data yet worth preserving — this
-- is a clean cutover, not a data migration.

ALTER TABLE "threads" DROP COLUMN "email_format";
ALTER TABLE "threads" DROP COLUMN "letter_to";
ALTER TABLE "threads" DROP COLUMN "letter_from";

ALTER TABLE "posts" ADD COLUMN "email_format" varchar(10);
ALTER TABLE "posts" ADD COLUMN "letter_to" varchar(200);
ALTER TABLE "posts" ADD COLUMN "letter_from" varchar(200);
