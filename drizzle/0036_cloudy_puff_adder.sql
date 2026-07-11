ALTER TABLE "characters" ALTER COLUMN "major" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DEFAULT 'Undecided'::text;--> statement-breakpoint
-- Reassign anyone still on the old combined major before the enum is
-- recreated without it — otherwise the final cast below fails outright.
UPDATE "characters" SET "major" = 'Survival & Navigation' WHERE "major" = 'Survival, Communications, & Navigation';--> statement-breakpoint
DROP TYPE "public"."character_major";--> statement-breakpoint
CREATE TYPE "public"."character_major" AS ENUM('Threat Elimination', 'Precision Shooting', 'Covert Operations', 'Linguistics, Culture, & Assimilation', 'Advanced Encryption', 'Survival & Navigation', 'Communications & Relay', 'Research & Development', 'Medicine, Chemistry, & Criminology', 'Seduction, Interrogation, & Influence Tactics', 'Protection & Enforcement', 'Undecided');--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DEFAULT 'Undecided'::character_major;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DATA TYPE character_major USING "major"::character_major;