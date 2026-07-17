-- Run this in Supabase's SQL Editor after 69-resident-advisor-rename.sql.
--
-- Seeds a "Records" board under Outside Armistead — where the system posts
-- automatic entries (sorted into a hall, leveled up) for each character.
-- Each character gets one thread here, titled with their name; new events
-- add posts to that same thread rather than creating a new one each time.
-- See lib/records.ts.

INSERT INTO boards (kind, name, slug, description, position, parent_id)
SELECT
  'board',
  'Records',
  'records',
  'Automatic entries — sorted into a hall, leveled up. One thread per character.',
  (SELECT COALESCE(MAX(position), 0) + 1 FROM boards WHERE parent_id = (SELECT id FROM boards WHERE slug = 'outside-armistead' AND kind = 'category')),
  (SELECT id FROM boards WHERE slug = 'outside-armistead' AND kind = 'category')
WHERE NOT EXISTS (SELECT 1 FROM boards WHERE slug = 'records');
