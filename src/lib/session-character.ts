import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getActiveCharacterId, getSession, type SessionPayload } from "@/lib/auth";

export async function requireSessionAndCharacter(): Promise<{
  session: SessionPayload;
  characterId: number;
}> {
  const session = await getSession();
  if (!session) redirect("/login");

  const characterId = await getActiveCharacterId();
  if (!characterId) redirect("/characters");

  // Confirm the active character actually belongs to this user (cheap safety net
  // against a stale cookie pointing at a character that's since changed hands).
  const [character] = await db
    .select({ id: characters.id, userId: characters.userId })
    .from(characters)
    .where(eq(characters.id, characterId));

  if (!character || character.userId !== session.userId) {
    redirect("/characters");
  }

  return { session: session!, characterId: characterId! };
}
