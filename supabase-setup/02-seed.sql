-- Run this AFTER 01-schema.sql, in the same Supabase SQL Editor.
-- Creates: an instructor login, a couple of starter boards, and a starter shop.
-- For the full Armistead board structure, also run 06-armistead-boards.sql
-- after this.

-- Instructor account. Username: professor  Password: changeme123
-- (This is a bcrypt hash of "changeme123" — there's no plaintext password stored
-- anywhere. Change this password once you've confirmed the site works; there's no
-- in-app change-password flow yet, so easiest is to re-run this against a fresh
-- database before you actually open the site up, or update the row directly here
-- in the SQL editor.)
INSERT INTO users (email, username, password_hash, role)
VALUES ('instructor@armistead.local', 'professor', '$2b$10$BGUw8Nzf0K1kp5k1Jb/8w.mNXYrGK7z5FJwWfliJEp8JuhcgRD4f.', 'instructor')
ON CONFLICT (email) DO NOTHING;

-- A placeholder Academics category — classes get fleshed out later, this
-- just keeps the lesson/grading feature testable in the meantime.
INSERT INTO boards (kind, name, slug, position) VALUES
  ('category', 'Academics', 'academics', 100);

INSERT INTO boards (kind, parent_id, name, slug, description, position)
SELECT 'class', id, 'Field Tactics', 'field-tactics', 'Lessons and homework — placeholder class, to be replaced.', 0
FROM boards WHERE slug = 'academics';

INSERT INTO boards (kind, parent_id, name, slug, description, position)
SELECT 'class', id, 'Cryptography Basics', 'cryptography-basics', 'Lessons and homework — placeholder class, to be replaced.', 1
FROM boards WHERE slug = 'academics';

-- Starter shop
INSERT INTO shops (name, slug, description)
VALUES ('The General Store', 'general-store', 'Everyday supplies and oddities.');

INSERT INTO items (shop_id, name, description, price, stock)
SELECT id, 'Field Notebook', NULL, 8, NULL FROM shops WHERE slug = 'general-store';

INSERT INTO items (shop_id, name, description, price, stock)
SELECT id, 'Coffee', NULL, 3, NULL FROM shops WHERE slug = 'general-store';

INSERT INTO items (shop_id, name, description, price, stock)
SELECT id, 'Second-hand Field Manual', NULL, 15, 20 FROM shops WHERE slug = 'general-store';
