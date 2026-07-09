-- Run this in Supabase's SQL Editor if you already ran 01-schema.sql and 02-seed.sql
-- before this update. It replaces the free-text "house" field with a proper
-- "major" dropdown (Threat Elimination, Precision Shooting, etc). Existing
-- characters get defaulted to "Undecided/Witness Protection" — there was no clean
-- way to map old free-text house values onto the new fixed list.
CREATE TYPE "public"."character_major" AS ENUM('Threat Elimination', 'Precision Shooting', 'Covert Operations', 'Linguistics, Culture, & Assimilation', 'Advanced Encryption', 'Survival, Communications, & Navigation', 'Research & Development', 'Medicine, Chemistry, & Criminology', 'Seduction, Interrogation, & Influence Tactics', 'Protection & Enforcement', 'Undecided/Witness Protection', 'Graduate', 'Faculty');--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "major" character_major DEFAULT 'Undecided/Witness Protection' NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "house";