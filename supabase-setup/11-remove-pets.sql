-- Run this in Supabase's SQL Editor after 10-threads-reactions-age-year.sql.
-- Removes the pets feature entirely (adopting, cuddling) — it's being scrapped.
-- This deletes any pet data that exists. If you want to keep a record of it,
-- export the `pets` table first (Table Editor -> pets -> Export).

ALTER TABLE "xp_ledger" DROP CONSTRAINT "xp_ledger_related_pet_id_pets_id_fk";
ALTER TABLE "xp_ledger" DROP COLUMN "related_pet_id";
DROP TABLE "pets" CASCADE;
