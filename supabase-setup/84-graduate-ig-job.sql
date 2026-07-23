-- Run this in Supabase's SQL Editor after 83-editable-privacy-policy.sql.
--
-- Admin/management-set "in-game job" title, shown in place of a graduated
-- character's major. Null means nothing to show, so the major keeps
-- displaying normally until someone sets a title.

ALTER TABLE "characters" ADD COLUMN "ig_job_title" varchar(100);
