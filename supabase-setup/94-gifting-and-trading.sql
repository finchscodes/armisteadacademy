-- Run this in Supabase's SQL Editor after 93-create-privacy-policy-table.sql.
--
-- Arsenal item trading. Creating a new type + table together is fine in
-- one transaction; the notification type additions for this feature are
-- in separate standalone files (94b, 94c) since altering an *existing*
-- enum can't run in the same transaction as other DDL.

CREATE TYPE "trade_status" AS ENUM ('awaiting_offer', 'awaiting_approval', 'accepted', 'rejected');

CREATE TABLE "trades" (
  "id" serial PRIMARY KEY,
  "initiator_character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "initiator_item_id" integer NOT NULL REFERENCES "items"("id") ON DELETE RESTRICT,
  "recipient_character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "recipient_item_id" integer REFERENCES "items"("id") ON DELETE RESTRICT,
  "status" "trade_status" NOT NULL DEFAULT 'awaiting_offer',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "trades_initiator_character_id_idx" ON "trades" ("initiator_character_id");
CREATE INDEX "trades_recipient_character_id_idx" ON "trades" ("recipient_character_id");
