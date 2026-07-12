-- Run this in Supabase's SQL Editor after 49-regenerate-character-slugs.sql.
--
-- The mobile nav shows every category in one combined row, ordered by
-- position — unlike desktop, where Inside/Outside Armistead are separate
-- menus and their relative position doesn't matter. This swaps just these
-- two categories' positions so Communications ends up last (rightmost) on
-- mobile, with Outside Armistead right before it. This has no effect on
-- the desktop "Inside Armistead" grid, since Outside Armistead is excluded
-- from it regardless of position.

UPDATE boards SET position = 6 WHERE slug = 'outside-armistead' AND kind = 'category';
UPDATE boards SET position = 7 WHERE slug = 'communications' AND kind = 'category';

-- Confirm the result:
select name, slug, position from boards where kind = 'category' order by position;
