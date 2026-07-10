-- Run this in Supabase's SQL Editor after 06 and 07.
--
-- WARNING: This DELETES the old "Academics" category and its two placeholder
-- classes (Introductory Botany, Basic Spellcraft). Deleting a board cascades
-- to delete any lessons posted on it, and deleting a lesson cascades to
-- delete any submissions/grades tied to it. If you've already posted real
-- lessons or students have submitted real homework under those two boards,
-- back that up first (or just don't run the DELETE block below — comment it
-- out and manually move things instead).
--
-- Check first if anything's actually there:
--   SELECT l.title, count(s.id) as submissions
--   FROM lessons l
--   LEFT JOIN submissions s ON s.lesson_id = l.id
--   WHERE l.board_id IN (SELECT id FROM boards WHERE slug IN ('intro-botany','basic-spellcraft'))
--   GROUP BY l.title;

-- Delete the old placeholder classes and their parent category.
DELETE FROM boards WHERE slug IN ('intro-botany', 'basic-spellcraft');
DELETE FROM boards WHERE slug = 'academics';

-- New "Training" category with the real 18 classes.
WITH cat AS (
  INSERT INTO boards (kind, name, slug, position) VALUES ('category', 'Training', 'training', 20)
  ON CONFLICT (slug) DO UPDATE SET position = EXCLUDED.position
  RETURNING id
)
INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'class', cat.id, b.name, b.slug, b.position
FROM cat, (VALUES
  ('General Education', 'general-education', 0),
  ('Threat Elimination', 'threat-elimination', 1),
  ('Precise Shooting', 'precise-shooting', 2),
  ('Covert Operations', 'covert-operations', 3),
  ('Team Operations', 'team-operations', 4),
  ('Linguistics, Culture, & Assimilation', 'linguistics-culture-assimilation', 5),
  ('Disguise and Identity Management', 'disguise-identity-management', 6),
  ('Advanced Encryption', 'advanced-encryption', 7),
  ('Survival and Navigation', 'survival-navigation', 8),
  ('Communication and Relay', 'communication-relay', 9),
  ('Drivers Ed', 'drivers-ed', 10),
  ('Research and Development', 'research-development', 11),
  ('Medical Training', 'medical-training', 12),
  ('Chemistry and Criminology', 'chemistry-criminology', 13),
  ('Seduction and Influence/Manipulation Tactics', 'seduction-influence-tactics', 14),
  ('Interrogation', 'interrogation', 15),
  ('Protection and Enforcement', 'protection-enforcement', 16),
  ('Poison', 'poison', 17)
) AS b(name, slug, position)
ON CONFLICT (slug) DO NOTHING;
