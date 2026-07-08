"use server";

import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, characters, users, xpLedger } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { XP_AWARDS } from "@/lib/xp";

const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

export type SendChatResult = { error?: string };

export async function sendChatMessageAction(formData: FormData): Promise<SendChatResult> {
  const { session, characterId } = await requireSessionAndCharacter();

  const parsed = sendMessageSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { error: "Message can't be empty" };
  }

  await db.insert(chatMessages).values({
    characterId,
    userId: session.userId,
    content: parsed.data.content,
  });

  // Chatting counts toward the same "talking in chat" XP as posting in a thread.
  await db.insert(xpLedger).values({
    characterId,
    amount: XP_AWARDS.chat_post,
    reason: "chat_post",
    note: "Sidebar chat message",
  });

  return {};
}

export async function getRecentChatMessages(limit = 50) {
  const rows = await db
    .select({
      id: chatMessages.id,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
      characterId: characters.id,
      characterName: characters.name,
      characterSlug: characters.slug,
      characterAvatarUrl: characters.avatarUrl,
      posterRole: users.role,
    })
    .from(chatMessages)
    .innerJoin(characters, eq(chatMessages.characterId, characters.id))
    .innerJoin(users, eq(chatMessages.userId, users.id))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  return rows.reverse(); // oldest first for display
}
