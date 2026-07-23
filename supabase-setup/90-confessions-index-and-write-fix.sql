-- Run this in Supabase's SQL Editor after 89-more-performance-indexes.sql.
--
-- Index for confessions.status — this table had none. Paired with a code
-- change (already in this delivery, no SQL needed for it): the homepage's
-- confession query no longer runs a DELETE on every single visitor's page
-- load. That cleanup now only happens when an admin visits the
-- moderation queue instead.

CREATE INDEX "confessions_status_idx" ON "confessions" ("status");
