"use server";

import { z } from "zod";
import { eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { trades, characters, items } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getInventoryRow, removeItemFromInventory, addItemToInventory, getArsenalCount, ARSENAL_CAPACITY } from "@/lib/shops";
import { createNotification } from "@/lib/notifications";
import { getTradeById } from "@/lib/trades";

export type TradeActionState = { error?: string; success?: string } | undefined;

async function findCharacterByName(name: string) {
  const trimmed = name.trim();
  const [character] = await db
    .select({ id: characters.id, name: characters.name })
    .from(characters)
    .where(ilike(characters.name, trimmed));
  return character ?? null;
}

const proposeTradeSchema = z.object({
  itemId: z.coerce.number().int(),
  targetCharacterName: z.string().trim().min(1, "Enter a character's name"),
});

/** Proposes a trade — the offered item is put in escrow (removed from the initiator's arsenal) immediately. */
export async function proposeTradeAction(
  _prevState: TradeActionState,
  formData: FormData
): Promise<TradeActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const parsed = proposeTradeSchema.safeParse({
    itemId: formData.get("itemId"),
    targetCharacterName: formData.get("targetCharacterName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { itemId, targetCharacterName } = parsed.data;

  const target = await findCharacterByName(targetCharacterName);
  if (!target) return { error: "No character found with that name" };
  if (target.id === characterId) return { error: "You can't trade with yourself" };

  const owned = await getInventoryRow(characterId, itemId);
  if (!owned || owned.quantity < 1) return { error: "You don't have that item" };

  const removed = await removeItemFromInventory(characterId, itemId, 1);
  if (!removed) return { error: "You don't have that item" };

  await db
    .insert(trades)
    .values({ initiatorCharacterId: characterId, initiatorItemId: itemId, recipientCharacterId: target.id });

  const [item] = await db.select({ name: items.name }).from(items).where(eq(items.id, itemId));

  await createNotification(
    target.id,
    "trade_proposed",
    `You've been offered a trade for a ${item?.name ?? "item"}`,
    "/trades"
  );

  revalidatePath("/trades");
  return { success: "Trade proposed — waiting on them to counter-offer" };
}

const respondSchema = z.object({
  tradeId: z.coerce.number().int(),
  itemId: z.coerce.number().int(),
});

/** The recipient counter-offers an item — also escrowed immediately, moving the trade to awaiting_approval. */
export async function respondToTradeAction(
  _prevState: TradeActionState,
  formData: FormData
): Promise<TradeActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const parsed = respondSchema.safeParse({
    tradeId: formData.get("tradeId"),
    itemId: formData.get("itemId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const trade = await getTradeById(parsed.data.tradeId);
  if (!trade) return { error: "Trade not found" };
  if (trade.recipientCharacterId !== characterId) return { error: "Not your trade to respond to" };
  if (trade.status !== "awaiting_offer") return { error: "This trade already moved past that stage" };

  const owned = await getInventoryRow(characterId, parsed.data.itemId);
  if (!owned || owned.quantity < 1) return { error: "You don't have that item" };

  const removed = await removeItemFromInventory(characterId, parsed.data.itemId, 1);
  if (!removed) return { error: "You don't have that item" };

  await db
    .update(trades)
    .set({ recipientItemId: parsed.data.itemId, status: "awaiting_approval", updatedAt: new Date() })
    .where(eq(trades.id, trade.id));

  const [item] = await db.select({ name: items.name }).from(items).where(eq(items.id, parsed.data.itemId));

  await createNotification(
    trade.initiatorCharacterId,
    "trade_proposed",
    `They countered your trade with a ${item?.name ?? "item"} — approve or reject it`,
    "/trades"
  );

  revalidatePath("/trades");
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

  await addItemToInventory(trade.recipientCharacterId, trade.initiatorItemId, 1);
  await addItemToInventory(trade.initiatorCharacterId, trade.recipientItemId, 1);

  await db.update(trades).set({ status: "accepted", updatedAt: new Date() }).where(eq(trades.id, trade.id));

  await createNotification(trade.recipientCharacterId, "trade_proposed", "Your trade was accepted!", "/trades");

  revalidatePath("/trades");
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

  await addItemToInventory(trade.initiatorCharacterId, trade.initiatorItemId, 1);
  if (trade.recipientItemId) {
    await addItemToInventory(trade.recipientCharacterId, trade.recipientItemId, 1);
  }

  await db.update(trades).set({ status: "rejected", updatedAt: new Date() }).where(eq(trades.id, trade.id));

  const otherPartyId =
    characterId === trade.initiatorCharacterId ? trade.recipientCharacterId : trade.initiatorCharacterId;
  await createNotification(otherPartyId, "trade_proposed", "A trade was rejected — items returned", "/trades");

  revalidatePath("/trades");
  return { success: "Trade rejected — items returned" };
}
