"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { characters, messageThreads, messageThreadParticipants, messages } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { sanitizeRichText, richTextLength } from "@/lib/sanitize";
import { getCharacterYearLabel } from "@/lib/year";

export type MassMessageState = { error?: string; success?: string } | undefined;

const ALL = "__all";

const massMessageSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  content: z
    .string()
    .min(1, "Message can't be empty")
    .max(60000)
    .refine((v) => richTextLength(v) > 0, "Message can't be empty"),
  major: z.string().optional(),
  hall: z.string().optional(),
  year: z.string().optional(),
  age: z.string().optional(),
});

async function getMatchingCharacters(filters: { major?: string; hall?: string; year?: string; age?: string }) {
  const conditions = [];
  if (filters.major && filters.major !== ALL) conditions.push(eq(characters.major, filters.major));
  if (filters.hall && filters.hall !== ALL) conditions.push(eq(characters.hall, filters.hall as never));
  if (filters.age && filters.age !== ALL) conditions.push(eq(characters.age, Number(filters.age)));

  const rows = await db
    .select({
      id: characters.id,
      major: characters.major,
      yearOverride: characters.yearOverride,
    })
    .from(characters)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  if (!filters.year || filters.year === ALL) return rows;

  // Year is computed (class standing derived from age/major), not a stored
  // column, so it has to be filtered after the fact rather than in SQL.
  const withYear = await Promise.all(
    rows.map(async (r) => ({ id: r.id, year: await getCharacterYearLabel(r.id, r.major, r.yearOverride) }))
  );
  return withYear.filter((r) => r.year === filters.year);
}

/** How many characters currently match a set of filters — used to show a live count before sending. */
export async function countMassMessageRecipientsAction(filters: {
  major?: string;
  hall?: string;
  year?: string;
  age?: string;
}) {
  const { session } = await requireSessionAndCharacter();
  if (!session.isAdmin) return 0;

  const rows = await getMatchingCharacters(filters);
  return rows.length;
}

export async function adminMassMessageAction(
  _prevState: MassMessageState,
  formData: FormData
): Promise<MassMessageState> {
  const { session, characterId } = await requireSessionAndCharacter();
  if (!session.isAdmin) {
    return { error: "Not authorized" };
  }

  const parsed = massMessageSchema.safeParse({
    subject: formData.get("subject"),
    content: formData.get("content"),
    major: formData.get("major") || undefined,
    hall: formData.get("hall") || undefined,
    year: formData.get("year") || undefined,
    age: formData.get("age") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { subject, major, hall, year, age } = parsed.data;
  const content = sanitizeRichText(parsed.data.content);

  const recipients = await getMatchingCharacters({ major, hall, year, age });
  const recipientIds = recipients.map((r) => r.id).filter((id) => id !== characterId);

  if (recipientIds.length === 0) {
    return { error: "No characters match those filters" };
  }

  // One thread per recipient, not one big group thread — this is a mail
  // merge, not a group chat everyone can see each other in.
  for (const recipientId of recipientIds) {
    const [thread] = await db
      .insert(messageThreads)
      .values({ subject, creatorCharacterId: characterId })
      .returning({ id: messageThreads.id });

    await db.insert(messageThreadParticipants).values([
      { threadId: thread.id, characterId, isRead: true },
      { threadId: thread.id, characterId: recipientId, isRead: false },
    ]);

    await db.insert(messages).values({ threadId: thread.id, characterId, content });
  }

  return { success: `Sent to ${recipientIds.length} character${recipientIds.length === 1 ? "" : "s"}` };
}
