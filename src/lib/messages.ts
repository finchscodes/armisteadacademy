import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { messageThreads, messageThreadParticipants, messages, characters } from "@/db/schema";

/**
 * Marks a thread read for this character with a plain write — no
 * revalidatePath. Safe to call during a page's render (e.g. "viewing a
 * thread marks it read"), unlike the markThreadsReadAction server action,
 * which calls revalidatePath and will throw if invoked outside of an actual
 * user-triggered Server Action.
 */
export async function markThreadReadSilently(threadId: number, characterId: number) {
  await db
    .update(messageThreadParticipants)
    .set({ isRead: true })
    .where(
      and(
        eq(messageThreadParticipants.threadId, threadId),
        eq(messageThreadParticipants.characterId, characterId)
      )
    );
}

export async function getUnreadMessageCount(characterId: number): Promise<number> {
  const rows = await db
    .select({ id: messageThreadParticipants.id })
    .from(messageThreadParticipants)
    .where(
      and(
        eq(messageThreadParticipants.characterId, characterId),
        eq(messageThreadParticipants.isRead, false),
        eq(messageThreadParticipants.isDeleted, false)
      )
    );
  return rows.length;
}

/** Inbox list — every thread this character is in and hasn't deleted, newest first. */
export async function getInboxThreads(characterId: number) {
  const participation = await db
    .select()
    .from(messageThreadParticipants)
    .where(
      and(
        eq(messageThreadParticipants.characterId, characterId),
        eq(messageThreadParticipants.isDeleted, false)
      )
    );
  if (participation.length === 0) return [];

  const threadIds = participation.map((p) => p.threadId);
  const readByThread = new Map(participation.map((p) => [p.threadId, p.isRead]));

  const threads = await db
    .select()
    .from(messageThreads)
    .where(inArray(messageThreads.id, threadIds))
    .orderBy(desc(messageThreads.lastMessageAt));

  const allParticipants = await db
    .select({
      threadId: messageThreadParticipants.threadId,
      characterId: characters.id,
      characterName: characters.name,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
    })
    .from(messageThreadParticipants)
    .innerJoin(characters, eq(messageThreadParticipants.characterId, characters.id))
    .where(inArray(messageThreadParticipants.threadId, threadIds));

  const lastMessages = await db
    .select({
      threadId: messages.threadId,
      content: messages.content,
      characterId: messages.characterId,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(inArray(messages.threadId, threadIds))
    .orderBy(desc(messages.createdAt));
  const lastMessageByThread = new Map<number, (typeof lastMessages)[number]>();
  for (const m of lastMessages) {
    if (!lastMessageByThread.has(m.threadId)) lastMessageByThread.set(m.threadId, m);
  }

  return threads.map((t) => ({
    ...t,
    isRead: readByThread.get(t.id) ?? true,
    participants: allParticipants.filter((p) => p.threadId === t.id),
    lastMessage: lastMessageByThread.get(t.id) ?? null,
  }));
}

export async function getMessageThread(threadId: number, characterId: number) {
  const [participant] = await db
    .select()
    .from(messageThreadParticipants)
    .where(
      and(
        eq(messageThreadParticipants.threadId, threadId),
        eq(messageThreadParticipants.characterId, characterId)
      )
    );
  if (!participant) return null;

  const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.id, threadId));
  if (!thread) return null;

  const participants = await db
    .select({
      characterId: characters.id,
      characterName: characters.name,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      characterSlug: characters.slug,
      characterAvatarUrl: characters.avatarUrl,
    })
    .from(messageThreadParticipants)
    .innerJoin(characters, eq(messageThreadParticipants.characterId, characters.id))
    .where(
      and(eq(messageThreadParticipants.threadId, threadId), eq(messageThreadParticipants.isDeleted, false))
    );

  const threadMessages = await db
    .select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
      characterId: characters.id,
      characterName: characters.name,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      characterSlug: characters.slug,
      characterAvatarUrl: characters.avatarUrl,
    })
    .from(messages)
    .innerJoin(characters, eq(messages.characterId, characters.id))
    .where(eq(messages.threadId, threadId))
    .orderBy(desc(messages.createdAt));

  return { thread, participants, messages: threadMessages, isCreator: thread.creatorCharacterId === characterId };
}
