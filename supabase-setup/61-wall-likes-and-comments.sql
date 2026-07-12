-- Run this in Supabase's SQL Editor after 60-registrar-and-handler-rename.sql.
--
-- Adds likes and comments to wall posts (both the character wall page and
-- the homepage "Wall activity" feed) — previously wall posts could only be
-- created, deleted, and pinned.

CREATE TABLE "wall_post_likes" (
  "id" serial PRIMARY KEY,
  "wall_post_id" integer NOT NULL REFERENCES "wall_posts"("id") ON DELETE CASCADE,
  "character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "wall_post_likes_unique_idx" ON "wall_post_likes" ("wall_post_id", "character_id");

CREATE TABLE "wall_post_comments" (
  "id" serial PRIMARY KEY,
  "wall_post_id" integer NOT NULL REFERENCES "wall_posts"("id") ON DELETE CASCADE,
  "character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" varchar(1000) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
