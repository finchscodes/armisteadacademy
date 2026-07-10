CREATE TYPE "public"."grade_tier" AS ENUM('perfect', 'excellent', 'good', 'needs_improvement', 'failing');--> statement-breakpoint
CREATE TABLE "submission_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"grader_character_id" integer NOT NULL,
	"tier" "grade_tier" NOT NULL,
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_created_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_grader_character_id_characters_id_fk";
--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "status" SET DEFAULT 'open'::text;--> statement-breakpoint
DROP TYPE "public"."submission_status";--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('open', 'graded');--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."submission_status";--> statement-breakpoint
-- 'claimed' no longer exists as a status — the old single-claim model is gone.
-- Any submission that was claimed-but-not-yet-graded goes back to 'open' so it
-- re-enters the new multi-grader queue.
ALTER TABLE "submissions" ALTER COLUMN "status" SET DATA TYPE "public"."submission_status" USING (
  CASE "status"
    WHEN 'claimed' THEN 'open'
    ELSE "status"
  END
)::"public"."submission_status";--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "created_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "job_title" varchar(100);--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "final_tier" "grade_tier";--> statement-breakpoint
ALTER TABLE "submission_grades" ADD CONSTRAINT "submission_grades_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_grades" ADD CONSTRAINT "submission_grades_grader_character_id_characters_id_fk" FOREIGN KEY ("grader_character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "submission_grades_unique_idx" ON "submission_grades" USING btree ("submission_id","grader_character_id");--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" DROP COLUMN "grader_character_id";--> statement-breakpoint
ALTER TABLE "submissions" DROP COLUMN "feedback";