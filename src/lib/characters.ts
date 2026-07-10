import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getCharacterYearLabel } from "@/lib/year";

export async function getCharacterBySlug(slug: string) {
  const [character] = await db.select().from(characters).where(eq(characters.slug, slug));
  return character ?? null;
}

/** Every character site-wide, for the member directory (search happens client-side). */
export async function getAllCharactersDirectory() {
  const rows = await db
    .select({
      id: characters.id,
      firstName: characters.firstName,
      lastName: characters.lastName,
      name: characters.name,
      slug: characters.slug,
      avatarUrl: characters.avatarUrl,
      age: characters.age,
      major: characters.major,
      yearOverride: characters.yearOverride,
    })
    .from(characters)
    .orderBy(characters.firstName, characters.lastName);

  return Promise.all(
    rows.map(async (r) => ({
      ...r,
      year: await getCharacterYearLabel(r.id, r.major, r.yearOverride),
    }))
  );
}
