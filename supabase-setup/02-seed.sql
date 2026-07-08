-- Run this AFTER 01-schema.sql, in the same Supabase SQL Editor.
-- Creates: an instructor login and a starter shop.
-- For the full Armistead board structure, also run 06-armistead-boards.sql
-- and 08-new-classes.sql after this.

-- Instructor account. Username: professor  Password: changeme123
-- (This is a bcrypt hash of "changeme123" — there's no plaintext password stored
-- anywhere. Change this password once you've confirmed the site works; there's no
-- in-app change-password flow yet, so easiest is to re-run this against a fresh
-- database before you actually open the site up, or update the row directly here
-- in the SQL editor.)
INSERT INTO users (email, username, password_hash, role)
VALUES ('instructor@armistead.local', 'professor', '$2b$10$BGUw8Nzf0K1kp5k1Jb/8w.mNXYrGK7z5FJwWfliJEp8JuhcgRD4f.', 'instructor')
ON CONFLICT (email) DO NOTHING;

-- Starter shop
INSERT INTO shops (name, slug, description)
VALUES ('The General Store', 'general-store', 'Everyday supplies and oddities.');

INSERT INTO items (shop_id, name, description, price, stock)
SELECT id, 'Field Notebook', NULL, 8, NULL FROM shops WHERE slug = 'general-store';

INSERT INTO items (shop_id, name, description, price, stock)
SELECT id, 'Coffee', NULL, 3, NULL FROM shops WHERE slug = 'general-store';

INSERT INTO items (shop_id, name, description, price, stock)
SELECT id, 'Second-hand Field Manual', NULL, 15, 20 FROM shops WHERE slug = 'general-store';
