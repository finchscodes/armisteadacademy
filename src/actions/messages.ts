"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, or, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import { messageThreads, messageThreadParticipants, messages, characters } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { sanitizeRichText, richTextLength } from "@/lib/sanitize";
import { createNotification } from "@/lib/notifications";
import type { ActionState } from "./auth";

/** Search characters by legal or code name, for the recipient picker. */
export async function searchCharactersAction(query: string) {
  const { characterId } = await requireSessionAndCharacter();
  if (!query.trim()) return [];

  const rows = await db
    .select({
      id: characters.id,
      name: characters.name,
      firstName: characters.firstName,
      lastName: characters.lastName,
      slug: characters.slug,
    })
    .from(characters)
    .where(
      and(
        or(
          ilike(characters.firstName, `%${query}%`),
          ilike(characters.lastName, `%${query}%`),
          ilike(characters.name, `%${query}%`)
        )
      )
    )
    .limit(10);

  return rows.filter((r) => r.id !== characterId);
}

const newThreadSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  content: z.string().min(1, "Message can't be empty").max(60000).refine((v) => richTextLength(v) > 0, "Message can't be empty"),
  recipientIds: z.array(z.coerce.number().int()).min(1, "Pick at least one recipient"),
});

export async function createMessageThreadAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const recipientIds = formData.getAll("recipientIds").map(Number).filter(Boolean);
  const parsed = newThreadSchema.safeParse({
    subject: formData.get("subject"),
    content: formData.get("content"),
    recipientIds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const content = sanitizeRichText(parsed.data.content);
  const allParticipantIds = [...new Set([characterId, ...parsed.data.recipientIds])];

  const [thread] = await db
    .insert(messageThreads)
    .values({ subject: parsed.data.subject, creatorCharacterId: characterId })
    .returning({ id: messageThreads.id });

  await db.insert(messageThreadParticipants).values(
    allParticipantIds.map((cId) => ({
      threadId: thread.id,
      characterId: cId,
      isRead: cId === characterId,
    }))
  );

  await db.insert(messages).values({ threadId: thread.id, characterId, content });

  const [sender] = await db
    .select({ firstName: characters.firstName, lastName: characters.lastName })
    .from(characters)
    .where(eq(characters.id, characterId));
  if (sender) {
    for (const recipientId of parsed.data.recipientIds) {
      await createNotification(
        recipientId,
        "relation_request", // reuse the generic "someone reached out" style
        `${sender.firstName} ${sender.lastName} sent you a message: "${parsed.data.subject}"`,
        `/messages/${thread.id}`
      );
    }
  }

  redirect(`/messages/${thread.id}`);
}

const replySchema = z.object({
  threadId: z.coerce.number().int(),
  content: z.string().min(1, "Message can't be empty").max(60000).refine((v) => richTextLength(v) > 0, "Message can't be empty"),
});

export async function sendMessageReplyAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const parsed = replySchema.safeParse({
    threadId: formData.get("threadId"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [participant] = await db
    .select({ id: messageThreadParticipants.id })
    .from(messageThreadParticipants)
    .where(
      and(
        eq(messageThreadParticipants.threadId, parsed.data.threadId),
        eq(messageThreadParticipants.characterId, characterId)
      )
    );
  if (!participant) return { error: "You're not part of this conversation" };

  const content = sanitizeRichText(parsed.data.content);
  await db.insert(messages).values({ threadId: parsed.data.threadId, characterId, content });
  await db
    .update(messageThreads)
    .set({ lastMessageAt: new Date() })
    .where(eq(messageThreads.id, parsed.data.threadId));

  // Everyone else in the thread now has unread mail.
  await db
    .update(messageThreadParticipants)
    .set({ isRead: false })
    .where(
      and(
        eq(messageThreadParticipants.threadId, parsed.data.threadId),
        eq(messageThreadParticipants.isDeleted, false)
      )
    );
  await db
    .update(messageThreadParticipants)
    .set({ isRead: true })
    .where(
      and(
        eq(messageThreadParticipants.threadId, parsed.data.threadId),
        eq(messageThreadParticipants.characterId, characterId)
      )
    );

  revalidatePath(`/messages/${parsed.data.threadId}`);
  return undefined;
}

export async function markThreadsReadAction(threadIds: number[], read: boolean) {
  const { characterId } = await requireSessionAndCharacter();
  if (threadIds.length === 0) return;

  await db
    .update(messageThreadParticipants)
    .set({ isRead: read })
    .where(
      and(
        inArray(messageThreadParticipants.threadId, threadIds),
        eq(messageThreadParticipants.characterId, characterId)
      )
    );
  revalidatePath("/messages");
}

export async function deleteThreadsAction(threadIds: number[]) {
  const { characterId } = await requireSessionAndCharacter();
  if (threadIds.length === 0) return;

  // Soft delete for just this person — the thread stays for everyone else.
  await db
    .update(messageThreadParticipants)
    .set({ isDeleted: true })
    .where(
      and(
        inArray(messageThreadParticipants.threadId, threadIds),
        eq(messageThreadParticipants.characterId, characterId)
      )
    );
  revalidatePath("/messages");
}

export async function addParticipantAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const threadId = Number(formData.get("threadId"));
  const newCharacterId = Number(formData.get("characterId"));
  if (!threadId || !newCharacterId) return;

  const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.id, threadId));
  if (!thread || thread.creatorCharacterId !== characterId) return;

  await db
    .insert(messageThreadParticipants)
    .values({ threadId, characterId: newCharacterId, isRead: false })
    .onConflictDoUpdate({
      target: [messageThreadParticipants.threadId, messageThreadParticipants.characterId],
      set: { isDeleted: false },
    });

  revalidatePath(`/messages/${threadId}`);
}

export async function removeParticipantAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const threadId = Number(formData.get("threadId"));
  const targetCharacterId = Number(formData.get("characterId"));
  if (!threadId || !targetCharacterId) return;

  const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.id, threadId));
  if (!thread || thread.creatorCharacterId !== characterId) return;

  await db
    .update(messageThreadParticipants)
    .set({ isDeleted: true })
    .where(
      and(
        eq(messageThreadParticipants.threadId, threadId),
        eq(messageThreadParticipants.characterId, targetCharacterId)
      )
    );

  revalidatePath(`/messages/${threadId}`);
}
