import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getActiveCharacterId, getSession, setActiveCharacterId, type SessionPayload } from "@/lib/auth";

export async function requireSessionAndCharacter(): Promise<{
  session: SessionPayload;
  characterId: number;
}> {
  const session = await getSession();
  if (!session) redirect("/login");

  const myCharacters = await db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.userId, session.userId));

  if (myCharacters.length === 0) {
    redirect("/characters");
  }

  // The cookie can be missing or stale (e.g. pointing at a character that's
  // since been deleted, or simply never set) — fall back to the user's first
  // character rather than bouncing them out. This matches what the nav bar
  // already shows as "active" (see getCurrentUser), so posting should behave
  // the same way the UI implies it will.
  const cookieCharacterId = await getActiveCharacterId();
  const valid = myCharacters.find((c) => c.id === cookieCharacterId);
  const characterId = valid ? valid.id : myCharacters[0].id;

  if (!valid) {
    await setActiveCharacterId(characterId);
  }

  return { session, characterId };
}
