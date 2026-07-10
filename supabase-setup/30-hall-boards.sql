-- Run this in Supabase's SQL Editor after 29-houses-and-reputation.sql,
-- as its own separate query.
-- Adds a "Halls" category with four article boards, each exclusive to its
-- hall — Head Staff/management and that hall's own Resident Advisor
-- (field_agent job) can post; only members of that hall (or admin) can
-- see the board at all.

INSERT INTO boards (kind, name, slug, position)
VALUES ('category', 'Halls', 'halls',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE kind = 'category'))
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, extra_article_job, restricted_to_hall, position)
SELECT 'article', id, 'Undercroft Hall', 'undercroft-hall', 'field_agent', 'undercroft', 0
FROM boards WHERE slug = 'halls' AND kind = 'category'
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, extra_article_job, restricted_to_hall, position)
SELECT 'article', id, 'Veil Hall', 'veil-hall', 'field_agent', 'veil', 1
FROM boards WHERE slug = 'halls' AND kind = 'category'
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, extra_article_job, restricted_to_hall, position)
SELECT 'article', id, 'Rampart Hall', 'rampart-hall', 'field_agent', 'rampart', 2
FROM boards WHERE slug = 'halls' AND kind = 'category'
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, extra_article_job, restricted_to_hall, position)
SELECT 'article', id, 'Eaves Hall', 'eaves-hall', 'field_agent', 'eaves', 3
FROM boards WHERE slug = 'halls' AND kind = 'category'
ON CONFLICT DO NOTHING;
