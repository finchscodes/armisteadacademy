# Supabase SQL setup — what to run

These files are meant for Supabase's SQL Editor (no CLI needed). Because the
schema evolved incrementally over several updates, which files you need
depends on whether you're starting fresh or already have a database.

## Fresh install (brand new Supabase project)

Run, in order:
1. `01-schema.sql` — full schema, already includes everything through the
   legal-name fields and the final job/role list
2. `02-seed.sql` — an instructor login + a placeholder Academics category
3. `05-storage-bucket.sql` — storage bucket for faceclaim uploads
4. `06-armistead-boards.sql` — the full Armistead board structure

Skip `03`, `04`, and `07` — those are incremental updates already folded
into `01` for a fresh install. Running them after `01` will error (trying to
add things that already exist).

## Already had this running before this update

If you'd already run `01`, `02`, `03`, `04`, and `05` in previous updates,
you only need the two new files:
1. `06-armistead-boards.sql` — adds the new board structure (doesn't touch
   your existing boards/threads)
2. `07-legal-name-and-new-roles.sql` — migrates the role system and adds
   locked legal-name fields to characters. Safely maps your existing
   'staff' → 'instructor' and 'admin' → 'spymaster', so nobody loses access.

## File reference

| File | What it does |
|---|---|
| `01-schema.sql` | Full schema (fresh installs only) |
| `02-seed.sql` | Instructor account, placeholder Academics category, starter shop |
| `03-add-major-and-profiles.sql` | (historical) adds character major field |
| `04-chat-and-instructor-role.sql` | (historical) adds chat, instructor role |
| `05-storage-bucket.sql` | Public storage bucket for faceclaim uploads |
| `06-armistead-boards.sql` | The full new board structure |
| `07-legal-name-and-new-roles.sql` | Role system overhaul + locked legal names |
