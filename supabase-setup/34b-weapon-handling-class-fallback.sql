-- Fallback version of 34-weapon-handling-class.sql — locates the classes
-- category by finding whichever category already contains "General
-- Education" (present in every install), instead of assuming its slug is
-- "training". Use this if 34-weapon-handling-class.sql silently did nothing.

INSERT INTO boards (kind, parent_id, name, slug, position)
SELECT 'class', ge.parent_id, 'Weapon Handling', 'weapon-handling',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE parent_id = ge.parent_id)
FROM boards ge
WHERE ge.kind = 'class' AND ge.slug = 'general-education'
ON CONFLICT DO NOTHING;

-- Confirm it worked:
select id, name, slug, parent_id from boards where slug = 'weapon-handling';
