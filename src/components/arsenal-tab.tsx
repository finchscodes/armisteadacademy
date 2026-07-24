"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteInventoryItemAction,
  massDeleteInventoryAction,
  deleteInventoryQuantityAction,
  consumeItemAction,
} from "@/actions/shops";
import { useToast } from "@/components/toast-provider";
import { ArsenalItemMenu } from "@/components/arsenal-item-menu";
import { GiftItemModal } from "@/components/gift-item-modal";
import { TradeItemModal } from "@/components/trade-item-modal";
import type { ArsenalRow } from "@/lib/shops";

export function ArsenalTab({ items, isOwner }: { items: ArsenalRow[]; isOwner: boolean }) {
  const router = useRouter();
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [giftTarget, setGiftTarget] = useState<ArsenalRow | null>(null);
  const [tradeTarget, setTradeTarget] = useState<ArsenalRow | null>(null);
  const [deleteSomeTarget, setDeleteSomeTarget] = useState<ArsenalRow | null>(null);
  const [deleteSomeQty, setDeleteSomeQty] = useState(1);

  function handleDelete(inventoryId: number) {
    if (!confirm("Remove this from your arsenal?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("inventoryId", String(inventoryId));
      await deleteInventoryItemAction(formData);
      router.refresh();
    });
  }

  function handleDeleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Remove ${selected.size} item${selected.size > 1 ? "s" : ""} from your arsenal?`)) return;
    startTransition(async () => {
      const formData = new FormData();
      selected.forEach((id) => formData.append("inventoryIds", String(id)));
      await massDeleteInventoryAction(formData);
      setSelected(new Set());
      setSelectMode(false);
      router.refresh();
    });
  }

  function handleDeleteSome() {
    if (!deleteSomeTarget) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("inventoryId", String(deleteSomeTarget.id));
      formData.set("quantity", String(deleteSomeQty));
      await deleteInventoryQuantityAction(formData);
      setDeleteSomeTarget(null);
      router.refresh();
    });
  }

  function handleConsume(inventoryId: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("inventoryId", String(inventoryId));
      const result = await consumeItemAction(undefined, formData);
      if (result?.error) showToast(result.error, "error");
      else if (result?.success) showToast(result.success, "success");
      router.refresh();
    });
  }

  function toggleSelected(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-ink-400 italic">Nothing in the arsenal yet.</p>;
  }

  return (
    <div>
      {isOwner && (
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => {
              setSelectMode((s) => !s);
              setSelected(new Set());
            }}
            className="text-xs text-ink-400 hover:text-gunmetal-400"
          >
            {selectMode ? "Cancel selecting" : "Select items..."}
          </button>
          {selectMode && selected.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={pending}
              className="text-xs text-claret-500 hover:text-claret-400 disabled:opacity-60"
            >
              Delete selected ({selected.size})
            </button>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((row) => {
          const isConsumable = Boolean(row.hungerRestore || row.thirstRestore);
          const isSelected = selected.has(row.id);
          return (
            <div
              key={row.id}
              className={`bg-ink-900 border rounded-lg p-4 flex flex-col relative ${
                isSelected ? "border-gunmetal-500" : "border-ink-700"
              }`}
            >
              {selectMode && isOwner && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelected(row.id)}
                  className="absolute top-3 right-3 z-10 w-4 h-4"
                />
              )}
              {row.itemImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.itemImageUrl}
                  alt={row.itemName}
                  className="w-full h-28 object-cover rounded-md mb-3"
                />
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-parchment-100">{row.itemName}</p>
                {row.quantity > 1 && (
                  <span className="text-[11px] bg-ink-800 border border-ink-600 rounded-full px-2 py-0.5 text-gunmetal-400 shrink-0">
                    ×{row.quantity}
                  </span>
                )}
              </div>
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
              {isOwner && !selectMode && (
                <div className="flex justify-end mt-2">
                  <ArsenalItemMenu
                    isConsumable={isConsumable}
                    canGiftOrTrade={true}
                    hasMultiple={row.quantity > 1}
                    onUse={() => handleConsume(row.id)}
                    onGift={() => setGiftTarget(row)}
                    onTrade={() => setTradeTarget(row)}
                    onDeleteAll={() => handleDelete(row.id)}
                    onDeleteSome={() => {
                      setDeleteSomeTarget(row);
                      setDeleteSomeQty(1);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {giftTarget && (
        <GiftItemModal
          inventoryId={giftTarget.id}
          itemName={giftTarget.itemName}
          maxQuantity={giftTarget.quantity}
          onClose={() => setGiftTarget(null)}
          onSuccess={() => {
            showToast("Gift sent", "success");
            setGiftTarget(null);
            router.refresh();
          }}
        />
      )}

      {tradeTarget && (
        <TradeItemModal
          itemId={tradeTarget.itemId}
          itemName={tradeTarget.itemName}
          maxQuantity={tradeTarget.quantity}
          onClose={() => setTradeTarget(null)}
          onSuccess={() => {
            showToast("Trade proposed", "success");
            setTradeTarget(null);
            router.refresh();
          }}
        />
      )}

      {deleteSomeTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setDeleteSomeTarget(null)}
        >
          <div
            className="bg-ink-900 border border-ink-700 rounded-lg p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg text-parchment-100 mb-3">
              Delete how many {deleteSomeTarget.itemName}?
            </h3>
            <input
              type="number"
              min={1}
              max={deleteSomeTarget.quantity}
              value={deleteSomeQty}
              onChange={(e) => setDeleteSomeQty(Number(e.target.value))}
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500 mb-4"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteSome}
                disabled={pending}
                className="text-sm bg-claret-600 text-parchment-100 px-4 py-2 rounded-md font-medium hover:bg-claret-500 transition-colors disabled:opacity-60"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteSomeTarget(null)}
                className="text-sm text-ink-400 hover:text-parchment-100 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
