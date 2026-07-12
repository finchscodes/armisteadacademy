# Supabase SQL setup — what to run

These files are meant for Supabase's SQL Editor (no CLI needed). Because the
schema evolved incrementally over several updates, which files you need
depends on whether you're starting fresh or already have a database.

## Fresh install (brand new Supabase project)

Run, in order:
1. `01-schema.sql` — full schema, includes everything through migration `61`
2. `02-seed.sql` — an admin login + a starter shop
3. `05-storage-bucket.sql` — storage bucket for faceclaim uploads
4. `06-armistead-boards.sql` — the full Armistead board structure
5. `08-new-classes.sql` — the 18-class Training category (skip the DELETE
   statements at the top of this file on a fresh install — there's nothing
   to delete yet)
6. `09-jobs-admin-classes-into-areas.sql` — re-homes classes into their area
   categories (skip the DELETE statements at the top on a fresh install)
7. `13-merge-covert-team-operations.sql` — merges two classes into one

Skip everything else — `03`–`59` are incremental updates already folded into
`01` for a fresh install (`03`, `04`, `07`, `10`, `12` into the original
schema snapshot; `48`–`61` appended on top of that). Running any of them
after `01` will error (trying to add/drop things that already don't exist
that way).

## Already had this running before this update

If you already ran everything through `59`, you only need these two new files, in order:
1. `60-registrar-and-handler-rename.sql`
2. `61-wall-likes-and-comments.sql`

## File reference

| File | What it does |
|---|---|
| `01-schema.sql` | Full schema through migration `61` (fresh installs only) |
| `02-seed.sql` | Admin account, starter shop |
| `03`–`47` | (historical) incremental updates, all folded into `01` |
| `48-physical-education-class.sql` | Adds Physical Education class |
| `49-regenerate-character-slugs.sql` | Profile URLs now from legal name |
| `50-reorder-mobile-categories.sql` | Mobile nav category order |
| `51-chief-editor-boards.sql` | Armistead Weekly/Inside Ploy → Chief Editor |
| `52-account-timeouts-and-email-auth.sql` | Chat timeouts move to the account (not character) level; usernames removed (email-only accounts); adds password-reset tokens |
| `53-rename-enforcer-to-student-council.sql` | Renames the `enforcer` job enum value to `student_council` |
| `54-sorting-quiz-blurb.sql` | Adds an editable intro blurb shown at the top of the sorting quiz |
| `55-phone-boards.sql` | Adds "phone" board kind — texting/call topics rendered as message bubbles |
| `56-email-boards.sql` | Adds "email" board kind — letter-style topics with a comment section |
| `57-letter-format.sql` | Adds the alternate "letter" layout (to/body/from) for email boards |
| `58-email-format-on-posts.sql` | Moves email/letter format from threads to posts — replies can now independently be an email or a letter |
| `59-prefect-and-student-council-rename.sql` | Renames the `student_council` job (formerly Enforcer) to `prefect`, and `school_board_member` to `student_council` |
| `60-registrar-and-handler-rename.sql` | Renames `gatekeeper` to `registrar`, and `operator` to `handler` |
| `61-wall-likes-and-comments.sql` | Adds likes and comments to wall posts |

