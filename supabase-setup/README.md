# Supabase SQL setup — what to run

These files are meant for Supabase's SQL Editor (no CLI needed). Because the
schema evolved incrementally over several updates, which files you need
depends on whether you're starting fresh or already have a database.

## Fresh install (brand new Supabase project)

Run, in order:
1. `01-schema.sql` — full schema, includes everything through the grading
   overhaul and job titles
2. `02-seed.sql` — an admin login + a starter shop
3. `05-storage-bucket.sql` — storage bucket for faceclaim uploads
4. `06-armistead-boards.sql` — the full Armistead board structure
5. `08-new-classes.sql` — the 18-class Training category (skip the DELETE
   statements at the top of this file on a fresh install — there's nothing
   to delete yet)
6. `09-jobs-admin-classes-into-areas.sql` — re-homes classes into their area
   categories (skip the DELETE statements at the top on a fresh install)
7. `13-merge-covert-team-operations.sql` — merges two classes into one

Skip `03`, `04`, `07`, `10`, `12` — those are incremental updates already
folded into `01` for a fresh install. Running them after `01` will error
(trying to add things that already exist).

## Already had this running before this update

If you already ran everything through `11`, you need two new files, in order:
1. `12-grading-overhaul-and-job-titles.sql` — the new multi-grader consensus
   grading system, lesson reordering, account deletion, and job titles. Safe
   to run — any in-progress (claimed) submissions just re-queue under the
   new system rather than being lost.
2. `13-merge-covert-team-operations.sql` — merges the Covert Operations and
   Team Operations classes into one. Any lessons on either move to the
   surviving board first, so nothing is lost.

## File reference

| File | What it does |
|---|---|
| `01-schema.sql` | Full schema (fresh installs only) |
| `02-seed.sql` | Admin account, starter shop |
| `03`–`11` | (historical) incremental updates, all folded into `01` |
| `12-grading-overhaul-and-job-titles.sql` | Multi-grader grading, lesson reorder, account delete, job titles |
| `13-merge-covert-team-operations.sql` | Merges two classes into one |
