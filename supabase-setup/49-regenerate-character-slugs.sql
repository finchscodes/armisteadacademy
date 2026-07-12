-- Run this in Supabase's SQL Editor after 48-physical-education-class.sql.
--
-- Profile URLs (/c/[slug]) are now generated from a character's legal
-- first + last name instead of their code name, so the URL doesn't change
-- just because someone updates their code name later. This regenerates
-- slugs for every character that already exists to match.
--
-- IMPORTANT: this changes every existing character's profile URL. Any
-- bookmarks, off-site links, or anything pasted elsewhere pointing at an
-- old /c/[old-slug] URL will 404 after this runs. There's no way around
-- that given what's being asked here — it's a direct trade-off of fixing
-- the underlying slug source.

UPDATE characters
SET slug = lower(
  regexp_replace(
    regexp_replace(trim(first_name || ' ' || last_name), '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
) || '-' || substr(md5(random()::text || id::text), 1, 5);

-- Confirm the result:
select id, first_name, last_name, slug from characters order by id;
