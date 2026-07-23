-- Run this in Supabase's SQL Editor after 86c-mission-notification-type.sql.
--
-- The site has never had indexes beyond a handful of unique constraints —
-- every lookup by slug, every board/thread join, every character-scoped
-- query has been doing a full table scan since day one. This was
-- masked while the tables were small; it stopped being masked recently,
-- causing the "canceling statement due to statement timeout" errors
-- (Postgres error 57014) seen after the last deploy.
--
-- These add indexes to the columns actually driving that: things queried
-- on every single page load (characters.user_id via getCurrentUser,
-- boards.parent_id via the nav tree, notifications.character_id via the
-- bell) and things queried on every board/thread/profile page specifically
-- (slugs, thread->board joins, post->thread joins).
--
-- Note: CREATE INDEX briefly locks its table while building. For tables
-- this size that should be well under a second each, but if you'd rather
-- avoid any lock at all, each line below can be run individually with
-- CONCURRENTLY added after INDEX (that variant can't run inside a
-- transaction block, so it needs to be one statement at a time rather
-- than pasted as a block).

CREATE UNIQUE INDEX "threads_slug_idx" ON "threads" ("slug");
CREATE INDEX "threads_board_id_idx" ON "threads" ("board_id");
CREATE INDEX "threads_created_at_idx" ON "threads" ("created_at");
CREATE INDEX "threads_character_id_idx" ON "threads" ("character_id");

CREATE INDEX "posts_thread_id_idx" ON "posts" ("thread_id");
CREATE INDEX "posts_character_id_idx" ON "posts" ("character_id");

CREATE INDEX "characters_user_id_idx" ON "characters" ("user_id");

CREATE INDEX "boards_parent_id_idx" ON "boards" ("parent_id");
CREATE INDEX "boards_kind_idx" ON "boards" ("kind");

CREATE INDEX "notifications_character_id_idx" ON "notifications" ("character_id");

CREATE INDEX "wall_posts_wall_character_id_idx" ON "wall_posts" ("wall_character_id");
CREATE INDEX "wall_posts_created_at_idx" ON "wall_posts" ("created_at");
