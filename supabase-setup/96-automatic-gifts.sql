-- Run this in Supabase's SQL Editor after 95-trade-quantities.sql.
--
-- Admin-configured automatic system gifts (e.g. birthday gifts from the
-- Spymaster). See lib/automatic-gifts.ts.

CREATE TYPE "gift_trigger" AS ENUM ('birthday');

CREATE TABLE "automatic_gift_rules" (
  "id" serial PRIMARY KEY,
  "trigger" "gift_trigger" NOT NULL,
  "item_id" integer NOT NULL REFERENCES "items"("id") ON DELETE CASCADE,
  "quantity" integer NOT NULL DEFAULT 1,
  "sender_label" varchar(100) NOT NULL DEFAULT 'The Spymaster',
  "message" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);
