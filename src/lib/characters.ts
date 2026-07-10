import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";

export async function getCharacterBySlug(slug: string) {
  const [character] = await db.select().from(characters).where(eq(characters.slug, slug));
  return character ?? null;
}

/** Minimal character list for @mention autocomplete in chat. */
export async function getAllCharactersForMentions() {
  return db
    .select({
      id: characters.id,
      firstName: characters.firstName,
      lastName: characters.lastName,
      slug: characters.slug,
    })
    .from(characters);
}
