"use client";

import { useActionState } from "react";
import { adminCreateGiftRuleAction } from "@/actions/admin";

type ItemOption = { id: number; name: string; shopName: string };

const TRIGGER_LABELS: Record<string, string> = {
  birthday: "Birthday (character ages up)",
};

export function GiftRuleForm({ items }: { items: ItemOption[] }) {
  const [state, formAction, pending] = useActionState(adminCreateGiftRuleAction, undefined);

  return (
    <form action={formAction} className="space-y-3 bg-ink-900 border border-ink-700 rounded-lg p-4 mb-6">
      <h3 className="font-display text-base text-parchment-100 mb-1">Add a rule</h3>
      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="trigger">
          Trigger
        </label>
        <select
          id="trigger"
          name="trigger"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
        >
          {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="itemId">
            Item to send
          </label>
          <select
            id="itemId"
            name="itemId"
            required
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          >
            <option value="">Choose...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.shopName})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="quantity">
            Quantity
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={999}
            defaultValue={1}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="senderLabel">
          Shown as from
        </label>
        <input
          id="senderLabel"
          name="senderLabel"
          defaultValue="The Spymaster"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="message">
          Message (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={2}
          maxLength={500}
          placeholder="Happy birthday!"
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
        />
      </div>
      {state?.error && <p className="text-xs text-claret-500">{state.error}</p>}
      {state?.success && <p className="text-xs text-gunmetal-400">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-sm bg-gunmetal-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add rule"}
      </button>
    </form>
  );
}
