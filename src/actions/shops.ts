"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { items, inventory, boards, currencyLedger } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getCharacterBalance } from "@/lib/economy";
import { ARSENAL_CAPACITY, getArsenalCount, getInventoryRow } from "@/lib/shops";

export type PurchaseResult = { error?: string; arsenalFull?: boolean; success?: boolean };

export async function purchaseItemAction(itemId: number): Promise<PurchaseResult> {
  const { characterId } = await requireSessionAndCharacter();

  const [item] = await db.select().from(items).where(eq(items.id, itemId));
  if (!item) return { error: "That item no longer exists" };

  if (item.stock !== null && item.stock <= 0) {
    return { error: "That item is out of stock" };
  }

  const arsenalCount = await getArsenalCount(characterId);
  if (arsenalCount >= ARSENAL_CAPACITY) {
    return { arsenalFull: true, error: "Your arsenal is full — it can only hold 100 items." };
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

  const existing = await getInventoryRow(characterId, itemId);
  if (existing) {
    await db.update(inventory).set({ quantity: existing.quantity + 1 }).where(eq(inventory.id, existing.id));
  } else {
    await db.insert(inventory).values({ characterId, itemId, quantity: 1 });
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
