# Supabase SQL setup — what to run

These files are meant for Supabase's SQL Editor (no CLI needed). Because the
schema evolved incrementally over several updates, which files you need
depends on whether you're starting fresh or already have a database.

## Fresh install (brand new Supabase project)

Run, in order:
1. `01-schema.sql` — full schema, already includes everything through the
   legal-name fields and the final job/role list
2. `02-seed.sql` — an instructor login + a starter shop
3. `05-storage-bucket.sql` — storage bucket for faceclaim uploads
4. `06-armistead-boards.sql` — the full Armistead board structure
5. `08-new-classes.sql` — the 18-class Training category (skip the DELETE
   statements at the top of this file on a fresh install — there's nothing
   to delete yet)

Skip `03`, `04`, and `07` — those are incremental updates already folded
into `01` for a fresh install. Running them after `01` will error (trying to
add things that already exist).

## Already had this running before this update

If you already ran everything through `07`, you only need the one new file:
1. `08-new-classes.sql` — removes the old placeholder classes (Introductory
   Botany, Basic Spellcraft) and adds the real 18-class Training list. Read
   the warning at the top of that file before running it — it deletes boards,
   which cascades to any lessons/submissions posted there.

If you're catching up from further back, see the previous version of this
README (or just check the file reference table below) for `06` and `07`.

## File reference

| File | What it does |
|---|---|
| `01-schema.sql` | Full schema (fresh installs only) |
| `02-seed.sql` | Instructor account, starter shop |
| `03-add-major-and-profiles.sql` | (historical) adds character major field |
| `04-chat-and-instructor-role.sql` | (historical) adds chat, instructor role |
| `05-storage-bucket.sql` | Public storage bucket for faceclaim uploads |
| `06-armistead-boards.sql` | The full Armistead board structure |
| `07-legal-name-and-new-roles.sql` | Role system overhaul + locked legal names |
| `08-new-classes.sql` | Replaces placeholder classes with the real 18-class list |
