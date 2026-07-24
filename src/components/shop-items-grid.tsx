"use client";

import { useMemo, useState } from "react";
import { ShopItemCard } from "@/components/shop-item-card";

type Item = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  imageUrl: string | null;
  isPet: boolean;
  category: string | null;
};

const UNCATEGORIZED = "Other";

export function ShopItemsSection({
  boardName,
  boardDescription,
  boardImageUrl,
  items,
  canBuy,
  balance,
}: {
  boardName: string;
  boardDescription: string | null;
  boardImageUrl: string | null;
  items: Item[];
  canBuy: boolean;
  balance: number | null;
}) {
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category || UNCATEGORIZED));
    return [...set].sort();
  }, [items]);

  const [selected, setSelected] = useState("all");

  const visibleItems = selected === "all" ? items : items.filter((i) => (i.category || UNCATEGORIZED) === selected);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4 min-w-0">
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
        {categories.length > 1 && (
          <div className="shrink-0">
            <label htmlFor="category-filter" className="sr-only">
              Filter by category
            </label>
            <select
              id="category-filter"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="text-sm rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-gunmetal-500"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-ink-400 italic">Nothing for sale here yet.</p>
      ) : visibleItems.length === 0 ? (
        <p className="text-sm text-ink-400 italic">Nothing in this category.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleItems.map((item) => (
            <ShopItemCard key={item.id} item={item} canBuy={canBuy} balance={balance} />
          ))}
        </div>
      )}
    </div>
  );
}
