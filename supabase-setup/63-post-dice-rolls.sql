-- Run this in Supabase's SQL Editor after 62-ooc-on-posts.sql.
--
-- Adds an optional 1d10 dice roll to posts in regular topics. roll_value is
-- always generated server-side (never trust a client-submitted die result)
-- and is never editable after the fact — roll_modifier is the only value
-- the poster controls.

ALTER TABLE "posts" ADD COLUMN "roll_value" integer;
ALTER TABLE "posts" ADD COLUMN "roll_modifier" integer;
