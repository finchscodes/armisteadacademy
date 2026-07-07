-- Run this AFTER 01-schema.sql, in the same Supabase SQL Editor.
-- Creates: a staff login, starter categories/boards, and a starter shop.

-- Staff account. Username: professor  Password: changeme123
-- (This is a bcrypt hash of "changeme123" — there's no plaintext password stored
-- anywhere. Change this password once you've confirmed the site works; there's no
-- in-app change-password flow yet, so easiest is to re-run this against a fresh
-- database before you actually open the site up, or update the row directly here
-- in the SQL editor.)
INSERT INTO users (email, username, password_hash, role)
VALUES ('staff@ashbourne.local', 'professor', '$2b$10$BGUw8Nzf0K1kp5k1Jb/8w.mNXYrGK7z5FJwWfliJEp8JuhcgRD4f.', 'staff')
ON CONFLICT (email) DO NOTHING;

-- Categories
INSERT INTO boards (kind, name, slug, position) VALUES
  ('category', 'The Grounds', 'the-grounds', 0),
  ('category', 'Academics', 'academics', 1);

-- Boards under "The Grounds"
INSERT INTO boards (kind, parent_id, name, slug, description, position)
SELECT 'board', id, 'The Dining Hall', 'dining-hall', 'Open roleplay — meals, announcements, general mingling.', 0
FROM boards WHERE slug = 'the-grounds';

INSERT INTO boards (kind, parent_id, name, slug, description, position)
SELECT 'board', id, 'Common Rooms', 'common-rooms', 'House-specific threads.', 1
FROM boards WHERE slug = 'the-grounds';

-- Class boards under "Academics"
INSERT INTO boards (kind, parent_id, name, slug, description, position)
SELECT 'class', id, 'Introductory Botany', 'intro-botany', 'Lessons and homework for first-year Botany.', 0
FROM boards WHERE slug = 'academics';

INSERT INTO boards (kind, parent_id, name, slug, description, position)
SELECT 'class', id, 'Basic Spellcraft', 'basic-spellcraft', 'Lessons and homework for first-year Spellcraft.', 1
FROM boards WHERE slug = 'academics';

-- Starter shop
INSERT INTO shops (name, slug, description)
VALUES ('The General Store', 'general-store', 'Everyday supplies, sweets, and oddities.');

INSERT INTO items (shop_id, name, description, price, stock)
SELECT id, 'Quill & Ink Set', NULL, 8, NULL FROM shops WHERE slug = 'general-store';

INSERT INTO items (shop_id, name, description, price, stock)
SELECT id, 'Sugar Toad Sweet', NULL, 3, NULL FROM shops WHERE slug = 'general-store';

INSERT INTO items (shop_id, name, description, price, stock)
SELECT id, 'Second-hand Spellbook', NULL, 15, 20 FROM shops WHERE slug = 'general-store';
