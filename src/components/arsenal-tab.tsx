"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInventoryItemAction, consumeItemAction } from "@/actions/shops";
import type { ArsenalRow } from "@/lib/shops";

export function ArsenalTab({ items, isOwner }: { items: ArsenalRow[]; isOwner: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [consumeError, setConsumeError] = useState<string | null>(null);

  function handleDelete(inventoryId: number) {
    if (!confirm("Remove this from your arsenal?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("inventoryId", String(inventoryId));
      await deleteInventoryItemAction(formData);
      router.refresh();
    });
  }

  function handleConsume(inventoryId: number) {
    setConsumeError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("inventoryId", String(inventoryId));
      const result = await consumeItemAction(undefined, formData);
      if (result?.error) setConsumeError(result.error);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-ink-400 italic">Nothing in the arsenal yet.</p>;
  }

  return (
    <div>
      {consumeError && <p className="text-sm text-claret-500 mb-3">{consumeError}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((row) => {
          const isConsumable = Boolean(row.hungerRestore || row.thirstRestore);
          return (
            <div key={row.id} className="bg-ink-900 border border-ink-700 rounded-lg p-4 flex flex-col">
              {row.itemImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.itemImageUrl}
                  alt={row.itemName}
                  className="w-full h-28 object-cover rounded-md mb-3"
                />
              )}
              <p className="text-sm font-medium text-parchment-100">
                {row.itemName}
                {row.quantity > 1 && <span className="text-ink-400"> ×{row.quantity}</span>}
              </p>
              {row.itemDescription && (
                <p className="text-xs text-ink-400 mt-1 flex-1">{row.itemDescription}</p>
              )}
              {isConsumable && (
                <p className="text-[11px] text-gunmetal-400 mt-1">
                  {row.hungerRestore ? `+${row.hungerRestore}% hunger` : ""}
                  {row.hungerRestore && row.thirstRestore ? " · " : ""}
                  {row.thirstRestore ? `+${row.thirstRestore}% thirst` : ""}
                </p>
              )}
              <p className="text-[11px] text-ink-500 mt-2">From {row.shopName}</p>
              {isOwner && (
                <div className="flex items-center gap-3 mt-2">
                  {isConsumable && (
                    <button
                      type="button"
                      onClick={() => handleConsume(row.id)}
                      disabled={pending}
                      className="text-[11px] text-gunmetal-400 hover:text-gunmetal-300 text-left disabled:opacity-60"
                    >
                      Use
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(row.id)}
                    disabled={pending}
                    className="text-[11px] text-claret-500 hover:text-claret-400 text-left disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
