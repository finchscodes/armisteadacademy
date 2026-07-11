-- Run this in Supabase's SQL Editor after 39-site-links.sql.
--
-- Adds the unified role-assignment system: job assignments can now be
-- scoped to one specific board (a class, an article board, a hall board),
-- which is what actually grants access — replacing three separate systems
-- (class assignments, article board grants, and "any field_agent in that
-- hall gets RA access automatically") with one.
--
-- IMPORTANT — this changes existing behavior for Resident Advisors:
-- previously, ANY character holding the "field_agent" job automatically got
-- posting access to their OWN hall's board, just by belonging to that hall.
-- Now, RA access requires an explicit scoped assignment (via the admin
-- job editor, picking their hall). The UPDATE below auto-migrates every
-- existing field_agent to be scoped to their own hall's board, so nobody
-- loses access they already had. Existing Instructors/Writers with
-- class-assignment or article-board grants are unaffected — those older
-- grant tables still work exactly as before, alongside the new system.

ALTER TYPE "public"."reputation_reason" ADD VALUE 'homework_graded' BEFORE 'grading';--> statement-breakpoint
ALTER TABLE "character_jobs" ADD COLUMN "scope_board_id" integer;--> statement-breakpoint
ALTER TABLE "character_jobs" ADD CONSTRAINT "character_jobs_scope_board_id_boards_id_fk" FOREIGN KEY ("scope_board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;

-- Preserve existing RA access: scope every current field_agent job holder
-- to their own hall's board.
UPDATE character_jobs cj
SET scope_board_id = b.id
FROM characters c
JOIN boards b ON b.slug = c.hall || '-hall' AND b.kind = 'article'
WHERE cj.character_id = c.id
  AND cj.job = 'field_agent'
  AND cj.scope_board_id IS NULL
  AND c.hall IS NOT NULL;

-- Confirm the result:
select cj.job, c.first_name, c.last_name, c.hall, b.name as scoped_to
from character_jobs cj
join characters c on c.id = cj.character_id
left join boards b on b.id = cj.scope_board_id
where cj.job = 'field_agent';