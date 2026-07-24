"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { trades, characters, items } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getInventoryRow, removeItemFromInventory, addItemToInventory, getArsenalCount, ARSENAL_CAPACITY } from "@/lib/shops";
import { createNotification } from "@/lib/notifications";
import { getTradeById } from "@/lib/trades";

export type TradeActionState = { error?: string; success?: string } | undefined;

async function getCharacterSlug(characterId: number): Promise<string | null> {
  const [row] = await db.select({ slug: characters.slug }).from(characters).where(eq(characters.id, characterId));
  return row?.slug ?? null;
}

const proposeTradeSchema = z.object({
  itemId: z.coerce.number().int(),
  quantity: z.coerce.number().int().min(1).max(999),
  targetCharacterId: z.coerce.number().int().min(1, "Pick a character from the list"),
});

/** Proposes a trade — the offered item(s) are put in escrow (removed from the initiator's arsenal) immediately. */
export async function proposeTradeAction(
  _prevState: TradeActionState,
  formData: FormData
): Promise<TradeActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const parsed = proposeTradeSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
    targetCharacterId: formData.get("targetCharacterId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Pick a character from the list" };
  }

  const { itemId, quantity, targetCharacterId } = parsed.data;

  const [target] = await db.select({ id: characters.id }).from(characters).where(eq(characters.id, targetCharacterId));
  if (!target) return { error: "That character no longer exists" };
  if (target.id === characterId) return { error: "You can't trade with yourself" };

  const owned = await getInventoryRow(characterId, itemId);
  if (!owned || owned.quantity < quantity) return { error: `You only have ${owned?.quantity ?? 0}` };

  const removed = await removeItemFromInventory(characterId, itemId, quantity);
  if (!removed) return { error: "You don't have that many" };

  await db.insert(trades).values({
    initiatorCharacterId: characterId,
    initiatorItemId: itemId,
    initiatorQuantity: quantity,
    recipientCharacterId: target.id,
  });

  const [item] = await db.select({ name: items.name }).from(items).where(eq(items.id, itemId));
  const itemLabel = quantity > 1 ? `${quantity}x ${item?.name ?? "item"}` : (item?.name ?? "an item");

  const targetSlug = await getCharacterSlug(target.id);
  await createNotification(
    target.id,
    "trade_proposed",
    `You've been offered a trade for ${itemLabel}`,
    targetSlug ? `/c/${targetSlug}` : "/characters"
  );

  revalidatePath("/", "layout");
  return { success: "Trade proposed — waiting on them to counter-offer" };
}

const respondSchema = z.object({
  tradeId: z.coerce.number().int(),
  itemId: z.coerce.number().int(),
  quantity: z.coerce.number().int().min(1).max(999),
});

