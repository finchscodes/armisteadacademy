-- Run this in Supabase's SQL Editor after 22-remove-graduate-faculty-majors.sql.
-- Fixes the actual bug behind "can't delete lessons": the currency/XP ledger
-- rows that reference a submission had no ON DELETE behavior set, so
-- Postgres defaulted to blocking the delete outright whenever a lesson had
-- any graded homework attached to it. This makes those references go to
-- NULL instead — the ledger row (and the money/XP it represents) stays
-- exactly as it is; it just loses the "which submission was this for" link.
-- Nothing is deleted, no balances change.

ALTER TABLE "currency_ledger" DROP CONSTRAINT "currency_ledger_related_submission_id_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "xp_ledger" DROP CONSTRAINT "xp_ledger_related_submission_id_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "xp_ledger" DROP CONSTRAINT "xp_ledger_related_post_id_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "currency_ledger" ADD CONSTRAINT "currency_ledger_related_submission_id_submissions_id_fk" FOREIGN KEY ("related_submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_related_submission_id_submissions_id_fk" FOREIGN KEY ("related_submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_related_post_id_posts_id_fk" FOREIGN KEY ("related_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;