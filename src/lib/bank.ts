import { eq, sum, desc } from "drizzle-orm";
import { db } from "@/db";
import { bankLedger } from "@/db/schema";

/** 2% per day, simple (not compounded within a day), applied lazily whenever the bank page loads. */
const DAILY_INTEREST_RATE = 0.02;

export async function getBankBalance(characterId: number): Promise<number> {
  const [row] = await db
    .select({ total: sum(bankLedger.amount) })
    .from(bankLedger)
    .where(eq(bankLedger.characterId, characterId));
  return Number(row?.total ?? 0);
}

/**
 * Interest isn't on a cron — there's nothing scheduled in this app that
 * could run one. Instead, whenever someone loads the bank page, this
 * checks how many whole days have passed since their last interest
 * credit (or their first deposit, if they've never gotten one) and backs
 * that many days of interest onto their balance at once.
 */
export async function applyPendingInterest(characterId: number): Promise<void> {
  const [lastInterest] = await db
    .select({ createdAt: bankLedger.createdAt })
    .from(bankLedger)
    .where(eq(bankLedger.characterId, characterId))
    .orderBy(desc(bankLedger.createdAt))
    .limit(1);

  const balance = await getBankBalance(characterId);
  if (balance <= 0) return;

  const [firstDeposit] = await db
    .select({ createdAt: bankLedger.createdAt })
    .from(bankLedger)
    .where(eq(bankLedger.characterId, characterId))
    .orderBy(bankLedger.createdAt)
    .limit(1);

  const since = lastInterest?.createdAt ?? firstDeposit?.createdAt;
  if (!since) return;

  const daysElapsed = Math.floor((Date.now() - since.getTime()) / (24 * 60 * 60 * 1000));
  if (daysElapsed < 1) return;

  let running = balance;
  let totalInterest = 0;
  for (let i = 0; i < daysElapsed; i++) {
    const dayInterest = Math.floor(running * DAILY_INTEREST_RATE);
    running += dayInterest;
    totalInterest += dayInterest;
  }
  if (totalInterest <= 0) return;

  await db.insert(bankLedger).values({
    characterId,
    amount: totalInterest,
    reason: "bank_interest",
    note: `${daysElapsed} day${daysElapsed === 1 ? "" : "s"} of interest`,
  });
}
