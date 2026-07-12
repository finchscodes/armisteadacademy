-- Run this in Supabase's SQL Editor after 47-split-survival-major.sql.
-- Adds a "Physical Education" class under First Floor, right after
-- Pool/Gym/Spa.

-- Make room after Pool/Gym/Spa
UPDATE boards
SET position = position + 1
WHERE parent_id = (SELECT id FROM boards WHERE slug = 'first-floor' AND kind = 'category')
  AND position > (SELECT position FROM boards WHERE slug = 'pool-gym-spa');

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'class', t.id, 'Physical Education', 'physical-education',
  (SELECT position FROM boards WHERE slug = 'pool-gym-spa') + 1
FROM boards t
WHERE t.slug = 'first-floor' AND t.kind = 'category'
ON CONFLICT DO NOTHING;

-- Confirm the result:
select b.name, b.slug, b.position from boards b
join boards p on p.id = b.parent_id
where p.slug = 'first-floor'
order by b.position;
