"use server";

import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { chatMessages, characters, xpLedger, ME_COMMAND_LEVEL_REQUIREMENT } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { XP_AWARDS, getCharacterXp, levelForXp } from "@/lib/xp";
import { getPrimaryJobsForCharacters, characterHasAnyJob } from "@/lib/character-jobs";
import { CHAT_MODERATOR_JOBS } from "@/lib/roles";

const SPAM_STREAK_LIMIT = 8;
const SPAM_TIMEOUT_MINUTES = 1;

const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

export type SendChatResult = { error?: string };

export async function sendChatMessageAction(formData: FormData): Promise<SendChatResult> {
  const { session, characterId } = await requireSessionAndCharacter();

  const [character] = await db
    .select({ chatTimeoutUntil: characters.chatTimeoutUntil })
    .from(characters)
    .where(eq(characters.id, characterId));

  if (character?.chatTimeoutUntil && character.chatTimeoutUntil > new Date()) {
    const minutesLeft = Math.ceil((character.chatTimeoutUntil.getTime() - Date.now()) / 60000);
    return { error: `You're timed out from chat for ${minutesLeft} more minute${minutesLeft === 1 ? "" : "s"}.` };
  }

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

  // Spam guard: if their last SPAM_STREAK_LIMIT messages (including this one)
  // are all theirs with nobody else talking in between, auto-timeout them
  // briefly so someone else gets a turn.
  const recentMessages = await db
    .select({ characterId: chatMessages.characterId, isAnnouncement: chatMessages.isAnnouncement })
    .from(chatMessages)
    .orderBy(desc(chatMessages.createdAt))
    .limit(SPAM_STREAK_LIMIT);
  const isAllThem =
    recentMessages.length === SPAM_STREAK_LIMIT &&
    recentMessages.every((m) => m.characterId === characterId && !m.isAnnouncement);

  if (isAllThem) {
    const until = new Date(Date.now() + SPAM_TIMEOUT_MINUTES * 60 * 1000);
    await db.update(characters).set({ chatTimeoutUntil: until }).where(eq(characters.id, characterId));
    return {
      error: `Slow down! You've sent ${SPAM_STREAK_LIMIT} messages in a row — wait a minute or let someone else talk before sending more.`,
    };
  }

  return {};
}

export async function getRecentChatMessages(limit = 50) {
  const rows = await db
    .select({
      id: chatMessages.id,
      content: chatMessages.content,
      isAnnouncement: chatMessages.isAnnouncement,
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

/** Whether the viewer can moderate chat (timeout/delete), and their own timeout status if any. */
export async function getChatModerationContext(characterId: number) {
  const [isModerator, [character]] = await Promise.all([
    characterHasAnyJob(characterId, CHAT_MODERATOR_JOBS),
    db.select({ chatTimeoutUntil: characters.chatTimeoutUntil }).from(characters).where(eq(characters.id, characterId)),
  ]);
  const timeoutUntil =
    character?.chatTimeoutUntil && character.chatTimeoutUntil > new Date()
      ? character.chatTimeoutUntil.toISOString()
      : null;
  return { isModerator, timeoutUntil };
}

async function requireChatModerator() {
  const { session, characterId } = await requireSessionAndCharacter();
  if (session.isAdmin) return;
  const allowed = await characterHasAnyJob(characterId, CHAT_MODERATOR_JOBS);
  if (!allowed) throw new Error("Not authorized");
}

export async function timeoutCharacterAction(formData: FormData) {
  await requireChatModerator();
  const characterId = Number(formData.get("characterId"));
  const minutes = Number(formData.get("minutes"));
  if (!characterId || !minutes || minutes <= 0) return;

  const until = new Date(Date.now() + minutes * 60 * 1000);
  await db.update(characters).set({ chatTimeoutUntil: until }).where(eq(characters.id, characterId));
  revalidatePath("/", "layout");
}

export async function resetChatTimeoutAction(formData: FormData) {
  await requireChatModerator();
  const characterId = Number(formData.get("characterId"));
  if (!characterId) return;

  await db.update(characters).set({ chatTimeoutUntil: null }).where(eq(characters.id, characterId));
  revalidatePath("/", "layout");
  revalidatePath("/admin/users");
}

export async function deleteChatMessageAction(formData: FormData) {
  await requireChatModerator();
  const messageId = Number(formData.get("messageId"));
  if (!messageId) return;

  await db.delete(chatMessages).where(eq(chatMessages.id, messageId));
  revalidatePath("/", "layout");
}

export async function deleteAllChatMessagesFromCharacterAction(formData: FormData) {
  await requireChatModerator();
  const characterId = Number(formData.get("characterId"));
  if (!characterId) return;

  await db.delete(chatMessages).where(eq(chatMessages.characterId, characterId));
  revalidatePath("/", "layout");
}
