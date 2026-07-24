"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { items, inventory, boards, currencyLedger, characters, pets } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getCharacterBalance } from "@/lib/economy";
import {
  ARSENAL_CAPACITY,
  getArsenalCount,
  addItemToInventory,
  removeItemFromInventory,
} from "@/lib/shops";
import { getCurrentNeeds } from "@/lib/needs";
import { createNotification } from "@/lib/notifications";

export type PurchaseResult = { error?: string; arsenalFull?: boolean; success?: boolean };

export async function purchaseItemAction(itemId: number, quantity = 1): Promise<PurchaseResult> {
  const { characterId } = await requireSessionAndCharacter();
  const qty = Math.max(1, Math.min(999, Math.floor(quantity)));

  const [item] = await db.select().from(items).where(eq(items.id, itemId));
  if (!item) return { error: "That item no longer exists" };

  // Pets are individual creatures, not stackable stock — always one at a time.
  const purchaseQty = item.isPet ? 1 : qty;

  if (item.stock !== null && item.stock < purchaseQty) {
    return { error: item.stock <= 0 ? "That item is out of stock" : `Only ${item.stock} left` };
  }

  // Pets live in their own tab, separate from the regular Arsenal, so they
  // don't count against its 100-item cap.
  if (!item.isPet) {
    const arsenalCount = await getArsenalCount(characterId);
    if (arsenalCount >= ARSENAL_CAPACITY) {
      return { arsenalFull: true, error: "Your arsenal is full — it can only hold 100 items." };
    }
  }

  const totalCost = item.price * purchaseQty;
  const balance = await getCharacterBalance(characterId);
  if (balance < totalCost) {
    return { error: "You can't afford that" };
  }

  await db.insert(currencyLedger).values({
    characterId,
    amount: -totalCost,
    reason: "shop_purchase",
    note: purchaseQty > 1 ? `Bought ${purchaseQty}x ${item.name}` : `Bought ${item.name}`,
  });

  if (item.isPet) {
    await db.insert(pets).values({ characterId, itemId });
  } else {
    await addItemToInventory(characterId, itemId, purchaseQty);
  }

  if (item.stock !== null) {
    await db.update(items).set({ stock: item.stock - purchaseQty }).where(eq(items.id, itemId));
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

/** Deletes several inventory rows at once — the "select items, delete selected" bulk action. */
export async function massDeleteInventoryAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const inventoryIds = formData
    .getAll("inventoryIds")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (inventoryIds.length === 0) return;

  await db
    .delete(inventory)
    .where(and(inArray(inventory.id, inventoryIds), eq(inventory.characterId, characterId)));

  revalidatePath("/", "layout");
}

/** Deletes a chosen quantity from one stack, rather than the whole thing — e.g. dropping 3 of 10. */
export async function deleteInventoryQuantityAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const inventoryId = Number(formData.get("inventoryId"));
  const quantity = Number(formData.get("quantity"));
  if (!inventoryId || !quantity || quantity < 1) return;

  const [row] = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.id, inventoryId), eq(inventory.characterId, characterId)));
  if (!row) return;

  if (quantity >= row.quantity) {
    await db.delete(inventory).where(eq(inventory.id, inventoryId));
  } else {
    await db.update(inventory).set({ quantity: row.quantity - quantity }).where(eq(inventory.id, inventoryId));
  }

  revalidatePath("/", "layout");
}

export type GiftItemState = { error?: string; success?: string } | undefined;

const giftItemSchema = z.object({
  inventoryId: z.coerce.number().int(),
  quantity: z.coerce.number().int().min(1).max(999),
  targetCharacterId: z.coerce.number().int().min(1, "Pick a character from the list"),
  message: z.string().max(500).optional().or(z.literal("")),
});

/** Gifts a quantity of an item to another character, immediately — not a proposal, just sent. */
export async function giftItemAction(_prevState: GiftItemState, formData: FormData): Promise<GiftItemState> {
  const { characterId } = await requireSessionAndCharacter();

  const parsed = giftItemSchema.safeParse({
    inventoryId: formData.get("inventoryId"),
    quantity: formData.get("quantity"),
    targetCharacterId: formData.get("targetCharacterId"),
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Pick a character from the list" };
  }
  const { inventoryId, quantity, targetCharacterId, message } = parsed.data;

  const [row] = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.id, inventoryId), eq(inventory.characterId, characterId)));
  if (!row) return { error: "You don't have that item" };
  if (row.quantity < quantity) return { error: `You only have ${row.quantity}` };

  const [target] = await db.select({ id: characters.id }).from(characters).where(eq(characters.id, targetCharacterId));
  if (!target) return { error: "That character no longer exists" };
  if (target.id === characterId) return { error: "You can't gift to yourself" };

  const [item] = await db.select({ name: items.name, isPet: items.isPet }).from(items).where(eq(items.id, row.itemId));
  if (item?.isPet) return { error: "Pets can't be gifted" };

  const targetArsenalCount = await getArsenalCount(target.id);
  if (targetArsenalCount >= ARSENAL_CAPACITY) {
    return { error: "Their arsenal is full — they can't receive it right now" };
  }

  const removed = await removeItemFromInventory(characterId, row.itemId, quantity);
  if (!removed) return { error: "You don't have that many" };
  await addItemToInventory(target.id, row.itemId, quantity);

  const itemLabel = quantity > 1 ? `${quantity}x ${item?.name ?? "item"}` : (item?.name ?? "an item");
  const notifMessage = message ? `You were gifted ${itemLabel}: "${message}"` : `You were gifted ${itemLabel}`;
  await createNotification(target.id, "item_gifted", notifMessage, "/characters");

  revalidatePath("/", "layout");
  return { success: "Gift sent" };
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
