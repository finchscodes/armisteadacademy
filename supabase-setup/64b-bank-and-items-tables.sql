-- Run this in Supabase's SQL Editor after 64-shop-and-bank-board-kinds.sql.

CREATE TABLE "bank_ledger" (
  "id" serial PRIMARY KEY,
  "character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "amount" integer NOT NULL,
  "reason" "ledger_reason" NOT NULL,
  "note" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Clear the old placeholder shop data — the real shops get seeded fresh
-- against the new board-based structure in the next migration.
DELETE FROM "inventory";
DELETE FROM "items";
ALTER TABLE "items" DROP COLUMN "shop_id";
DROP TABLE "shops";

ALTER TABLE "items" ADD COLUMN "board_id" integer NOT NULL REFERENCES "boards"("id") ON DELETE CASCADE;
ALTER TABLE "items" ADD COLUMN "position" integer NOT NULL DEFAULT 0;
