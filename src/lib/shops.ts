import { eq, and, sum } from "drizzle-orm";
import { db } from "@/db";
import { items, inventory, boards } from "@/db/schema";

export const ARSENAL_CAPACITY = 100;

export async function getShopItems(boardId: number) {
  return db.select().from(items).where(eq(items.boardId, boardId)).orderBy(items.position);
}

/** Total item count across a character's whole arsenal (sum of quantities, not distinct rows). */
export async function getArsenalCount(characterId: number): Promise<number> {
  const [row] = await db
    .select({ total: sum(inventory.quantity) })
    .from(inventory)
    .where(eq(inventory.characterId, characterId));
  return Number(row?.total ?? 0);
}

export type ArsenalRow = {
  id: number;
  quantity: number;
  acquiredAt: Date;
  itemId: number;
  itemName: string;
  itemDescription: string | null;
  itemImageUrl: string | null;
  shopName: string;
  hungerRestore: number | null;
  thirstRestore: number | null;
};

/** A character's arsenal — every item they own, with shop context, newest first. */
export async function getArsenal(characterId: number): Promise<ArsenalRow[]> {
  const rows = await db
    .select({
      id: inventory.id,
      quantity: inventory.quantity,
      acquiredAt: inventory.acquiredAt,
      itemId: items.id,
      itemName: items.name,
      itemDescription: items.description,
      itemImageUrl: items.imageUrl,
      shopName: boards.name,
      hungerRestore: items.hungerRestore,
      thirstRestore: items.thirstRestore,
    })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .innerJoin(boards, eq(items.boardId, boards.id))
    .where(eq(inventory.characterId, characterId))
    .orderBy(inventory.acquiredAt);

  return rows.reverse();
}

export async function getInventoryRow(characterId: number, itemId: number) {
  const [row] = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.characterId, characterId), eq(inventory.itemId, itemId)));
  return row ?? null;
}

/** Adds one unit of an item to a character's inventory — increments an existing stack or creates one. Used by shop purchases, gifting, and trade completion/refunds. */
export async function addItemToInventory(characterId: number, itemId: number, quantity = 1) {
  const existing = await getInventoryRow(characterId, itemId);
  if (existing) {
    await db.update(inventory).set({ quantity: existing.quantity + quantity }).where(eq(inventory.id, existing.id));
  } else {
    await db.insert(inventory).values({ characterId, itemId, quantity });
  }
}

/**
 * Removes one unit of an item from a character's inventory — the mirror
 * of addItemToInventory. Deletes the row if the stack hits zero. Returns
 * false (and does nothing) if the character doesn't have enough to remove.
 */
export async function removeItemFromInventory(characterId: number, itemId: number, quantity = 1): Promise<boolean> {
  const existing = await getInventoryRow(characterId, itemId);
  if (!existing || existing.quantity < quantity) return false;

  if (existing.quantity === quantity) {
    await db.delete(inventory).where(eq(inventory.id, existing.id));
  } else {
    await db.update(inventory).set({ quantity: existing.quantity - quantity }).where(eq(inventory.id, existing.id));
  }
  return true;
}
