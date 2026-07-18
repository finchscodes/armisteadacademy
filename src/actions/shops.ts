"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { items, inventory, boards, currencyLedger, characters, pets } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getCharacterBalance } from "@/lib/economy";
import { ARSENAL_CAPACITY, getArsenalCount, getInventoryRow } from "@/lib/shops";
import { getCurrentNeeds } from "@/lib/needs";

export type PurchaseResult = { error?: string; arsenalFull?: boolean; success?: boolean };

export async function purchaseItemAction(itemId: number): Promise<PurchaseResult> {
  const { characterId } = await requireSessionAndCharacter();

  const [item] = await db.select().from(items).where(eq(items.id, itemId));
  if (!item) return { error: "That item no longer exists" };

  if (item.stock !== null && item.stock <= 0) {
    return { error: "That item is out of stock" };
  }

  // Pets live in their own tab, separate from the regular Arsenal, so they
  // don't count against its 100-item cap.
  if (!item.isPet) {
    const arsenalCount = await getArsenalCount(characterId);
    if (arsenalCount >= ARSENAL_CAPACITY) {
      return { arsenalFull: true, error: "Your arsenal is full — it can only hold 100 items." };
    }
  }

  const balance = await getCharacterBalance(characterId);
  if (balance < item.price) {
    return { error: "You can't afford that" };
  }

  await db.insert(currencyLedger).values({
    characterId,
    amount: -item.price,
    reason: "shop_purchase",
    note: `Bought ${item.name}`,
  });

  if (item.isPet) {
    await db.insert(pets).values({ characterId, itemId });
  } else {
    const existing = await getInventoryRow(characterId, itemId);
    if (existing) {
      await db.update(inventory).set({ quantity: existing.quantity + 1 }).where(eq(inventory.id, existing.id));
    } else {
      await db.insert(inventory).values({ characterId, itemId, quantity: 1 });
    }
  }

  if (item.stock !== null) {
    await db.update(items).set({ stock: item.stock - 1 }).where(eq(items.id, itemId));
  }

  const [board] = await db.select({ slug: boards.slug }).from(boards).where(eq(boards.id, item.boardId));
  if (board) revalidatePath(`/b/${board.slug}`);

  return { success: true };
}

/** Remove one item stack from your own arsenal — owner only. */
export async function deleteInventoryItemAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const inventoryId = Number(formData.get("inventoryId"));
  if (!inventoryId) return;

  await db.delete(inventory).where(and(eq(inventory.id, inventoryId), eq(inventory.characterId, characterId)));

  revalidatePath("/", "layout");
}

export type ConsumeItemState = { error?: string; success?: string } | undefined;

/** Eating/drinking an item from the Arsenal — restores hunger/thirst and uses up one unit. */
export async function consumeItemAction(
  _prevState: ConsumeItemState,
  formData: FormData
): Promise<ConsumeItemState> {
  const { characterId } = await requireSessionAndCharacter();
  const inventoryId = Number(formData.get("inventoryId"));
  if (!inventoryId) return { error: "Item not found" };

  const [row] = await db
    .select({
      id: inventory.id,
      quantity: inventory.quantity,
      hungerRestore: items.hungerRestore,
      thirstRestore: items.thirstRestore,
      itemName: items.name,
    })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(and(eq(inventory.id, inventoryId), eq(inventory.characterId, characterId)));

  if (!row) return { error: "You don't have that item" };
  if (!row.hungerRestore && !row.thirstRestore) {
    return { error: "That item can't be eaten or drunk" };
  }

  const state = await getCurrentNeeds(characterId);
  const newHunger = Math.min(100, state.hunger + (row.hungerRestore ?? 0));
  const newThirst = Math.min(100, state.thirst + (row.thirstRestore ?? 0));

  await db
    .update(characters)
    .set({ hunger: newHunger, thirst: newThirst, lastNeedsUpdate: new Date() })
    .where(eq(characters.id, characterId));

  if (row.quantity > 1) {
    await db.update(inventory).set({ quantity: row.quantity - 1 }).where(eq(inventory.id, row.id));
  } else {
    await db.delete(inventory).where(eq(inventory.id, row.id));
  }

  revalidatePath("/", "layout");
  return { success: `Used ${row.itemName}` };
}
