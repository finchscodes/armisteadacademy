"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, ilike } from "drizzle-orm";
import { db } from "@/db";
import { characterRelations, characters } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { RELATION_TYPES } from "@/lib/relations";

export type RelationActionState = { error?: string; success?: string } | undefined;

const sendSchema = z.object({
  toFirstName: z.string().min(1, "Enter their first name"),
  toLastName: z.string().min(1, "Enter their last name"),
  relationType: z.enum(RELATION_TYPES as [string, ...string[]]),
});

export async function sendRelationRequestAction(
  _prevState: RelationActionState,
  formData: FormData
): Promise<RelationActionState> {
  const { characterId: fromCharacterId } = await requireSessionAndCharacter();

  const parsed = sendSchema.safeParse({
    toFirstName: formData.get("toFirstName"),
    toLastName: formData.get("toLastName"),
    relationType: formData.get("relationType"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const matches = await db
    .select({ id: characters.id, firstName: characters.firstName, lastName: characters.lastName })
    .from(characters)
    .where(
      and(
        ilike(characters.firstName, parsed.data.toFirstName.trim()),
        ilike(characters.lastName, parsed.data.toLastName.trim())
      )
    );

  if (matches.length === 0) {
    return {
      error: `No character found named "${parsed.data.toFirstName} ${parsed.data.toLastName}"`,
    };
  }
  if (matches.length > 1) {
    return { error: "More than one character has that name — ask them for their profile link" };
  }

  const toCharacterId = matches[0].id;
  if (toCharacterId === fromCharacterId) {
    return { error: "You can't send a relation request to yourself" };
  }

  const [existing] = await db
    .select({ id: characterRelations.id })
    .from(characterRelations)
    .where(
      and(
        eq(characterRelations.fromCharacterId, fromCharacterId),
        eq(characterRelations.toCharacterId, toCharacterId),
        eq(characterRelations.relationType, parsed.data.relationType)
      )
    );
  if (existing) {
    return { error: "You've already sent (or have) this exact relation with them" };
  }

  await db.insert(characterRelations).values({
    fromCharacterId,
    toCharacterId,
    relationType: parsed.data.relationType,
  });

  revalidatePath("/c", "layout");
  return { success: `Request sent to ${matches[0].firstName} ${matches[0].lastName}` };
}

async function requireOwnsCharacter(characterId: number, session: { userId: number }) {
  const [character] = await db
    .select({ userId: characters.userId })
    .from(characters)
    .where(eq(characters.id, characterId));
  return character?.userId === session.userId;
}

export async function acceptRelationRequestAction(formData: FormData) {
  const { session, characterId } = await requireSessionAndCharacter();
  const relationId = Number(formData.get("relationId"));
  if (!relationId) return;

  const [relation] = await db
    .select()
    .from(characterRelations)
    .where(eq(characterRelations.id, relationId));
  if (!relation || relation.toCharacterId !== characterId) return;
  if (!(await requireOwnsCharacter(characterId, session))) return;

  await db
    .update(characterRelations)
    .set({ status: "accepted", respondedAt: new Date() })
    .where(eq(characterRelations.id, relationId));

  revalidatePath("/c", "layout");
}

export async function rejectRelationRequestAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const relationId = Number(formData.get("relationId"));
  if (!relationId) return;

  const [relation] = await db
    .select()
    .from(characterRelations)
    .where(eq(characterRelations.id, relationId));
  if (!relation || relation.toCharacterId !== characterId) return;

  await db.delete(characterRelations).where(eq(characterRelations.id, relationId));
  revalidatePath("/c", "layout");
}

/** Cancel your own pending outgoing request. */
export async function cancelRelationRequestAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const relationId = Number(formData.get("relationId"));
  if (!relationId) return;

  const [relation] = await db
    .select()
    .from(characterRelations)
    .where(eq(characterRelations.id, relationId));
  if (!relation || relation.fromCharacterId !== characterId) return;

  await db.delete(characterRelations).where(eq(characterRelations.id, relationId));
  revalidatePath("/c", "layout");
}

/** End an accepted relation. Either side can do this. */
export async function removeRelationAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const relationId = Number(formData.get("relationId"));
  if (!relationId) return;

  const [relation] = await db
    .select()
    .from(characterRelations)
    .where(eq(characterRelations.id, relationId));
  if (!relation) return;
  if (relation.fromCharacterId !== characterId && relation.toCharacterId !== characterId) return;

  await db.delete(characterRelations).where(eq(characterRelations.id, relationId));
  revalidatePath("/c", "layout");
}
