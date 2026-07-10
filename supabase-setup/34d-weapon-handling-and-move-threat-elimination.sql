-- Adds Weapon Handling under Third Floor, and moves Threat Elimination
-- there too (from wherever it currently lives).

-- 1. Add Weapon Handling under Third Floor
INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'class', id, 'Weapon Handling', 'weapon-handling',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE parent_id = c.id)
FROM boards c
WHERE c.slug = 'third-floor' AND c.kind = 'category'
ON CONFLICT DO NOTHING;

-- 2. Move Threat Elimination to Third Floor
UPDATE boards
SET parent_id = (SELECT id FROM boards WHERE slug = 'third-floor' AND kind = 'category'),
    position = (
      SELECT COALESCE(MAX(position), -1) + 1
      FROM boards
      WHERE parent_id = (SELECT id FROM boards WHERE slug = 'third-floor' AND kind = 'category')
    )
WHERE slug = 'threat-elimination' AND kind = 'class';

-- Confirm both landed correctly:
select b.name, b.slug, p.name as category_name, p.slug as category_slug
from boards b
left join boards p on b.parent_id = p.id
where b.slug in ('weapon-handling', 'threat-elimination');
