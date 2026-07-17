-- Run this in Supabase's SQL Editor after 71-reputation-game-year.sql.
--
-- Adds nesting to the guidebook — a section can be a sub-tab under a
-- top-level one (one level deep), shown indented beneath it in the sidebar.

ALTER TABLE "guide_sections" ADD COLUMN "parent_id" integer REFERENCES "guide_sections"("id") ON DELETE SET NULL;
