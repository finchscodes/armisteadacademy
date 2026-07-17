"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { purchaseItemAction } from "@/actions/shops";

type Item = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  imageUrl: string | null;
};

export function ShopItemCard({
  item,
  canBuy,
  balance,
}: {
  item: Item;
  canBuy: boolean;
  balance: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [arsenalFull, setArsenalFull] = useState(false);
  const [bought, setBought] = useState(false);

  const outOfStock = item.stock !== null && item.stock <= 0;
  const canAfford = balance !== null && balance >= item.price;

  function handleBuy() {
    setError(null);
    setBought(false);
    startTransition(async () => {
      const result = await purchaseItemAction(item.id);
      if (result.arsenalFull) {
        setArsenalFull(true);
      } else if (result.error) {
        setError(result.error);
      } else {
        setBought(true);
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="bg-ink-900 border border-ink-700 rounded-lg p-4 flex flex-col">
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover rounded-md mb-3" />
        )}
        <p className="text-sm font-medium text-parchment-100">{item.name}</p>
        {item.description && <p className="text-xs text-ink-400 mt-1 flex-1">{item.description}</p>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gunmetal-400 font-medium">{item.price} dollars</span>
          {item.stock !== null && (
            <span className="text-[11px] text-ink-500">{item.stock} left</span>
          )}
        </div>

        {canBuy ? (
          <button
            type="button"
            onClick={handleBuy}
            disabled={pending || outOfStock || !canAfford}
            className="mt-3 text-xs bg-gunmetal-500 text-ink-950 px-3 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending
              ? "Buying..."
              : outOfStock
                ? "Out of stock"
                : !canAfford
                  ? "Can't afford"
                  : bought
                    ? "Bought!"
                    : "Buy"}
          </button>
        ) : (
          <p className="text-[11px] text-ink-500 mt-3">Pick a character to shop.</p>
        )}
        {error && <p className="text-xs text-claret-500 mt-1">{error}</p>}
      </div>

      {arsenalFull && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-ink-900 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 p-6 max-w-sm text-center">
            <p className="font-display text-xl text-gunmetal-400 mb-2">Arsenal full</p>
            <p className="text-sm text-ink-300 mb-5">
              Your arsenal can only hold 100 items. Head to your profile&apos;s Arsenal tab and clear
              some space before buying more.
            </p>
            <button
              type="button"
              onClick={() => setArsenalFull(false)}
              className="text-sm bg-gunmetal-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
