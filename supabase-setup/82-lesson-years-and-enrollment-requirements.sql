-- Run this in Supabase's SQL Editor after 81-activity-wall-posts.sql.
--
-- Lets individual lessons (not just whole class boards) be restricted by
-- year, and lets a class require a specific Arsenal item to enroll (e.g.
-- a textbook). Neither affects grading — see lib/grading.ts, untouched.

ALTER TABLE "lessons" ADD COLUMN "restricted_year_min" integer;
ALTER TABLE "lessons" ADD COLUMN "restricted_year_max" integer;

ALTER TABLE "boards" ADD COLUMN "required_item_id" integer REFERENCES "items"("id") ON DELETE SET NULL;
