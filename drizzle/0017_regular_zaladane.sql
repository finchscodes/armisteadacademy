ALTER TABLE "currency_ledger" DROP CONSTRAINT "currency_ledger_related_submission_id_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "xp_ledger" DROP CONSTRAINT "xp_ledger_related_submission_id_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "xp_ledger" DROP CONSTRAINT "xp_ledger_related_post_id_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "currency_ledger" ADD CONSTRAINT "currency_ledger_related_submission_id_submissions_id_fk" FOREIGN KEY ("related_submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_related_submission_id_submissions_id_fk" FOREIGN KEY ("related_submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_related_post_id_posts_id_fk" FOREIGN KEY ("related_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;