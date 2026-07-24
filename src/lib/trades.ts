import { eq, or, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { trades, characters, items } from "@/db/schema";

/** Every trade involving this character that isn't finished yet — both sides, whatever stage. */
export async function getActiveTradesForCharacter(characterId: number) {
  const rows = await db
    .select({
      id: trades.id,
      status: trades.status,
      createdAt: trades.createdAt,
      updatedAt: trades.updatedAt,
      initiatorCharacterId: trades.initiatorCharacterId,
      initiatorItemId: trades.initiatorItemId,
      initiatorQuantity: trades.initiatorQuantity,
      recipientCharacterId: trades.recipientCharacterId,
      recipientItemId: trades.recipientItemId,
      recipientQuantity: trades.recipientQuantity,
    })
    .from(trades)
    .where(
      and(
        or(eq(trades.initiatorCharacterId, characterId), eq(trades.recipientCharacterId, characterId)),
        ne(trades.status, "accepted"),
        ne(trades.status, "rejected")
      )
    )
    .orderBy(trades.createdAt);

  if (rows.length === 0) return [];

  const characterIds = [...new Set(rows.flatMap((r) => [r.initiatorCharacterId, r.recipientCharacterId]))];
  const itemIds = [
    ...new Set(rows.flatMap((r) => [r.initiatorItemId, r.recipientItemId]).filter((id): id is number => id !== null)),
  ];

  const [characterRows, itemRows] = await Promise.all([
    db.select({ id: characters.id, name: characters.name, slug: characters.slug }).from(characters),
    db.select({ id: items.id, name: items.name, imageUrl: items.imageUrl }).from(items),
  ]);

  const charactersById = new Map(characterRows.filter((c) => characterIds.includes(c.id)).map((c) => [c.id, c]));
  const itemsById = new Map(itemRows.filter((i) => itemIds.includes(i.id)).map((i) => [i.id, i]));

  return rows.map((r) => ({
    ...r,
    initiatorCharacter: charactersById.get(r.initiatorCharacterId) ?? null,
    recipientCharacter: charactersById.get(r.recipientCharacterId) ?? null,
    initiatorItem: itemsById.get(r.initiatorItemId) ?? null,
    recipientItem: r.recipientItemId ? (itemsById.get(r.recipientItemId) ?? null) : null,
  }));
}

export async function getTradeById(tradeId: number) {
  const [row] = await db.select().from(trades).where(eq(trades.id, tradeId));
  return row ?? null;
}
