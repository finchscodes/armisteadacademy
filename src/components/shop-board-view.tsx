import { getCurrentUser } from "@/lib/current-user";
import { getCharacterBalance } from "@/lib/economy";
import { getShopItems, getArsenalCount, ARSENAL_CAPACITY } from "@/lib/shops";
import { ShopItemsGrid } from "@/components/shop-items-grid";

export async function ShopBoardView({
  boardId,
  boardName,
  boardDescription,
  boardImageUrl,
}: {
  boardId: number;
  boardName: string;
  boardDescription: string | null;
  boardImageUrl: string | null;
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
      <div className="flex items-start gap-4 mb-6">
        {boardImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={boardImageUrl}
            alt={boardName}
            className="w-20 h-20 sm:w-28 sm:h-20 rounded-lg object-cover border border-ink-700 shrink-0"
          />
        )}
        <div className="min-w-0">
          <h1 className="font-display text-3xl text-gunmetal-400">{boardName}</h1>
          {boardDescription && <p className="text-xs text-ink-400 mt-1 max-w-xl">{boardDescription}</p>}
        </div>
      </div>
      {arsenalCount !== null && (
        <p className="text-xs text-ink-500 mb-6">
          Arsenal: {arsenalCount}/{ARSENAL_CAPACITY}
        </p>
      )}

      <ShopItemsGrid items={shopItems} canBuy={Boolean(current?.activeCharacter)} balance={balance} />
    </div>
  );
}
