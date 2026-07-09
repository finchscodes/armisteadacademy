CREATE TYPE "public"."xp_reason" AS ENUM('chat_post', 'homework_submission', 'grading', 'pet_cuddle', 'admin_adjustment');--> statement-breakpoint
CREATE TABLE "pets" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"name" varchar(64) NOT NULL,
	"species" varchar(60) NOT NULL,
	"bio" text,
	"avatar_url" text,
	"last_cuddled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"reason" "xp_reason" NOT NULL,
	"related_submission_id" integer,
	"related_post_id" integer,
	"related_pet_id" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_related_submission_id_submissions_id_fk" FOREIGN KEY ("related_submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_related_post_id_posts_id_fk" FOREIGN KEY ("related_post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_related_pet_id_pets_id_fk" FOREIGN KEY ("related_pet_id") REFERENCES "public"."pets"("id") ON DELETE no action ON UPDATE no action;