/** The recipient counter-offers item(s) — also escrowed immediately, moving the trade to awaiting_approval. */
export async function respondToTradeAction(
  _prevState: TradeActionState,
  formData: FormData
): Promise<TradeActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const parsed = respondSchema.safeParse({
    tradeId: formData.get("tradeId"),
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const trade = await getTradeById(parsed.data.tradeId);
  if (!trade) return { error: "Trade not found" };
  if (trade.recipientCharacterId !== characterId) return { error: "Not your trade to respond to" };
  if (trade.status !== "awaiting_offer") return { error: "This trade already moved past that stage" };

  const owned = await getInventoryRow(characterId, parsed.data.itemId);
  if (!owned || owned.quantity < parsed.data.quantity) {
    return { error: `You only have ${owned?.quantity ?? 0}` };
  }

  const removed = await removeItemFromInventory(characterId, parsed.data.itemId, parsed.data.quantity);
  if (!removed) return { error: "You don't have that many" };

  await db
    .update(trades)
    .set({
      recipientItemId: parsed.data.itemId,
      recipientQuantity: parsed.data.quantity,
      status: "awaiting_approval",
      updatedAt: new Date(),
    })
    .where(eq(trades.id, trade.id));

  const [item] = await db.select({ name: items.name }).from(items).where(eq(items.id, parsed.data.itemId));
  const itemLabel =
    parsed.data.quantity > 1 ? `${parsed.data.quantity}x ${item?.name ?? "item"}` : (item?.name ?? "an item");

  const initiatorSlug = await getCharacterSlug(trade.initiatorCharacterId);
  await createNotification(
    trade.initiatorCharacterId,
    "trade_proposed",
    `They countered your trade with ${itemLabel} — approve or reject it`,
    initiatorSlug ? `/c/${initiatorSlug}` : "/characters"
  );

  revalidatePath("/", "layout");
  return { success: "Counter-offer sent — waiting on their approval" };
}

/** The initiator approves — items swap sides for good. Blocked if either arsenal is full. */
export async function approveTradeAction(formData: FormData): Promise<TradeActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const tradeId = Number(formData.get("tradeId"));
  if (!tradeId) return { error: "Trade not found" };

  const trade = await getTradeById(tradeId);
  if (!trade) return { error: "Trade not found" };
  if (trade.initiatorCharacterId !== characterId) return { error: "Not your trade to approve" };
  if (trade.status !== "awaiting_approval" || !trade.recipientItemId) {
    return { error: "This trade isn't ready to approve yet" };
  }

  const [initiatorCount, recipientCount] = await Promise.all([
    getArsenalCount(trade.initiatorCharacterId),
    getArsenalCount(trade.recipientCharacterId),
  ]);
  if (initiatorCount >= ARSENAL_CAPACITY || recipientCount >= ARSENAL_CAPACITY) {
    return { error: "One of your arsenals is full — free up space before approving" };
  }

  await addItemToInventory(trade.recipientCharacterId, trade.initiatorItemId, trade.initiatorQuantity);
  await addItemToInventory(trade.initiatorCharacterId, trade.recipientItemId, trade.recipientQuantity);

  await db.update(trades).set({ status: "accepted", updatedAt: new Date() }).where(eq(trades.id, trade.id));

  const recipientSlug = await getCharacterSlug(trade.recipientCharacterId);
  await createNotification(
    trade.recipientCharacterId,
    "trade_proposed",
    "Your trade was accepted!",
    recipientSlug ? `/c/${recipientSlug}` : "/characters"
  );

  revalidatePath("/", "layout");
  return { success: "Trade completed" };
}

/** Either side can reject/cancel at any pending stage — refunds whatever's currently in escrow. */
export async function rejectTradeAction(formData: FormData): Promise<TradeActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const tradeId = Number(formData.get("tradeId"));
  if (!tradeId) return { error: "Trade not found" };

  const trade = await getTradeById(tradeId);
  if (!trade) return { error: "Trade not found" };
  if (trade.initiatorCharacterId !== characterId && trade.recipientCharacterId !== characterId) {
    return { error: "Not your trade" };
  }
  if (trade.status !== "awaiting_offer" && trade.status !== "awaiting_approval") {
    return { error: "This trade is already finished" };
  }

  await addItemToInventory(trade.initiatorCharacterId, trade.initiatorItemId, trade.initiatorQuantity);
  if (trade.recipientItemId) {
    await addItemToInventory(trade.recipientCharacterId, trade.recipientItemId, trade.recipientQuantity);
  }

  await db.update(trades).set({ status: "rejected", updatedAt: new Date() }).where(eq(trades.id, trade.id));

  const otherPartyId =
    characterId === trade.initiatorCharacterId ? trade.recipientCharacterId : trade.initiatorCharacterId;
  const otherPartySlug = await getCharacterSlug(otherPartyId);
  await createNotification(
    otherPartyId,
    "trade_proposed",
    "A trade was rejected — items returned",
    otherPartySlug ? `/c/${otherPartySlug}` : "/characters"
  );

  revalidatePath("/", "layout");
  return { success: "Trade rejected — items returned" };
}
