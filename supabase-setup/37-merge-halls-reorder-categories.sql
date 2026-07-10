-- Merges the Halls category into Dormitories (hall boards inserted before
-- the existing Dormitories boards), then reorders Inside Armistead's
-- categories so the grid packs cleanly: Dormitories, First Floor, Second
-- Floor, Third Floor, Grounds, Underground fill row one; Communications
-- lands directly under Dormitories in row two.

-- 1. Make room at the front of Dormitories' board list
UPDATE boards
SET position = position + 4
WHERE parent_id = (SELECT id FROM boards WHERE slug = 'dormitories' AND kind = 'category');

-- 2. Move the four hall boards into Dormitories, at the front
UPDATE boards SET parent_id = (SELECT id FROM boards WHERE slug = 'dormitories' AND kind = 'category'), position = 0 WHERE slug = 'undercroft-hall';
UPDATE boards SET parent_id = (SELECT id FROM boards WHERE slug = 'dormitories' AND kind = 'category'), position = 1 WHERE slug = 'veil-hall';
UPDATE boards SET parent_id = (SELECT id FROM boards WHERE slug = 'dormitories' AND kind = 'category'), position = 2 WHERE slug = 'rampart-hall';
UPDATE boards SET parent_id = (SELECT id FROM boards WHERE slug = 'dormitories' AND kind = 'category'), position = 3 WHERE slug = 'eaves-hall';

-- 3. Delete the now-empty Halls category
DELETE FROM boards WHERE slug = 'halls' AND kind = 'category';

-- 4. Reorder the remaining categories
UPDATE boards SET position = 0 WHERE slug = 'dormitories' AND kind = 'category';
UPDATE boards SET position = 1 WHERE slug = 'first-floor' AND kind = 'category';
UPDATE boards SET position = 2 WHERE slug = 'second-floor' AND kind = 'category';
UPDATE boards SET position = 3 WHERE slug = 'third-floor' AND kind = 'category';
UPDATE boards SET position = 4 WHERE slug = 'grounds' AND kind = 'category';
UPDATE boards SET position = 5 WHERE slug = 'underground' AND kind = 'category';
UPDATE boards SET position = 6 WHERE slug = 'communications' AND kind = 'category';
UPDATE boards SET position = 7 WHERE slug = 'outside-armistead' AND kind = 'category';

-- Confirm the result:
select b.name, b.slug, b.position, p.name as category_name
from boards b
left join boards p on b.parent_id = p.id
where b.slug in ('undercroft-hall', 'veil-hall', 'rampart-hall', 'eaves-hall')
order by b.position;

select name, slug, position from boards where kind = 'category' order by position;
