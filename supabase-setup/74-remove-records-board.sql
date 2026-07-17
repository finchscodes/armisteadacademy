-- Run this in Supabase's SQL Editor after 73-board-clearance.sql.
--
-- Removes the Records board added in 70-records-board.sql — sorting and
-- level-up announcements now post to a character's own wall instead of a
-- separate topic area. Cascades to delete any threads/posts that board
-- already accumulated (boards -> threads -> posts are all ON DELETE
-- CASCADE), which is the point: nothing should be left behind.

DELETE FROM boards WHERE slug = 'records';
