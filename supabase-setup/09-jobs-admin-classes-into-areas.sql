-- Run this in Supabase's SQL Editor after your database is already up to date
-- through 08-new-classes.sql. This is a big one — it does three things:
--   1. Moves jobs from accounts to characters, adds an account-level admin flag,
--      and adds the class-assignments table (per-class instructor access).
--   2. Removes the old "The Grounds" category (dining-hall-old, common-rooms)
--      and the standalone "Training" category.
--   3. Re-homes the class boards into the floor/area categories they belong to
--      (Medical Training under Underground next to Medical Bay, etc).

/* ---- 1. Schema: jobs on characters, admin flag, class assignments -------- */

CREATE TYPE "public"."character_job" AS ENUM('none', 'spymaster', 'secretary', 'field_agent', 'head_staff', 'instructor', 'chief_editor', 'assistant_instructor', 'enforcer', 'school_board_member', 'writer', 'media_team', 'library_handler', 'gatekeeper', 'operator');

CREATE TABLE "class_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"board_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DATA TYPE text;
ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DEFAULT 'member';
ALTER TABLE "boards" ALTER COLUMN "min_role_to_post" SET DATA TYPE text;
ALTER TABLE "boards" ALTER COLUMN "min_role_to_post" SET DEFAULT 'member';
ALTER TABLE "characters" ADD COLUMN "job" character_job DEFAULT 'none' NOT NULL;
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;

-- Preserve admin access before dropping the old role column.
UPDATE "users" SET "is_admin" = true WHERE "role" IN ('spymaster', 'admin');

ALTER TABLE "class_assignments" ADD CONSTRAINT "class_assignments_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "class_assignments" ADD CONSTRAINT "class_assignments_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "class_assignments_character_board_idx" ON "class_assignments" USING btree ("character_id","board_id");
ALTER TABLE "users" DROP COLUMN "role";
DROP TYPE "public"."user_role";

/* ---- 2. Remove old "The Grounds" category and standalone Training -------- */
-- Deleting a category cascades to its child boards, their threads, and posts.
-- If you posted anything real in dining-hall-old / common-rooms you want to
-- keep, move it first.

DELETE FROM boards WHERE slug IN ('dining-hall-old', 'common-rooms');
DELETE FROM boards WHERE slug = 'the-grounds';
-- The standalone Training category's classes get re-homed below, so detach the
-- classes from it first (set parent to NULL), then delete the empty category.
-- (We re-parent by slug in step 3.)

/* ---- 3. Re-home classes into their matching area categories -------------- */
-- Each class board moves under the area category it thematically belongs to.
-- Uses a helper to look up category ids by slug.

-- General Education -> Third Floor (Classrooms area)
UPDATE boards SET parent_id = (SELECT id FROM boards WHERE slug = 'third-floor' AND kind = 'category')
  WHERE slug = 'general-education';
-- Threat Elimination, Precise Shooting, Poison -> Underground (near shooting range)
UPDATE boards SET parent_id = (SELECT id FROM boards WHERE slug = 'underground' AND kind = 'category')
  WHERE slug IN ('threat-elimination', 'precise-shooting', 'poison');
-- Medical Training, Chemistry and Criminology -> Underground (near Medical Bay)
UPDATE boards SET parent_id = (SELECT id FROM boards WHERE slug = 'underground' AND kind = 'category')
  WHERE slug IN ('medical-training', 'chemistry-criminology');
-- Advanced Encryption, Communication and Relay -> Second Floor (Computer Labs)
UPDATE boards SET parent_id = (SELECT id FROM boards WHERE slug = 'second-floor' AND kind = 'category')
  WHERE slug IN ('advanced-encryption', 'communication-relay');
-- Research and Development -> Second Floor (Science Labs)
UPDATE boards SET parent_id = (SELECT id FROM boards WHERE slug = 'second-floor' AND kind = 'category')
  WHERE slug = 'research-development';
-- Covert Operations, Team Operations, Interrogation, Protection and Enforcement,
-- Seduction/Influence -> Third Floor (Classrooms/Armory)
UPDATE boards SET parent_id = (SELECT id FROM boards WHERE slug = 'third-floor' AND kind = 'category')
  WHERE slug IN ('covert-operations', 'team-operations', 'interrogation', 'protection-enforcement', 'seduction-influence-tactics');
-- Linguistics, Disguise -> First Floor (general classes)
UPDATE boards SET parent_id = (SELECT id FROM boards WHERE slug = 'first-floor' AND kind = 'category')
  WHERE slug IN ('linguistics-culture-assimilation', 'disguise-identity-management');
-- Survival and Navigation, Drivers Ed -> Grounds (driving track / outdoors)
UPDATE boards SET parent_id = (SELECT id FROM boards WHERE slug = 'grounds' AND kind = 'category')
  WHERE slug IN ('survival-navigation', 'drivers-ed');

-- Finally, remove the now-empty standalone Training category.
DELETE FROM boards WHERE slug = 'training';
