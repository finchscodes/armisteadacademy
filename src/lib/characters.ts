import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";

export async function getCharacterBySlug(slug: string) {
  const [character] = await db.select().from(characters).where(eq(characters.slug, slug));
  return character ?? null;
}

/** Every character site-wide, for the member directory (search happens client-side). */
export async function getAllCharactersDirectory() {
  return db
    .select({
      id: characters.id,
      firstName: characters.firstName,
      lastName: characters.lastName,
      name: characters.name,
      slug: characters.slug,
      avatarUrl: characters.avatarUrl,
      major: characters.major,
    })
    .from(characters)
    .orderBy(characters.firstName, characters.lastName);
}
