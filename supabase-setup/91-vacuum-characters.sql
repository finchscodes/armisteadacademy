-- Run this in Supabase's SQL Editor. This is a maintenance command, not a
-- schema change — it doesn't need to run in any particular order relative
-- to the other numbered migrations, just run it once now.
--
-- The characters table has been receiving a database write on nearly
-- every page load, for every logged-in user, since hunger/thirst was
-- first built (fixed in the last code change — that stops it going
-- forward). Postgres doesn't update rows in place; every UPDATE leaves
-- behind a dead row version that has to be cleaned up. That much sustained
-- write volume, for that long, means this table is very likely bloated —
-- physically larger than it needs to be, full of dead versions — which
-- can keep queries slow even with a correct index sitting right on top,
-- and can also mean the query planner's statistics are stale enough that
-- it isn't trusting the new indexes to begin with.
--
-- VACUUM ANALYZE reclaims that dead space and refreshes the statistics
-- the planner uses to decide whether to use an index. It does not lock
-- the table against reads or writes (that's VACUUM FULL, which is more
-- aggressive and not needed here) — safe to run on a live site.

VACUUM ANALYZE "characters";
VACUUM ANALYZE "threads";
VACUUM ANALYZE "posts";
VACUUM ANALYZE "chat_messages";
