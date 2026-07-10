ALTER TYPE "public"."character_major" RENAME VALUE 'Undecided/Witness Protection' TO 'Undecided';--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DEFAULT 'Undecided'::character_major;
