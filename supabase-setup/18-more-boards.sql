-- Run this in Supabase's SQL Editor after 17-extra-article-job.sql.
-- Adds:
--   - Armistead Weekly and Inside Ploy (article boards under First Floor,
--     Writers can post to both in addition to management)
--   - The Past, Missions, and Elsewhere (topic boards under Outside Armistead)

INSERT INTO boards (kind, parent_id, name, slug, extra_article_job, position)
SELECT 'article', id, 'Armistead Weekly', 'armistead-weekly', 'writer',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE parent_id = first_floor.id)
FROM boards first_floor
WHERE first_floor.slug = 'first-floor' AND first_floor.kind = 'category'
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, extra_article_job, position)
SELECT 'article', id, 'Inside Ploy', 'inside-ploy', 'writer',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE parent_id = first_floor.id)
FROM boards first_floor
WHERE first_floor.slug = 'first-floor' AND first_floor.kind = 'category'
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', id, 'The Past', 'the-past',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE parent_id = outside.id)
FROM boards outside
WHERE outside.slug = 'outside-armistead' AND outside.kind = 'category'
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', id, 'Missions', 'missions',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE parent_id = outside.id)
FROM boards outside
WHERE outside.slug = 'outside-armistead' AND outside.kind = 'category'
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', id, 'Elsewhere', 'elsewhere',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE parent_id = outside.id)
FROM boards outside
WHERE outside.slug = 'outside-armistead' AND outside.kind = 'category'
ON CONFLICT DO NOTHING;
