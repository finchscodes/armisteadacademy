CREATE TYPE "public"."hall" AS ENUM('undercroft', 'veil', 'rampart', 'eaves');--> statement-breakpoint
CREATE TYPE "public"."reputation_reason" AS ENUM('homework_submission', 'grading', 'thread_created', 'thread_reply', 'admin_adjustment');--> statement-breakpoint
CREATE TABLE "reputation_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"reason" "reputation_reason" NOT NULL,
	"related_submission_id" integer,
	"related_post_id" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sorting_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"answer_text" text NOT NULL,
	"hall" "hall" NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sorting_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_text" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "restricted_to_hall" "hall";--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "hall" "hall";--> statement-breakpoint
ALTER TABLE "reputation_ledger" ADD CONSTRAINT "reputation_ledger_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_ledger" ADD CONSTRAINT "reputation_ledger_related_submission_id_submissions_id_fk" FOREIGN KEY ("related_submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_ledger" ADD CONSTRAINT "reputation_ledger_related_post_id_posts_id_fk" FOREIGN KEY ("related_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sorting_answers" ADD CONSTRAINT "sorting_answers_question_id_sorting_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."sorting_questions"("id") ON DELETE cascade ON UPDATE no action;