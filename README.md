# Ashbourne Academy — forum RPG

A from-scratch forum roleplay site: users, characters, boards/threads/posts, an XP/level
system, a full pet system, and a lesson/homework/peer-grading loop tied into an
auditable in-world economy.

## Stack

- **Next.js 16** (App Router, Server Actions) + TypeScript
- **Postgres** via **Drizzle ORM** (no Prisma — avoids a native-binary dependency, and
  Drizzle is a great fit for serverless Postgres hosts like Neon/Supabase)
- **Tailwind v4** for styling, custom theme (no default AI-template look)
- Auth: hand-rolled, `bcryptjs` for password hashing + `jose` for signed JWT session
  cookies (no third-party auth service)

## What's built right now

**Accounts & characters**
- Register / log in / log out
- Multi-character accounts (one login, many characters), with a "posting as" switcher
  in the nav bar

**Forum**
- Categories -> boards -> threads -> posts, with pinned/locked thread support wired in
- Class-kind boards additionally list lessons (see below)

**XP & levels**
- Every character has a level, derived from an XP ledger (never a raw stored number —
  same audit-trail principle as the currency ledger, so nothing can silently drift)
- XP is awarded for: posting in a thread, submitting homework, grading homework, and
  cuddling a pet — amounts are one constant each in `src/lib/xp.ts` (`XP_AWARDS`)
- The curve is *increasing*: each level takes more XP than the last (level 1->2 needs
  100 XP, 2->3 needs 200, 3->4 needs 300, ...). Retune the whole curve by changing
  `XP_BASE` in `src/lib/xp.ts`
- **Grading is gated at level 3** (`GRADING_LEVEL_REQUIREMENT` in `src/db/schema.ts`) —
  enforced both in the UI (the claim button is hidden below level 3) and again inside
  the server action itself, so it can't be bypassed with a crafted request

**Lessons & grading**
- Staff/admin can post a lesson on any class-kind board (prompt + reward range + grader
  fee)
- Any character can submit one homework response per lesson
- Once level 3+, a character can claim an *open* submission (not their own) to grade —
  claiming locks it so nobody else grades the same one
- Grading it awards the student galleons (scaled by grade, between the lesson's
  min/max reward) and pays the grader a flat fee, plus XP to the grader
- A public gradebook shows completed grades per lesson

**Pets**
- Adopt a pet (name, species, bio)
- "Cuddle" a pet for XP, on an 8-hour cooldown per pet (`CUDDLE_COOLDOWN_MS` in
  `src/actions/pets.ts`)

**Economy**
- Every character starts with a galleon balance
- Balances (both currency and XP) are always the *sum of a ledger*, never a stored
  counter — every credit/debit is its own row, so you get a full history for free and
  balances can't drift out of sync with reality

**Schema in place, not yet wired to UI**: `shops`, `items`, `inventory` — see Roadmap.

## Getting set up

You'll need a Postgres database. Easiest options: a free [Neon](https://neon.tech) or
[Supabase](https://supabase.com) project (both give you a `DATABASE_URL` instantly), or
Postgres running locally / in Docker.

### Option A: no local install (Supabase SQL editor + GitHub web + Vercel)

If you don't want to install Node/Git on your machine at all, see
`supabase-setup/` — it has the schema and seed data as plain `.sql` files you paste
directly into Supabase's SQL Editor, no CLI required. Combine that with uploading this
folder to GitHub through the browser and importing the repo in Vercel, and the whole
thing goes live without touching a terminal.

### Option B: local development

```bash
npm install
cp .env.example .env
# edit .env: paste your DATABASE_URL, and generate a SESSION_SECRET with:
#   openssl rand -base64 32

npm run db:push    # creates all tables from src/db/schema.ts
npm run db:seed    # starter categories/boards/shop + a staff account

npm run dev         # http://localhost:3000
```

The seed script creates a staff login so you can immediately test posting a lesson:
`professor` / `changeme123` — change that password once you've confirmed things work
(there's no in-app change-password flow yet, so do it directly in the DB via
`npm run db:studio`, or just re-seed against a fresh database before going live).

Other useful scripts:

- `npm run db:studio` — opens Drizzle Studio, a GUI for browsing/editing your DB
- `npm run db:generate` — after editing `src/db/schema.ts`, generates a SQL migration
  file in `drizzle/` (use this instead of `db:push` once you have real data you don't
  want to risk with a schema diff)

## Project structure

```
src/
  db/
    schema.ts        # every table lives here — the source of truth
    index.ts          # Drizzle client
    seed.ts            # starter data
  lib/
    auth.ts            # password hashing + session cookies
    current-user.ts    # fetch logged-in user + their characters
    economy.ts          # galleon-balance-from-ledger helper
    xp.ts                # XP curve, level calculation, grading eligibility
    forum.ts              # board tree / thread / post queries
    lessons.ts              # lesson detail + categorized submissions
    slug.ts
  actions/               # Server Actions (the only way data gets written)
    auth.ts
    characters.ts
    forum.ts               # awards chat-post XP
    lessons.ts               # create/submit/claim/grade, level-gate enforced here
    pets.ts                    # adopt/cuddle, awards pet-cuddle XP
  components/
  app/
    page.tsx             # board directory (home)
    b/[slug]/             # board view (+ lessons list for class boards) + new-thread form
    t/[slug]/               # thread view + reply form
    lesson/[id]/              # lesson detail: submit, claim, grade, gradebook
    lesson/new/                 # staff-only: post a lesson
    pets/                         # pet list, adopt, pet profile + cuddle
    characters/                     # character list + creation
    login/ register/
```

## Roadmap — shops

The schema already exists (`shops`, `items`, `inventory` in `src/db/schema.ts`):

- A shop page listing items with price/stock
- A purchase action that debits the buyer's galleon ledger and inserts an `inventory`
  row
- Worth deciding before building it out: should items be purely cosmetic/flavor, or
  have mechanical effects? That changes how `items` needs to be modeled (e.g. an
  `effect` field) — flag it if you want that now.

Other things worth considering as this grows:
- A reputation/approval layer on top of the level-3 grading gate, if you want to guard
  against alt accounts farming each other
- Rate-limiting chat-post XP (right now every post awards XP with no cooldown — fine
  for a small community, worth revisiting if spam becomes an issue)
- A change-password flow (currently DB-only)

## Deploying

This app has no server-side state outside Postgres, so it deploys cleanly to Vercel (or
any Node host). Point `DATABASE_URL` at a hosted Postgres instance (Neon/Supabase both
have generous free tiers and work well with serverless functions), set `SESSION_SECRET`,
and `npm run build && npm run start` — or just connect the repo to Vercel directly.
