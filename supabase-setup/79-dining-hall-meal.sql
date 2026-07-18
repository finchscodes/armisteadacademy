-- Run this in Supabase's SQL Editor after 78-pets.sql.
--
-- The Dining Hall's "Have a meal" button — +15% hunger and thirst, once
-- per real day per character.

ALTER TABLE "characters" ADD COLUMN "last_meal_at" timestamp;
