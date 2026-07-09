-- Run this in Supabase's SQL Editor after 20-article-scheduling.sql.
-- Adds:
--   - New profile fields: gender, social status, personality, appearance
--     (all freely editable, no locking — edit anytime from your character's
--     edit page)
--   - The character relations system (married to, sibling to, enemy of,
--     etc) — request/accept/reject lives on each character's own profile,
--     under the new Relations tab. Accepted relations also show on the
--     Overview tab.
--   - The profile page also gained a Topics tab listing every thread a
--     character has posted in — no schema change needed for that, it's
--     just a new query over existing data.

CREATE TYPE "public"."relation_status" AS ENUM('pending', 'accepted');--> statement-breakpoint
CREATE TABLE "character_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_character_id" integer NOT NULL,
	"to_character_id" integer NOT NULL,
	"relation_type" text NOT NULL,
	"status" "relation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "social_status" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "personality" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "appearance" text;--> statement-breakpoint
ALTER TABLE "character_relations" ADD CONSTRAINT "character_relations_from_character_id_characters_id_fk" FOREIGN KEY ("from_character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_relations" ADD CONSTRAINT "character_relations_to_character_id_characters_id_fk" FOREIGN KEY ("to_character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "character_relations_unique_idx" ON "character_relations" USING btree ("from_character_id","to_character_id","relation_type");