ALTER TYPE "public"."reputation_reason" ADD VALUE 'homework_graded' BEFORE 'grading';--> statement-breakpoint
ALTER TABLE "character_jobs" ADD COLUMN "scope_board_id" integer;--> statement-breakpoint
ALTER TABLE "character_jobs" ADD CONSTRAINT "character_jobs_scope_board_id_boards_id_fk" FOREIGN KEY ("scope_board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;