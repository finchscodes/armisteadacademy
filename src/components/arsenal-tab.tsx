"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInventoryItemAction } from "@/actions/shops";
import type { ArsenalRow } from "@/lib/shops";

export function ArsenalTab({ items, isOwner }: { items: ArsenalRow[]; isOwner: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(inventoryId: number) {
    if (!confirm("Remove this from your arsenal?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("inventoryId", String(inventoryId));
      await deleteInventoryItemAction(formData);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-ink-400 italic">Nothing in the arsenal yet.</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((row) => (
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
          <p className="text-[11px] text-ink-500 mt-2">From {row.shopName}</p>
          {isOwner && (
            <button
              type="button"
              onClick={() => handleDelete(row.id)}
              disabled={pending}
              className="text-[11px] text-claret-500 hover:text-claret-400 mt-2 text-left disabled:opacity-60"
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
