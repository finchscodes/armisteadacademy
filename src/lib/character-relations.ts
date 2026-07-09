import { eq, or, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { characterRelations, characters } from "@/db/schema";
import { relationLabel, inverseRelationType } from "@/lib/relations";

type OtherCharacter = { id: number; name: string; slug: string; avatarUrl: string | null };

export type AcceptedRelation = {
  id: number;
  label: string;
  other: OtherCharacter;
};

/** Every accepted relation this character has, labeled from THEIR point of view. Public. */
export async function getAcceptedRelations(characterId: number): Promise<AcceptedRelation[]> {
  const rows = await db
    .select({
      id: characterRelations.id,
      fromCharacterId: characterRelations.fromCharacterId,
      toCharacterId: characterRelations.toCharacterId,
      relationType: characterRelations.relationType,
      otherId: characters.id,
      otherName: characters.name,
      otherSlug: characters.slug,
      otherAvatarUrl: characters.avatarUrl,
    })
    .from(characterRelations)
    .innerJoin(
      characters,
      or(
        and(eq(characterRelations.fromCharacterId, characterId), eq(characters.id, characterRelations.toCharacterId)),
        and(eq(characterRelations.toCharacterId, characterId), eq(characters.id, characterRelations.fromCharacterId))
      )
    )
    .where(
      and(
        eq(characterRelations.status, "accepted"),
        or(eq(characterRelations.fromCharacterId, characterId), eq(characterRelations.toCharacterId, characterId))
      )
    )
    .orderBy(desc(characterRelations.respondedAt));

  return rows.map((r) => {
    // Label from THIS character's point of view: if they were the sender,
    // use the type as stored; if they were the recipient, use its inverse.
    const isSender = r.fromCharacterId === characterId;
    const type = isSender ? r.relationType : inverseRelationType(r.relationType);
    return {
      id: r.id,
      label: relationLabel(type),
      other: { id: r.otherId, name: r.otherName, slug: r.otherSlug, avatarUrl: r.otherAvatarUrl },
    };
  });
}

export type PendingRelation = {
  id: number;
  label: string;
  other: OtherCharacter;
  createdAt: Date;
};

/** Requests sent TO this character, awaiting their response. Owner-only. */
export async function getIncomingRequests(characterId: number): Promise<PendingRelation[]> {
  const rows = await db
    .select({
      id: characterRelations.id,
      relationType: characterRelations.relationType,
      createdAt: characterRelations.createdAt,
      otherId: characters.id,
      otherName: characters.name,
      otherSlug: characters.slug,
      otherAvatarUrl: characters.avatarUrl,
    })
    .from(characterRelations)
    .innerJoin(characters, eq(characters.id, characterRelations.fromCharacterId))
    .where(and(eq(characterRelations.toCharacterId, characterId), eq(characterRelations.status, "pending")))
    .orderBy(desc(characterRelations.createdAt));

  return rows.map((r) => ({
    id: r.id,
    // Shown from the recipient's point of view — the inverse of what the sender picked.
    label: relationLabel(inverseRelationType(r.relationType)),
    other: { id: r.otherId, name: r.otherName, slug: r.otherSlug, avatarUrl: r.otherAvatarUrl },
    createdAt: r.createdAt,
  }));
}

/** Requests this character sent, still awaiting a response. Owner-only. */
export async function getOutgoingRequests(characterId: number): Promise<PendingRelation[]> {
  const rows = await db
    .select({
      id: characterRelations.id,
      relationType: characterRelations.relationType,
      createdAt: characterRelations.createdAt,
      otherId: characters.id,
      otherName: characters.name,
      otherSlug: characters.slug,
      otherAvatarUrl: characters.avatarUrl,
    })
    .from(characterRelations)
    .innerJoin(characters, eq(characters.id, characterRelations.toCharacterId))
    .where(and(eq(characterRelations.fromCharacterId, characterId), eq(characterRelations.status, "pending")))
    .orderBy(desc(characterRelations.createdAt));

  return rows.map((r) => ({
    id: r.id,
    label: relationLabel(r.relationType),
    other: { id: r.otherId, name: r.otherName, slug: r.otherSlug, avatarUrl: r.otherAvatarUrl },
    createdAt: r.createdAt,
  }));
}
