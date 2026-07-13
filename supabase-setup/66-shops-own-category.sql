-- Run this in Supabase's SQL Editor after 65-seed-shops-and-bank.sql.
--
-- Moves all the shop boards out of Outside Armistead and into their own
-- "Shops" category, so they can render as their own column(s) in the nav
-- dropdown instead of being buried in Outside Armistead's board list.
-- Bank stays in Outside Armistead — only the 16 shop-kind boards move.

WITH new_cat AS (
  INSERT INTO boards (kind, name, slug, position)
  VALUES ('category', 'Shops', 'shops', (SELECT COALESCE(MAX(position), 0) + 1 FROM boards WHERE kind = 'category'))
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
UPDATE boards
SET parent_id = new_cat.id
FROM new_cat
WHERE boards.kind = 'shop';
