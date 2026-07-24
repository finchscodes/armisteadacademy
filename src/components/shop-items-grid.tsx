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

export function ShopItemsGrid({
  items,
  canBuy,
  balance,
}: {
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

  if (items.length === 0) {
    return <p className="text-sm text-ink-400 italic">Nothing for sale here yet.</p>;
  }

  return (
    <div>
      {categories.length > 1 && (
        <div className="mb-4">
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

      {visibleItems.length === 0 ? (
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
