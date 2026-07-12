-- Run this in Supabase's SQL Editor after 50-reorder-mobile-categories.sql.
-- Armistead Weekly and Inside Ploy are now scoped to Chief Editor instead
-- of Writer — a Chief Editor has posting rights on their own board, same
-- mechanism as Writer, just without any management/hiring power.

UPDATE boards SET extra_article_job = 'chief_editor' WHERE slug IN ('armistead-weekly', 'inside-ploy');

-- Confirm the result:
select name, slug, extra_article_job from boards where slug IN ('armistead-weekly', 'inside-ploy');
