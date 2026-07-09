import { eq, sum } from "drizzle-orm";
import { db } from "@/db";
import { currencyLedger } from "@/db/schema";

/**
 * A character's balance is always derived from the ledger (sum of all entries),
 * never stored directly. This keeps every credit/debit auditable.
 */
export async function getCharacterBalance(characterId: number): Promise<number> {
  const [row] = await db
    .select({ total: sum(currencyLedger.amount) })
    .from(currencyLedger)
    .where(eq(currencyLedger.characterId, characterId));

  return Number(row?.total ?? 0);
}
