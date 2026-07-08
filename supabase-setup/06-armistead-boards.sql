-- Run this in Supabase's SQL Editor. Adds the new Armistead board structure
-- as NEW categories/boards — it does not touch or delete your existing
-- boards/threads, so nothing you've already posted is affected. Safe to run
-- once; running it twice will create duplicate boards (there's no
-- ON CONFLICT guard since board slugs aren't unique-constrained per category
-- the way seed data usually is — check the Boards dropdown before re-running).

-- Dormitories
WITH cat AS (
  INSERT INTO boards (kind, name, slug, position) VALUES ('category', 'Dormitories', 'dormitories', 10)
  RETURNING id
)
INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', cat.id, b.name, b.slug, b.position
FROM cat, (VALUES
  ('Dormitories', 'dormitories-board', 0),
  ('Student Commons', 'student-commons', 1)
) AS b(name, slug, position);

-- First Floor
WITH cat AS (
  INSERT INTO boards (kind, name, slug, position) VALUES ('category', 'First Floor', 'first-floor', 11)
  RETURNING id
)
INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', cat.id, b.name, b.slug, b.position
FROM cat, (VALUES
  ('Main Foyer', 'main-foyer', 0),
  ('Dining Hall', 'dining-hall', 1),
  ('Grand Ballroom', 'grand-ballroom', 2),
  ('Food Court', 'food-court', 3),
  ('Auditorium', 'auditorium', 4),
  ('Pool/Gym/Spa', 'pool-gym-spa', 5)
) AS b(name, slug, position);

-- Second Floor
WITH cat AS (
  INSERT INTO boards (kind, name, slug, position) VALUES ('category', 'Second Floor', 'second-floor', 12)
  RETURNING id
)
INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', cat.id, b.name, b.slug, b.position
FROM cat, (VALUES
  ('Science Labs', 'science-labs', 0),
  ('Computer Labs', 'computer-labs', 1),
  ('Library', 'library', 2),
  ('Offices', 'offices', 3),
  ('Music Room', 'music-room', 4)
) AS b(name, slug, position);

-- Third Floor
WITH cat AS (
  INSERT INTO boards (kind, name, slug, position) VALUES ('category', 'Third Floor', 'third-floor', 13)
  RETURNING id
)
INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', cat.id, b.name, b.slug, b.position
FROM cat, (VALUES
  ('Roof Top', 'roof-top', 0),
  ('Portrait Hall', 'portrait-hall', 1),
  ('Classrooms', 'classrooms', 2),
  ('Armory', 'armory', 3)
) AS b(name, slug, position);

-- Grounds
WITH cat AS (
  INSERT INTO boards (kind, name, slug, position) VALUES ('category', 'Grounds', 'grounds', 14)
  RETURNING id
)
INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', cat.id, b.name, b.slug, b.position
FROM cat, (VALUES
  ('Grounds', 'grounds-board', 0),
  ('Grounds Commons', 'grounds-commons', 1),
  ('Driving Track', 'driving-track', 2),
  ('Winifred Garden', 'winifred-garden', 3),
  ('Boathouse/Lake', 'boathouse-lake', 4),
  ('Bell Tower', 'bell-tower', 5),
  ('Spymaster Tower', 'spymaster-tower', 6)
) AS b(name, slug, position);

-- Underground
WITH cat AS (
  INSERT INTO boards (kind, name, slug, position) VALUES ('category', 'Underground', 'underground', 15)
  RETURNING id
)
INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', cat.id, b.name, b.slug, b.position
FROM cat, (VALUES
  ('Basement Level', 'basement-level', 0),
  ('Medical Bay', 'medical-bay', 1),
  ('Garage', 'garage', 2),
  ('Shooting Range', 'shooting-range', 3)
) AS b(name, slug, position);

-- Outside Armistead
WITH cat AS (
  INSERT INTO boards (kind, name, slug, position) VALUES ('category', 'Outside Armistead', 'outside-armistead', 16)
  RETURNING id
)
INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'board', cat.id, b.name, b.slug, b.position
FROM cat, (VALUES
  ('Willowbrook', 'willowbrook', 0),
  ('Sennecouche Woods', 'sennecouche-woods', 1),
  ('Abandoned Mill', 'abandoned-mill', 2)
) AS b(name, slug, position);
