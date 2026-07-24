"use client";

import { useEffect, useRef, useState } from "react";

export function ArsenalItemMenu({
  isConsumable,
  canGiftOrTrade,
  onUse,
  onGift,
  onTrade,
  onDeleteAll,
  onDeleteSome,
  hasMultiple,
}: {
  isConsumable: boolean;
  canGiftOrTrade: boolean;
  onUse: () => void;
  onGift: () => void;
  onTrade: () => void;
  onDeleteAll: () => void;
  onDeleteSome: () => void;
  hasMultiple: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function pick(fn: () => void) {
    setOpen(false);
    fn();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] text-ink-400 hover:text-gunmetal-400 px-2 py-1 rounded-md hover:bg-ink-800 transition-colors"
      >
        Actions ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-ink-900 border border-ink-700 rounded-lg shadow-xl overflow-hidden">
          {isConsumable && (
            <button
              type="button"
              onClick={() => pick(onUse)}
              className="w-full text-left text-[11px] px-3 py-2 text-gunmetal-400 hover:bg-ink-800 transition-colors"
            >
              Use
            </button>
          )}
          {canGiftOrTrade && (
            <>
              <button
                type="button"
                onClick={() => pick(onGift)}
                className="w-full text-left text-[11px] px-3 py-2 text-parchment-100 hover:bg-ink-800 transition-colors"
              >
                Gift
              </button>
              <button
                type="button"
                onClick={() => pick(onTrade)}
                className="w-full text-left text-[11px] px-3 py-2 text-parchment-100 hover:bg-ink-800 transition-colors"
              >
                Trade
              </button>
            </>
          )}
          {hasMultiple && (
            <button
              type="button"
              onClick={() => pick(onDeleteSome)}
              className="w-full text-left text-[11px] px-3 py-2 text-claret-500 hover:bg-ink-800 transition-colors"
            >
              Delete some...
            </button>
          )}
          <button
            type="button"
            onClick={() => pick(onDeleteAll)}
            className="w-full text-left text-[11px] px-3 py-2 text-claret-500 hover:bg-ink-800 transition-colors"
          >
            {hasMultiple ? "Delete all" : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}
