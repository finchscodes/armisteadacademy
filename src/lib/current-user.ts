import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getActiveCharacterId, getSession } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const [myCharacters, activeCharacterId] = await Promise.all([
    db.select().from(characters).where(eq(characters.userId, session.userId)).orderBy(characters.createdAt),
    getActiveCharacterId(),
  ]);

  const activeCharacter =
    myCharacters.find((c) => c.id === activeCharacterId) ?? myCharacters[0] ?? null;

  return {
    session,
    characters: myCharacters,
    activeCharacter,
  };
}
