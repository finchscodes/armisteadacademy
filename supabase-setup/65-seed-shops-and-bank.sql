-- Run this in Supabase's SQL Editor after 64b-bank-and-items-tables.sql.
--
-- Adds the Bank and the 16 placeholder shops under Outside Armistead.
-- They're appended after whatever's currently last in that category —
-- drag them into your preferred order afterward from /admin/boards (e.g.
-- to put Bank directly under Elsewhere) since exact position isn't
-- something worth hand-computing here.

WITH cat AS (
  SELECT id FROM boards WHERE slug = 'outside-armistead' AND kind = 'category'
),
next_pos AS (
  SELECT COALESCE(MAX(position), -1) + 1 AS start_pos FROM boards, cat WHERE boards.parent_id = cat.id
)
INSERT INTO boards (kind, parent_id, name, slug, description, position)
SELECT b.kind, cat.id, b.name, b.slug, b.description, next_pos.start_pos + b.sort_offset
FROM cat, next_pos, (VALUES
  ('bank'::board_kind, 'Bank', 'bank', 'Store your money and earn interest on it.', 0),
  ('shop'::board_kind, 'Gun Shop', 'gun-shop', NULL, 1),
  ('shop'::board_kind, 'Knife/Melee Shop', 'knife-melee-shop', NULL, 2),
  ('shop'::board_kind, 'Food Shop', 'food-shop', NULL, 3),
  ('shop'::board_kind, 'Drink Shop', 'drink-shop', NULL, 4),
  ('shop'::board_kind, 'Clothes Shop', 'clothes-shop', NULL, 5),
  ('shop'::board_kind, 'Misc/Pawn Shop', 'misc-pawn-shop', NULL, 6),
  ('shop'::board_kind, 'Book Shop', 'book-shop', NULL, 7),
  ('shop'::board_kind, 'Pencils/Things Shop', 'pencils-things-shop', NULL, 8),
  ('shop'::board_kind, 'Pet Shop', 'pet-shop', NULL, 9),
  ('shop'::board_kind, 'Dessert/Candy Shop', 'dessert-candy-shop', NULL, 10),
  ('shop'::board_kind, 'Utility Gadgets/Poison Shop', 'utility-gadgets-poison-shop', NULL, 11),
  ('shop'::board_kind, 'Holiday Shop', 'holiday-shop', NULL, 12),
  ('shop'::board_kind, 'Mission Shop', 'mission-shop', 'Like stealth clothes.', 13),
  ('shop'::board_kind, 'Prank Shop', 'prank-shop', NULL, 14),
  ('shop'::board_kind, 'Dinner/Expensive Food Shop', 'dinner-expensive-food-shop', NULL, 15),
  ('shop'::board_kind, 'Charms/Trinket Shop', 'charms-trinket-shop', NULL, 16)
) AS b(kind, name, slug, description, sort_offset)
ON CONFLICT (slug) DO NOTHING;
