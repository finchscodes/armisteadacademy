-- Run this in Supabase's SQL Editor after 75-social-board-kind.sql.

ALTER TABLE "posts" ADD COLUMN "image_url" text;

CREATE TABLE "social_follows" (
  "id" serial PRIMARY KEY,
  "follower_character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "followed_thread_id" integer NOT NULL REFERENCES "threads"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("follower_character_id", "followed_thread_id")
);
