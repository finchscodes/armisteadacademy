-- Run this in Supabase's SQL Editor after 37-merge-halls-reorder-categories.sql.
-- Adds an optional image field to boards — set/cleared from the admin
-- board editor, shown as a small banner on the board's own page.

ALTER TABLE "boards" ADD COLUMN "image_url" text;