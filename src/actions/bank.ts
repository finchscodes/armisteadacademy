"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { currencyLedger, bankLedger } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getCharacterBalance } from "@/lib/economy";
import { getBankBalance } from "@/lib/bank";

export type BankActionState = { error?: string } | undefined;

async function moveMoney(characterId: number, amount: number, direction: "deposit" | "withdraw") {
  if (direction === "deposit") {
    await db.insert(currencyLedger).values({ characterId, amount: -amount, reason: "bank_deposit", note: "Deposit" });
    await db.insert(bankLedger).values({ characterId, amount, reason: "bank_deposit", note: "Deposit" });
  } else {
    await db.insert(bankLedger).values({ characterId, amount: -amount, reason: "bank_withdrawal", note: "Withdrawal" });
    await db.insert(currencyLedger).values({ characterId, amount, reason: "bank_withdrawal", note: "Withdrawal" });
  }
  revalidatePath("/", "layout");
}

export async function depositAction(
  _prevState: BankActionState,
  formData: FormData
): Promise<BankActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const all = formData.get("all") === "true";
  const walletBalance = await getCharacterBalance(characterId);
  const amount = all ? walletBalance : Number(formData.get("amount"));

  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Enter a valid amount" };
  }
  if (amount > walletBalance) {
    return { error: "You don't have that much on hand" };
  }

  await moveMoney(characterId, amount, "deposit");
  return undefined;
}

export async function withdrawAction(
  _prevState: BankActionState,
  formData: FormData
): Promise<BankActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const all = formData.get("all") === "true";
  const bankBalance = await getBankBalance(characterId);
  const amount = all ? bankBalance : Number(formData.get("amount"));

  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Enter a valid amount" };
  }
  if (amount > bankBalance) {
    return { error: "You don't have that much in the bank" };
  }

  await moveMoney(characterId, amount, "withdraw");
  return undefined;
}
