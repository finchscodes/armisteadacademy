-- Run this in Supabase's SQL Editor after 42-wall-posts.sql.
-- Adds a notification type for wall posts — you get notified when someone
-- else posts on your wall, not when you post on your own.

ALTER TYPE "public"."notification_type" ADD VALUE 'wall_post';