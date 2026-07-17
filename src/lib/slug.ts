export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics, keeping the base letter (é -> e)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

/** Appends a short random suffix so slugs stay unique even with duplicate titles. */
export function slugifyUnique(input: string) {
  const base = slugify(input);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}
