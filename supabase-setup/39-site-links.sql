-- Run this in Supabase's SQL Editor after 38-board-image.sql.
-- Adds site_links — the row of external link buttons (Discord, socials,
-- etc) shown at the bottom of the home board, managed at /admin/home-board.

CREATE TABLE "site_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(60) NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
