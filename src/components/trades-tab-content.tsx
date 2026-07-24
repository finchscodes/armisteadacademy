import { getActiveTradesForCharacter } from "@/lib/trades";
import { getArsenal } from "@/lib/shops";
import { TradeCard } from "@/components/trade-card";

export async function TradesTabContent({ characterId }: { characterId: number }) {
  const [tradesList, myArsenal] = await Promise.all([
    getActiveTradesForCharacter(characterId),
    getArsenal(characterId),
  ]);

  if (tradesList.length === 0) {
    return <p className="text-sm text-ink-400 italic">No active trades right now.</p>;
  }

  return (
    <div className="space-y-3">
      {tradesList.map((trade) => (
        <TradeCard key={trade.id} trade={trade} myCharacterId={characterId} myArsenal={myArsenal} />
      ))}
    </div>
  );
}
