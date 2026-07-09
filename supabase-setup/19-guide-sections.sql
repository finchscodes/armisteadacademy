-- Run this in Supabase's SQL Editor after 18-more-boards.sql.
-- Adds the guide_sections table backing the new "Rules & Guidelines" page
-- (/guide) — admin can add, edit, delete, and reorder sections from
-- /admin/guide. No seed data here; the page starts empty until you add
-- sections through the admin panel.

CREATE TABLE "guide_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"content" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "guide_sections_slug_idx" ON "guide_sections" USING btree ("slug");