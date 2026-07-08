# Armistead Academy — forum RPG

A from-scratch spy-academy forum roleplay: characters, boards/threads/posts, XP/levels,
auto-computed year progression, pets, faceclaim uploads, a lesson/homework/peer-grading
loop, a site-wide feed, a live chat, a job list, and an admin dashboard.

## Stack

Next.js 16 (App Router, Server Actions) + TypeScript, Postgres via Drizzle ORM,
Supabase Storage for uploads, Tailwind v4, hand-rolled auth.

## Key concepts (as of the latest update)

**Jobs live on characters, not accounts.** Each character has a `job` (Spymaster,
Instructor, Enforcer, etc — see `src/lib/roles.ts`) that colors their name in chat and
on the Job List. The Job List shows the *character* holding the job, not the account.

**Admin is an account-level flag** (`users.is_admin`), separate from jobs. Every
character on an admin's account has hidden admin access. Only admins reach `/admin`.

**Instructors are assigned to specific classes.** The `class_assignments` table links a
character to a class board; they can only post lessons to classes they're assigned to
(admins can post to any). Manage this at `/admin/classes`.

**Majors** are chosen once and then locked (admins can override). Graduate is automatic
after enough lessons; Faculty is admin-assigned only.

**Legal names** (first/middle/last) are set once at character creation and locked from
the owner's side — only admins can edit them (`/admin/users/[id]`). First + last name is
what shows in chat.

**Deleting content**: you can delete your own posts/threads (admins can delete anyone's).
Deleting a thread's opening post deletes the whole thread.

## Styling it yourself

See `STYLING.md` — most of the look is controlled by a handful of color variables in
`src/app/globals.css`. You can recolor the whole site without touching component code.

## Setup / applying updates

See `supabase-setup/README.md` for exactly which SQL files to run (fresh install vs.
upgrade). For the latest update specifically, run
`supabase-setup/09-jobs-admin-classes-into-areas.sql`.

Environment variables (all set in Vercel): `DATABASE_URL`, `SESSION_SECRET`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Still deferred

- Rich HTML/CSS editor for lessons, bios, and articles + community articles board with
  likes/comments (needs a sanitizer for safety — its own dedicated pass)
- Shops UI (schema exists)
- Multi-room chat, vitals (hunger/thirst), tiered currency — noted from the WoP
  reference, not yet built
