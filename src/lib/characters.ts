import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";

export async function getCharacterBySlug(slug: string) {
  const [character] = await db.select().from(characters).where(eq(characters.slug, slug));
  return character ?? null;
}
