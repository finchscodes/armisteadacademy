-- Run this in Supabase's SQL Editor after 79-dining-hall-meal.sql.
--
-- Removes "Care for a pet" — pet food as a concept is gone, only cuddling
-- (individually or via Cuddle all) remains.

ALTER TABLE "items" DROP COLUMN IF EXISTS "pet_food_restore";
