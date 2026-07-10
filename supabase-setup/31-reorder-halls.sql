-- Run this in Supabase's SQL Editor after 30-hall-boards.sql.
-- Moves the "Halls" category to sit right after "Dormitories" in the nav,
-- instead of at the end. Every other category keeps its existing relative
-- order.

WITH ordered AS (
  SELECT id,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE slug
          WHEN 'dormitories' THEN 0
          WHEN 'halls' THEN 1
          ELSE 2
        END,
        position
    ) - 1 AS new_position
  FROM boards
  WHERE kind = 'category'
)
UPDATE boards
SET position = ordered.new_position
FROM ordered
WHERE boards.id = ordered.id;
