-- Merges the "Covert Operations" and "Team Operations" classes into one:
-- "Covert & Team Operations". Any lessons on either board move to the
-- surviving (renamed) board first, so nothing is lost.

-- Move any lessons from Covert Operations onto Team Operations before it's renamed.
UPDATE lessons SET board_id = (SELECT id FROM boards WHERE slug = 'team-operations')
WHERE board_id = (SELECT id FROM boards WHERE slug = 'covert-operations');

-- Rename Team Operations into the merged class.
UPDATE boards SET name = 'Covert & Team Operations', slug = 'covert-team-operations'
WHERE slug = 'team-operations';

-- Remove the now-empty Covert Operations board.
DELETE FROM boards WHERE slug = 'covert-operations';
