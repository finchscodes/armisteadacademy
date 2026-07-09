-- Run this in Supabase's SQL Editor after 13-merge-covert-team-operations.sql.
-- Jobs move from a single field on each character to a proper multi-job
-- table — a character can now hold several jobs at once (e.g. Spymaster AND
-- Instructor) and shows up on the Job List under every one of them.
-- Any character's existing single job is preserved as a row in the new
-- table before the old columns are dropped — nothing is lost.

CREATE TABLE "character_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"job" character_job NOT NULL,
	"job_title" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_jobs" ADD CONSTRAINT "character_jobs_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "character_jobs_unique_idx" ON "character_jobs" USING btree ("character_id","job");--> statement-breakpoint
-- Preserve every character's existing single job (if any) as a row in the
-- new table before the old columns are dropped below.
INSERT INTO "character_jobs" ("character_id", "job", "job_title")
SELECT "id", "job", "job_title" FROM "characters" WHERE "job" != 'none';--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "job";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "job_title";