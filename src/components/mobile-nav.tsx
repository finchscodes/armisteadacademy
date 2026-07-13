"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { BoardNode } from "@/lib/forum";

const KIND_BADGE: Record<string, string> = {
  class: "class",
  article: "board",
  shop: "shop",
  bank: "bank",
};

export function MobileNav({ tree }: { tree: BoardNode[] }) {
  const [open, setOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const categories = tree.filter((b) => b.kind === "category");
  const active = categories.find((c) => c.id === activeCategoryId) ?? categories[0] ?? null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const panel = (
    <div
      ref={panelRef}
      className="fixed inset-x-0 top-11 bottom-0 bg-ink-900 border-t border-ink-700 z-40 flex flex-col md:hidden"
    >
      <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-ink-700 shrink-0">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategoryId(c.id)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              active?.id === c.id
                ? "bg-brass-500 text-ink-950 border-brass-500"
                : "border-ink-600 text-ink-200"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {active && (
          <div className="space-y-1 mb-4">
            {active.children.length === 0 && active.slug !== "dormitories" ? (
              <p className="text-xs text-ink-400 italic">Empty</p>
            ) : (
              active.children.map((board) => (
                <Link
                  key={board.id}
                  href={board.restrictedToHall ? `/hall/${board.restrictedToHall}` : `/b/${board.slug}`}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-parchment-100 py-1.5 border-b border-ink-800"
                >
                  {board.name}
                  {KIND_BADGE[board.kind] && (
                    <span className="kind-badge ml-1.5 text-[9px] uppercase tracking-wider text-ink-400">
                      {KIND_BADGE[board.kind]}
                    </span>
                  )}
                </Link>
              ))
            )}
            {active.slug === "dormitories" && (
              <>
                <Link
                  href="/jobs"
                  onClick={() => setOpen(false)}
                  className="block text-sm text-parchment-100 py-1.5 border-b border-ink-800"
                >
                  Job List
                  <span className="kind-badge ml-1.5 text-[9px] uppercase tracking-wider text-ink-400">
                    directory
                  </span>
                </Link>
                <Link
                  href="/reputation"
                  onClick={() => setOpen(false)}
                  className="block text-sm text-parchment-100 py-1.5 border-b border-ink-800"
                >
                  Reputation
                  <span className="kind-badge ml-1.5 text-[9px] uppercase tracking-wider text-ink-400">
                    rankings
                  </span>
                </Link>
              </>
            )}
          </div>
        )}

        <Link
          href="/guide"
          onClick={() => setOpen(false)}
          className="block text-sm font-medium text-brass-400 py-2 border-t border-ink-700"
        >
          Rules &amp; Guidelines
        </Link>
      </div>
    </div>
  );

  return (
    <div ref={buttonRef} className="relative md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-ink-200 hover:text-brass-400 transition-colors p-1"
        data-tooltip="Menu"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <path
            d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"}
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && createPortal(panel, document.body)}
    </div>
  );
}
