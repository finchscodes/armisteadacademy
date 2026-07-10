-- Run this in Supabase's SQL Editor after 24-online-status.sql.
-- Adds a new "Communications" category with four topic boards for
-- in-character messaging formats: Text Messages, Social Media,
-- Emails/Letters, and Phone Calls. These also appear as quick-access tiles
-- at the top of the new /social page.

INSERT INTO boards (kind, name, slug, position)
VALUES ('category', 'Communications', 'communications',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE kind = 'category'))
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', id, 'Text Messages', 'text-messages', 0
FROM boards WHERE slug = 'communications' AND kind = 'category'
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', id, 'Social Media', 'social-media', 1
FROM boards WHERE slug = 'communications' AND kind = 'category'
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', id, 'Emails/Letters', 'emails-letters', 2
FROM boards WHERE slug = 'communications' AND kind = 'category'
ON CONFLICT DO NOTHING;

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', id, 'Phone Calls', 'phone-calls', 3
FROM boards WHERE slug = 'communications' AND kind = 'category'
ON CONFLICT DO NOTHING;
