-- Run this in Supabase's SQL Editor after 16-notice-and-community-boards.sql.
-- Lets an article board auto-permit one extra job (beyond management) to
-- post — used so Writers can post to Armistead Weekly / Inside Ploy without
-- each needing an individual admin grant.

ALTER TABLE "boards" ADD COLUMN "extra_article_job" character_job;