-- Run this in Supabase's SQL Editor after 61-wall-likes-and-comments.sql.
--
-- Adds an out-of-character note field to individual posts (replies), not
-- just the thread's opening post — so anyone replying in a topic can
-- attach their own OOC alongside their in-character reply.

ALTER TABLE "posts" ADD COLUMN "ooc" text;
