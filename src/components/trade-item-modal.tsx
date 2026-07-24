"use client";

import { useActionState, useEffect } from "react";
import { proposeTradeAction } from "@/actions/trades";
import { CharacterNameAutocomplete } from "@/components/character-name-autocomplete";

export function TradeItemModal({
  itemId,
  itemName,
  maxQuantity,
  onClose,
  onSuccess,
}: {
  itemId: number;
  itemName: string;
  maxQuantity: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(proposeTradeAction, undefined);

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-ink-900 border border-ink-700 rounded-lg p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg text-parchment-100 mb-1">Trade {itemName}</h3>
        <p className="text-xs text-ink-400 mb-4">
          This item leaves your arsenal now and holds until they counter-offer and you approve. Check{" "}
          <span className="text-gunmetal-400">Trades</span> on your profile to manage it, including cancelling.
        </p>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="itemId" value={itemId} />
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="targetCharacterName">
              Character&apos;s name
            </label>
            <CharacterNameAutocomplete id="targetCharacterName" name="targetCharacterName" required />
          </div>
          {maxQuantity > 1 && (
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="quantity">
                Quantity (you have {maxQuantity})
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                max={maxQuantity}
                defaultValue={1}
                className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
              />
            </div>
          )}
          {maxQuantity <= 1 && <input type="hidden" name="quantity" value={1} />}
          {state?.error && <p className="text-xs text-claret-500">{state.error}</p>}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="text-sm bg-gunmetal-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
            >
              {pending ? "Proposing..." : "Propose trade"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-ink-400 hover:text-parchment-100 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
