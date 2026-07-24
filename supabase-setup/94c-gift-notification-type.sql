-- Run this in Supabase's SQL Editor after 94b-trade-notification-type.sql.
-- Standalone (enum value additions can't run in the same transaction as
-- other DDL).

ALTER TYPE "notification_type" ADD VALUE 'item_gifted';
