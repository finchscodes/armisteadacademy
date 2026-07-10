-- Corrected version of 34-weapon-handling-class.sql for databases where
-- classes are spread across location categories rather than one central
-- "Training" category.
--
-- Replace PICK_A_SLUG below with the category_slug you want Weapon Handling
-- to live under (e.g. 'grounds', 'second-floor') — check the category_slug
-- column from the query you just ran for the exact value.

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'class', id, 'Weapon Handling', 'weapon-handling',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE parent_id = c.id)
FROM boards c
WHERE c.slug = 'PICK_A_SLUG' AND c.kind = 'category'
ON CONFLICT DO NOTHING;

-- Confirm it worked:
select id, name, slug, parent_id from boards where slug = 'weapon-handling';
