import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getActiveTradesForCharacter } from "@/lib/trades";
import { getArsenal } from "@/lib/shops";
import { TradeCard } from "@/components/trade-card";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.activeCharacter) redirect("/characters");

  const characterId = current.activeCharacter.id;
  const [tradesList, myArsenal] = await Promise.all([
    getActiveTradesForCharacter(characterId),
    getArsenal(characterId),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-gunmetal-400 mb-1">Trades</h1>
      <p className="text-ink-400 text-sm mb-6">Pending trades involving {current.activeCharacter.name}.</p>

      {tradesList.length === 0 ? (
        <p className="text-sm text-ink-400 italic">No active trades right now.</p>
      ) : (
        <div className="space-y-3">
          {tradesList.map((trade) => (
            <TradeCard key={trade.id} trade={trade} myCharacterId={characterId} myArsenal={myArsenal} />
          ))}
        </div>
      )}
    </div>
  );
}
