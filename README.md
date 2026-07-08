# Ashbourne Academy — forum RPG

A from-scratch forum roleplay site: users, characters, boards/threads/posts, an XP/level
system, an auto-computed year progression, full pets, faceclaim image uploads, a
lesson/homework/peer-grading loop, a site-wide activity feed, a live sidebar chat, and an
admin dashboard — all tied into an auditable in-world economy.

## Stack

- **Next.js 16** (App Router, Server Actions) + TypeScript
- **Postgres** via **Drizzle ORM**
- **Supabase Storage** for faceclaim image/gif uploads (server-side only, via the
  service role key — never exposed to the browser)
- **Tailwind v4** for styling, custom theme
- Auth: hand-rolled, `bcryptjs` for password hashing + `jose` for signed JWT session
  cookies

## What's built right now

**Accounts & characters**
- Register / log in / log out, multi-character accounts with a "posting as" switcher
- Character creation: code name, an uploaded faceclaim image/gif (PNG/JPG/GIF/WEBP, up
  to 5MB), a major chosen from a fixed dropdown (13 options), and a bio/backstory
- **Public profile pages** at `/c/[slug]` — anyone can view a character's major, year,
  and backstory without logging in. Character names are clickable links everywhere
  (chat, posts, threads, lessons)
- **Year is earned, not chosen** — every character starts as a 1st Year and advances
  automatically based on how many lessons they've taken (submitted homework for).
  Thresholds live in `src/lib/year.ts` (`YEAR_THRESHOLDS`) — change the numbers there to
  retune the whole progression. Faculty-major characters don't get a numeric year.

**Home page**
- A "Facebook-style" feed: your active character's card up top (level, XP, balance),
  a site-wide feed of recent posts from everyone below it, and a live chat sidebar on
  the right
- Boards and lessons moved into a **Boards dropdown** in the nav bar (also still
  browsable in full at `/boards`)

**Live chat**
- A sidebar chat, separate from in-character forum threads, polling every 4 seconds
  (`src/components/chat-sidebar.tsx`) — no websockets needed
- Sending a chat message earns the same XP as posting in a thread
- Names are colored by the sender's site role (see Roles below)

**Roles & admin dashboard**
- Four roles: `member`, `instructor`, `staff`, `admin` (`src/lib/roles.ts`)
- **Instructor** and **staff** can post lessons; instructor names show in teal and staff
  in steel-blue in chat; admin shows in claret red
- **Admin dashboard** at `/admin/users` — search users, edit their username/email/role,
  view their characters. Gated entirely server-side (`src/app/admin/layout.tsx`) to the
  `admin` role only; there's a built-in safety net stopping the last admin from
  demoting themselves with no one left to fix it
- **Nobody has the `admin` role by default** — see Getting Set Up below for how to
  make yourself the admin

**XP & levels, lessons & grading, pets, economy** — unchanged from before; see the
Roadmap section below and inline comments in `src/lib/xp.ts`, `src/lib/majors.ts` for
where to retune things.

**Schema in place, not yet wired to UI**: `shops`, `items`, `inventory`.

## Getting set up

### 1. Database (Supabase SQL Editor — no CLI needed)

Run these files, in order, in Supabase's SQL Editor:

- `supabase-setup/01-schema.sql` — full schema (skip this one if you already ran the
  original 01/02/03 files from before; instead run the incremental files below)
- `supabase-setup/02-seed.sql` — starter boards, shop, and a staff login
- `supabase-setup/04-chat-and-instructor-role.sql` — **run this if you already had the
  database set up before this update** (adds chat, drops old faceclaim/year_or_role
  columns, adds the instructor role)
- `supabase-setup/05-storage-bucket.sql` — creates the public storage bucket faceclaim
  uploads go into

### 2. Make yourself admin

Nobody has the `admin` role by default — including the seeded `professor` staff account.
After you've registered your own account on the live site, run this in Supabase's SQL
Editor (swap in your actual username):

```sql
update users set role = 'admin' where username = 'your_username_here';
```

You'll then see an **Admin** link in the nav bar.

### 3. Environment variables

```bash
cp .env.example .env
```

Fill in:
- `DATABASE_URL` — Supabase's Transaction pooler connection string
- `SESSION_SECRET` — any long random string (`openssl rand -base64 32`)
- `SUPABASE_URL` — your Supabase project URL (Project Settings → API)
- `SUPABASE_SERVICE_ROLE_KEY` — the **service_role** secret key from that same page
  (not the anon/public key — this one is server-only and must never be exposed to the
  browser; Next.js keeps it that way automatically since it has no `NEXT_PUBLIC_`
  prefix)

On Vercel, add all four as Environment Variables the same way you did before.

### 4. Local development (optional)

```bash
npm install
npm run dev
```

Other scripts: `npm run db:push`, `npm run db:generate`, `npm run db:studio`,
`npm run db:seed` — see inline comments in `package.json`.

## Project structure additions since last time

```
src/
  lib/
    year.ts              # computed year-from-lessons-taken logic
    roles.ts              # role permissions + chat name colors
    feed.ts                 # site-wide recent-posts query for the home page
    session-character.ts      # shared "require login + active character" guard
    supabase-admin.ts           # server-only Supabase client (service role key)
  actions/
    uploads.ts            # faceclaim image upload to Supabase Storage
    chat.ts                 # send/fetch sidebar chat messages
    admin.ts                  # admin-only user search/edit (double-checks role
                                 server-side on every call, not just hidden UI)
  components/
    faceclaim-upload.tsx   # image/gif upload widget with live preview
    chat-sidebar.tsx         # polling chat sidebar
    boards-dropdown.tsx        # nav dropdown for boards/lessons
    character-card.tsx           # home page character summary card
    feed-item.tsx                   # single feed post card
    edit-user-form.tsx                # admin user edit form
  app/
    admin/                 # admin dashboard (layout.tsx gates all of it)
    boards/                  # full board directory (moved off the home page)
    api/chat/messages/         # GET endpoint the chat sidebar polls
```

## Roadmap — shops

Still just schema (`shops`, `items`, `inventory`), not wired to UI. Same open question
as before: should items be purely cosmetic, or have mechanical effects?

Other things worth considering:
- Chat has no rate limit — fine for a small community, worth revisiting if spam becomes
  an issue
- No in-app change-password flow yet (DB-only, via Supabase's Table Editor)
- No character-edit page yet — faceclaim/major/bio can only be set at creation

## Deploying

Same as before: push to GitHub, import into Vercel, set the four environment variables
above, deploy.
