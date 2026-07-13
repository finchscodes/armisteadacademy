-- Run this in Supabase's SQL Editor after 63-post-dice-rolls.sql.
--
-- Shops move from a standalone "shops" table to just being board_kind='shop'
-- boards — reuses all the existing name/description/position/reorder
-- machinery every other board already has, instead of duplicating it. Also
-- adds a "bank" board kind for the new bank feature.
--
-- Postgres requires enum value additions to run outside a transaction
-- block, so this file is standalone statements only — the rest of the
-- structural changes (bank_ledger table, items table rework) are in
-- 64b-shop-and-bank-tables.sql, which depends on these values existing.

ALTER TYPE "board_kind" ADD VALUE 'shop';
ALTER TYPE "board_kind" ADD VALUE 'bank';
ALTER TYPE "ledger_reason" ADD VALUE 'bank_deposit';
ALTER TYPE "ledger_reason" ADD VALUE 'bank_withdrawal';
ALTER TYPE "ledger_reason" ADD VALUE 'bank_interest';
