-- Run this in Supabase's SQL Editor after 77-pausable-faint-timer.sql.
--
-- Pets — individually-owned companions with their own hunger (no thirst).
-- A shop item with is_pet = true creates a pets row when purchased instead
-- of a stackable inventory entry. Regular items can be marked as pet food
-- via pet_food_restore. See lib/pets.ts.

ALTER TABLE "items" ADD COLUMN "is_pet" boolean NOT NULL DEFAULT false;
ALTER TABLE "items" ADD COLUMN "pet_food_restore" integer;

CREATE TABLE "pets" (
  "id" serial PRIMARY KEY,
  "character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "item_id" integer NOT NULL REFERENCES "items"("id") ON DELETE RESTRICT,
  "hunger" integer NOT NULL DEFAULT 100,
  "last_pet_needs_update" timestamp NOT NULL DEFAULT now(),
  "last_cuddled_at" timestamp,
  "acquired_at" timestamp NOT NULL DEFAULT now()
);
