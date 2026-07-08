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

If you already ran everything through `08`, you only need the one new file:
1. `09-jobs-admin-classes-into-areas.sql` — moves jobs to characters, adds the
   account admin flag + class-assignment table, removes the old "The Grounds"
   category, and re-homes the class boards into their matching area categories.
   **Read the warning at the top** — it deletes some boards, which cascades to
   any threads/posts on them. Your existing admin access is preserved
   automatically (old spymaster/admin accounts become is_admin = true).

## File reference

| File | What it does |
|---|---|
| `01-schema.sql` | Full schema (fresh installs only) |
| `02-seed.sql` | Admin account, starter shop |
| `03`–`08` | (historical) incremental updates, all folded into `01` |
| `09-jobs-admin-classes-into-areas.sql` | Jobs→characters, admin flag, class assignments, board reshuffle |
