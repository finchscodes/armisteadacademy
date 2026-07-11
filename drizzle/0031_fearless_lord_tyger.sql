CREATE TABLE "wall_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"wall_character_id" integer NOT NULL,
	"poster_character_id" integer NOT NULL,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wall_posts" ADD CONSTRAINT "wall_posts_wall_character_id_characters_id_fk" FOREIGN KEY ("wall_character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wall_posts" ADD CONSTRAINT "wall_posts_poster_character_id_characters_id_fk" FOREIGN KEY ("poster_character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;