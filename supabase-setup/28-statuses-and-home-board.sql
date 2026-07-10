-- Run this in Supabase's SQL Editor after 27-notifications.sql.
-- Adds:
--   - character_statuses — custom admin-assigned titles shown on a
--     character's profile and hover card (managed per-character in
--     /admin/users/[id], alongside jobs)
--   - home_announcement — the homepage Welcome/announcement widget
--     (singleton row, edit at /admin/home-board)
--   - spotlight_entries — up to two characters featured on the homepage
--     with a blurb (managed at /admin/home-board)
-- The homepage News widget needs no new table — it just reads existing
-- article-board threads.

CREATE TABLE "character_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"label" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_announcement" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"title" varchar(120) DEFAULT 'Welcome!' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spotlight_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"blurb" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_statuses" ADD CONSTRAINT "character_statuses_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotlight_entries" ADD CONSTRAINT "spotlight_entries_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;