"use client";

import { useState } from "react";

/**
 * A native number input (keeps the built-in spinner/keyboard behavior)
 * with a decorative "+" shown in front of positive values — native number
 * inputs strip a typed "+" on their own, so this overlays one instead of
 * fighting the input's value directly.
 */
export function RollModifierInput({ name = "rollModifier" }: { name?: string }) {
  const [value, setValue] = useState(0);

  return (
    <div className="relative w-24">
      {value > 0 && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-parchment-100 pointer-events-none">
          +
        </span>
      )}
      <input
        id={name}
        name={name}
        type="number"
        value={value}
        step={1}
        onChange={(e) => setValue(e.target.value === "" ? 0 : Number(e.target.value))}
        className={`w-full rounded-md border border-ink-600 bg-ink-800 py-2 text-sm focus:outline-none focus:border-brass-500 ${
          value > 0 ? "pl-6 pr-2" : "px-3"
        }`}
      />
    </div>
  );
}
