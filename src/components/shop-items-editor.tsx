"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  adminCreateItemAction,
  adminUpdateItemAction,
  adminDeleteItemAction,
  reorderShopItemsAction,
} from "@/actions/admin";
import { DraggableList } from "@/components/draggable-list";

type Item = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  imageUrl: string | null;
};

function ItemForm({
  boardId,
  item,
  onDone,
}: {
  boardId: number;
  item?: Item;
  onDone?: () => void;
}) {
  const action = item ? adminUpdateItemAction : adminCreateItemAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-3 bg-ink-800/40 border border-ink-700 rounded-lg p-4">
      <input type="hidden" name="boardId" value={boardId} />
      {item && <input type="hidden" name="itemId" value={item.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Name</label>
          <input
            name="name"
            defaultValue={item?.name}
            required
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm focus:outline-none focus:border-gunmetal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Price</label>
          <input
            name="price"
            type="number"
            min={0}
            defaultValue={item?.price ?? 0}
            required
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm focus:outline-none focus:border-gunmetal-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Description</label>
        <textarea
          name="description"
          defaultValue={item?.description ?? ""}
          rows={2}
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm focus:outline-none focus:border-gunmetal-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Stock (blank = unlimited)</label>
          <input
            name="stock"
            type="number"
            min={0}
            defaultValue={item?.stock ?? ""}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm focus:outline-none focus:border-gunmetal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Image URL (optional)</label>
          <input
            name="imageUrl"
            defaultValue={item?.imageUrl ?? ""}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm focus:outline-none focus:border-gunmetal-500"
          />
        </div>
      </div>

      {state?.error && <p className="text-xs text-claret-500">{state.error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
        >
          {pending ? "Saving..." : item ? "Save item" : "Add item"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-xs text-ink-400 hover:text-parchment-100 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function ShopItemsEditor({ boardId, items }: { boardId: number; items: Item[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function handleReorder(orderedIds: number[]) {
    const formData = new FormData();
    formData.set("boardId", String(boardId));
    formData.set("orderedIds", orderedIds.join(","));
    await reorderShopItemsAction(formData);
  }

  async function handleDelete(itemId: number) {
    if (!confirm("Delete this item? Anyone already holding it in their arsenal keeps it.")) return;
    const formData = new FormData();
    formData.set("itemId", String(itemId));
    formData.set("boardId", String(boardId));
    await adminDeleteItemAction(formData);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <DraggableList
        items={items}
        getId={(i) => i.id}
        onReorder={handleReorder}
        emptyState={<p className="text-sm text-ink-400 italic px-1">No items yet.</p>}
        renderItem={(item) =>
          editingId === item.id ? (
            <div className="flex-1">
              <ItemForm boardId={boardId} item={item} onDone={() => setEditingId(null)} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <p className="text-sm text-parchment-100 truncate">{item.name}</p>
                <p className="text-xs text-ink-400">
                  {item.price} dollars
                  {item.stock !== null && ` · ${item.stock} in stock`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingId(item.id)}
                  className="text-xs text-gunmetal-400 hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-claret-500 hover:text-claret-400"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        }
      />

      {showNew ? (
        <ItemForm boardId={boardId} onDone={() => setShowNew(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="text-xs bg-ink-800 border border-ink-600 text-parchment-100 px-3 py-1.5 rounded-md hover:border-gunmetal-500/50 transition-colors"
        >
          + Add item
        </button>
      )}
    </div>
  );
}
