-- Run this in Supabase's SQL Editor after 94c-gift-notification-type.sql.

ALTER TABLE "trades" ADD COLUMN "initiator_quantity" integer NOT NULL DEFAULT 1;
ALTER TABLE "trades" ADD COLUMN "recipient_quantity" integer NOT NULL DEFAULT 1;
