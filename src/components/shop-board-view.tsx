import { getCurrentUser } from "@/lib/current-user";
import { getCharacterBalance } from "@/lib/economy";
import { getShopItems } from "@/lib/shops";
import { ShopItemsSection } from "@/components/shop-items-grid";

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

  const balance = current?.activeCharacter ? await getCharacterBalance(current.activeCharacter.id) : null;

  return (
    <div className="max-w-4xl mx-auto">
      <ShopItemsSection
        boardName={boardName}
        boardDescription={boardDescription}
        boardImageUrl={boardImageUrl}
        items={shopItems}
        canBuy={Boolean(current?.activeCharacter)}
        balance={balance}
      />
    </div>
  );
}
