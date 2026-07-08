# Armistead Academy — forum RPG

A from-scratch forum roleplay site: a spy academy with users, characters (locked legal
names + editable code names/faceclaims), boards/threads/posts, XP/levels, auto-computed
year progression, full pets, a lesson/homework/peer-grading loop, a site-wide activity
feed, a live sidebar chat colored by job, a job list, and an admin dashboard — all tied
into an auditable in-world economy.

## Stack

Next.js 16 (App Router, Server Actions) + TypeScript, Postgres via Drizzle ORM, Supabase
Storage for faceclaim uploads, Tailwind v4, hand-rolled auth (bcryptjs + jose).

## What's built right now

**Accounts & characters**
- Register / log in / log out, multi-character accounts with a "posting as" switcher
  (name only now — no more cramped major/job text in that dropdown)
- Character creation: a **locked legal name** (first/middle/last — set once, never
  editable again, shown publicly on the profile), a **code name** and **faceclaim**
  image/gif (both editable later), a major, and a bio
- **Character edit page** at `/c/[slug]/edit` (owner only) — code name, faceclaim,
  major, and bio can all be changed; legal name is shown but locked
- Public profile pages at `/c/[slug]`

**Jobs & roles** (`src/lib/roles.ts`)
- The old 4-role system (member/instructor/staff/admin) is gone, replaced by the full
  job list: Spymaster, Secretary, Field Agent, Head Staff, Instructor, Chief Editor,
  Assistant Instructor, Enforcer, School Board Member, Writer, Media Team, Library
  Handler, Gatekeeper, Operator — each with its own chat name color
- **Two job titles are placeholders** — the spec had "Red: [blank]" and "Yellow: Head
  Staff of ___" with no name given. I called them "Field Agent" and "Head Staff" for
  now. Tell me the real names and I'll do a quick rename (just one file + a small
  migration, not a big change).
- **Spymaster is the only role with admin dashboard access** — deliberately a
  single-person role, matching "only accessible to a specific person such as me"
- **Job List page** at `/jobs` — everyone with a job, grouped by role, linked to their
  characters
- Instructor and Assistant Instructor can post lessons

**Home page, boards, chat** — unchanged in structure from last update (feed + character
card + chat sidebar on the home page; Boards dropdown in the nav). The board structure
itself is now the full Armistead layout you specified: Dormitories, First Floor, Second
Floor, Third Floor, Grounds, Underground, Outside Armistead, each with their listed
rooms. Classes/lessons are still on a placeholder Academics category, as you said
they'd be handled later.

**Bug fix**: chat and thread posting redirecting you to `/characters` even with a
character selected — this was a real bug (see `src/lib/session-character.ts`). The nav
bar's "posting as" display had a fallback to your first character if its cookie was
ever missing or stale, but the posting code didn't have that same fallback, so the UI
and the actual posting logic disagreed. Fixed by giving posting the same fallback.

## What's NOT built yet (deferred — flagging why)

**Rich text/HTML editor for lessons, bios, and articles, plus a community "articles"
board with likes/comments.** This is a substantial separate feature — a WYSIWYG editor
library, and importantly, **accepting and rendering arbitrary rich HTML from users is a
real security risk (XSS)** if it's not paired with a proper sanitizer that strips
scripts/event handlers/etc. I don't want to wire up raw HTML rendering without that
sanitization layer in place, so this needs its own dedicated pass rather than being
bolted on quickly. Let me know when you want to tackle it and I'll scope it properly.

Also still just schema, not UI: `shops`, `items`, `inventory`.

## Getting set up / applying this update

See `supabase-setup/README.md` — it tells you exactly which SQL files to run depending
on whether this is a fresh install or you're upgrading an existing database. **For your
current site specifically, you need `06-armistead-boards.sql` and
`07-legal-name-and-new-roles.sql`** — everything else you've already run.

The `07` migration safely renames your existing roles: `staff` → `instructor`,
`admin` → `spymaster`. Nobody loses access — if you already promoted yourself to
`admin` earlier, you'll come out of this as `spymaster`, which is now the role that
actually gates the admin dashboard.

No new environment variables this time — `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` from last update are all you need.
