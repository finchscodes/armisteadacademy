import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characterStatuses } from "@/db/schema";

export async function getStatusesForCharacter(characterId: number) {
  return db.select().from(characterStatuses).where(eq(characterStatuses.characterId, characterId));
}
