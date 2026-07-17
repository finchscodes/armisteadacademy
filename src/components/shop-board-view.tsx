import { getCurrentUser } from "@/lib/current-user";
import { getCharacterBalance } from "@/lib/economy";
import { getShopItems, getArsenalCount, ARSENAL_CAPACITY } from "@/lib/shops";
import { ShopItemCard } from "@/components/shop-item-card";

export async function ShopBoardView({
  boardId,
  boardName,
  boardDescription,
}: {
  boardId: number;
  boardName: string;
  boardDescription: string | null;
}) {
  const [current, shopItems] = await Promise.all([getCurrentUser(), getShopItems(boardId)]);

  const [balance, arsenalCount] = current?.activeCharacter
    ? await Promise.all([
        getCharacterBalance(current.activeCharacter.id),
        getArsenalCount(current.activeCharacter.id),
      ])
    : [null, null];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl text-gunmetal-400">{boardName}</h1>
        {balance !== null && (
          <p className="text-sm text-ink-400">
            You have <span className="text-parchment-100 font-medium">{balance}</span> dollars
          </p>
        )}
      </div>
      {boardDescription && <p className="text-ink-400 text-sm mb-6">{boardDescription}</p>}
      {arsenalCount !== null && (
        <p className="text-xs text-ink-500 mb-6">
          Arsenal: {arsenalCount}/{ARSENAL_CAPACITY}
        </p>
      )}

      {shopItems.length === 0 ? (
        <p className="text-sm text-ink-400 italic">Nothing for sale here yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shopItems.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              canBuy={Boolean(current?.activeCharacter)}
              balance={balance}
            />
          ))}
        </div>
      )}
    </div>
  );
}
