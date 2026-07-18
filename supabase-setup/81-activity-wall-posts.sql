-- Run this in Supabase's SQL Editor after 80-remove-care-for-pet.sql.
--
-- Lets automatic wall posts (leveling up, getting sorted) render as a
-- distinct activity-feed badge+sentence instead of looking like the
-- character wrote them personally. Existing rows are unaffected (both
-- columns null = a normal, real wall post).

ALTER TABLE "wall_posts" ADD COLUMN "activity_type" varchar(20);
ALTER TABLE "wall_posts" ADD COLUMN "activity_value" varchar(40);
