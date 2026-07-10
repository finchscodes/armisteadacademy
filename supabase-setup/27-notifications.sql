-- Run this in Supabase's SQL Editor after 26-rename-undecided-major.sql.
-- Adds the notifications system — the bell icon next to the account menu.
-- Notifies a character when: someone replies to a thread they're in,
-- someone sends them a relation request, or their homework gets graded.

CREATE TYPE "public"."notification_type" AS ENUM('thread_reply', 'relation_request', 'homework_graded');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"message" text NOT NULL,
	"link" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;