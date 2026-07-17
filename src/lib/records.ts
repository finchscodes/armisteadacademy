import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { boards, threads, posts, characters } from "@/db/schema";
import { slugifyUnique } from "@/lib/slug";

async function getRecordsBoardId(): Promise<number | null> {
  const [board] = await db.select({ id: boards.id }).from(boards).where(eq(boards.slug, "records"));
  return board?.id ?? null;
}

/**
 * Adds an automatic entry (sorted into a hall, leveled up, ...) to a
 * character's Records thread — one thread per character, title == their
 * name, created on first use so the very first entry becomes the actual
 * opening post of the thread ("the first post a character makes").
 * Fails quietly if the Records board hasn't been created yet.
 */
export async function addRecordsEntry(characterId: number, content: string): Promise<void> {
  const boardId = await getRecordsBoardId();
  if (!boardId) return;

  const [character] = await db
    .select({ userId: characters.userId, name: characters.name })
    .from(characters)
    .where(eq(characters.id, characterId));
  if (!character) return;

  const html = `<p>${content}</p>`;

  const [existing] = await db
    .select({ id: threads.id })
    .from(threads)
    .where(and(eq(threads.boardId, boardId), eq(threads.characterId, characterId)));

  if (existing) {
    await db.insert(posts).values({
      threadId: existing.id,
      characterId,
      userId: character.userId,
      content: html,
    });
    return;
  }

  const [thread] = await db
    .insert(threads)
    .values({
      boardId,
      characterId,
      userId: character.userId,
      title: character.name,
      slug: slugifyUnique(character.name),
    })
    .returning({ id: threads.id });

  await db.insert(posts).values({
    threadId: thread.id,
    characterId,
    userId: character.userId,
    content: html,
  });
}
