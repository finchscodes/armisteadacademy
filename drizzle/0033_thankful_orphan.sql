ALTER TABLE "characters" ADD COLUMN "backstory_rating" integer;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "backstory_approved" boolean DEFAULT false NOT NULL;