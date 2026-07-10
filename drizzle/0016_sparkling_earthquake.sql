ALTER TABLE "characters" ALTER COLUMN "major" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DEFAULT 'Undecided/Witness Protection'::text;--> statement-breakpoint
DROP TYPE "public"."character_major";--> statement-breakpoint
CREATE TYPE "public"."character_major" AS ENUM('Threat Elimination', 'Precision Shooting', 'Covert Operations', 'Linguistics, Culture, & Assimilation', 'Advanced Encryption', 'Survival, Communications, & Navigation', 'Research & Development', 'Medicine, Chemistry, & Criminology', 'Seduction, Interrogation, & Influence Tactics', 'Protection & Enforcement', 'Undecided/Witness Protection');--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DEFAULT 'Undecided/Witness Protection'::character_major;--> statement-breakpoint
-- 'Graduate' and 'Faculty' no longer exist as majors (graduation is purely a
-- year label now; Faculty is a job, not a major). Any character currently
-- set to either falls back to Undecided — admin can pick something more
-- accurate afterward via /admin/users if needed.
ALTER TABLE "characters" ALTER COLUMN "major" SET DATA TYPE character_major USING (
  CASE "major"
    WHEN 'Graduate' THEN 'Undecided/Witness Protection'
    WHEN 'Faculty' THEN 'Undecided/Witness Protection'
    ELSE "major"
  END
)::character_major;