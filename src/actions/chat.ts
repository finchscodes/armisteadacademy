"use server";

import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, characters, xpLedger, ME_COMMAND_LEVEL_REQUIREMENT } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { XP_AWARDS, getCharacterXp, levelForXp } from "@/lib/xp";
import { getPrimaryJobsForCharacters } from "@/lib/character-jobs";

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

  let content = parsed.data.content;
  if (content.trim().toLowerCase().startsWith("/me ") || content.trim().toLowerCase() === "/me") {
    const xp = await getCharacterXp(characterId);
    if (levelForXp(xp) < ME_COMMAND_LEVEL_REQUIREMENT) {
      return { error: `/me requires level ${ME_COMMAND_LEVEL_REQUIREMENT}` };
    }
    // Normalize so the client can reliably detect the prefix at render time.
    content = "/me " + content.trim().slice(content.trim().toLowerCase() === "/me" ? 3 : 4);
  }

  await db.insert(chatMessages).values({
    characterId,
    userId: session.userId,
    content,
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
      characterSlug: characters.slug,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      characterAvatarUrl: characters.avatarUrl,
    })
    .from(chatMessages)
    .innerJoin(characters, eq(chatMessages.characterId, characters.id))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  const jobsByCharacter = await getPrimaryJobsForCharacters([
    ...new Set(rows.map((r) => r.characterId)),
  ]);
  const withJobs = rows.map((r) => ({
    ...r,
    characterJob: jobsByCharacter.get(r.characterId) ?? "none",
  }));

  return withJobs.reverse(); // oldest first for display
}
