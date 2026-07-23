-- Run this in Supabase's SQL Editor after 86-mission-board.sql.
--
-- The "Missions" board already exists (from 18-more-boards.sql), currently
-- as a regular topic board under Outside Armistead. This converts it to
-- the new "mission" kind and moves it to sit directly under Spymaster
-- Tower in the Grounds category, as requested.

ALTER TABLE "threads" ADD COLUMN "mission_deadline" timestamp;
ALTER TABLE "threads" ADD COLUMN "mission_max_spots" integer;

CREATE TABLE "mission_reservations" (
  "id" serial PRIMARY KEY,
  "thread_id" integer NOT NULL REFERENCES "threads"("id") ON DELETE CASCADE,
  "character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("thread_id", "character_id")
);

UPDATE boards
SET kind = 'mission',
    parent_id = (SELECT parent_id FROM boards WHERE slug = 'spymaster-tower'),
    position = (SELECT position + 1 FROM boards WHERE slug = 'spymaster-tower')
WHERE slug = 'missions';
