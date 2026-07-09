-- Run this in Supabase's SQL Editor after 14-multi-job-support.sql.
-- Adds Notice Board and Community Board under Dormitories, as "article"
-- boards — Head Staff and up can post there by default (see
-- /admin/article-boards to grant posting rights to anyone else).

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'article', id, 'Notice Board', 'notice-board',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE parent_id = dormitories.id)
FROM boards dormitories
WHERE dormitories.slug = 'dormitories' AND dormitories.kind = 'category'
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'article', id, 'Community Board', 'community-board',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE parent_id = dormitories.id)
FROM boards dormitories
WHERE dormitories.slug = 'dormitories' AND dormitories.kind = 'category'
ON CONFLICT DO NOTHING;
