-- Run this in Supabase's SQL Editor after 09-jobs-admin-classes-into-areas.sql.
-- Adds:
--   - Emoji reactions and comments on forum posts (attributed to the
--     character that reacted/commented, not the account)
--   - Scene-setting fields on threads: location, time, surroundings
--   - Locked "age" field on characters (18-25, set once at creation)
--   - Admin-settable "year override" on characters (normally auto-computed
--     from lessons taken; admin can pin it to a specific value)
--   - Safely re-points the submissions grader reference so deleting a
--     character who graded homework doesn't get blocked by that history —
--     it just nulls the reference instead.

CREATE TABLE "post_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"emoji" varchar(16) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_grader_character_id_characters_id_fk";
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "age" integer DEFAULT 18 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "year_override" varchar(20);--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "location" varchar(200);--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "time_setting" varchar(100);--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "surroundings" text;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "post_reactions_unique_idx" ON "post_reactions" USING btree ("post_id","character_id","emoji");--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_grader_character_id_characters_id_fk" FOREIGN KEY ("grader_character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;