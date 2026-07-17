-- Run this in Supabase's SQL Editor after 72-guide-subsections.sql.
--
-- Pure flavor text for topic areas (e.g. "Level 3 Clearance Required") —
-- not enforced anywhere, no permissions or logic read this column.

ALTER TABLE "boards" ADD COLUMN "clearance" varchar(120);
