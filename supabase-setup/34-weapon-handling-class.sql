-- Run this in Supabase's SQL Editor after 32-class-enrollment-and-flat-reward.sql.
-- Adds a new "Weapon Handling" class board under the Training category.

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'class', id, 'Weapon Handling', 'weapon-handling',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE parent_id = t.id)
FROM boards t
WHERE t.slug = 'training' AND t.kind = 'category'
ON CONFLICT DO NOTHING;
