-- Run this in Supabase's SQL Editor after 94-gifting-and-trading.sql.
-- Standalone (enum value additions can't run in the same transaction as
-- other DDL).

ALTER TYPE "notification_type" ADD VALUE 'trade_proposed';
