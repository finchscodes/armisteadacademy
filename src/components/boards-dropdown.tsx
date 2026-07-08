"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BoardNode } from "@/lib/forum";

/**
 * Wide multi-column mega-menu, matching the World of Potter style: every
 * category gets its own column, all visible at once — no inner scrolling to
 * hunt through a narrow list.
 */
export function BoardsDropdown({ tree }: { tree: BoardNode[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const categories = tree.filter((b) => b.kind === "category");
  const uncategorized = tree.filter((b) => b.kind !== "category");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-ink-200 hover:text-brass-400 transition-colors flex items-center gap-1"
      >
        Boards
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {open && (
        <div className="fixed left-1/2 -translate-x-1/2 mt-2 w-[min(96vw,1100px)] bg-ink-900 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 p-6 z-30 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
            {categories.map((category) => (
              <div key={category.id}>
                <p className="font-display text-sm text-brass-400 mb-2 pb-1 border-b border-ink-700">
                  {category.name}
                </p>
                <div className="space-y-1">
                  {category.children.length === 0 ? (
                    <p className="text-xs text-ink-400 italic">Empty</p>
                  ) : (
                    category.children.map((board) => (
                      <Link
                        key={board.id}
                        href={`/b/${board.slug}`}
                        onClick={() => setOpen(false)}
                        className="block text-sm text-parchment-100 hover:text-brass-400 transition-colors"
                      >
                        {board.name}
                        {board.kind === "class" && (
                          <span className="ml-1.5 text-[9px] uppercase tracking-wider text-claret-500">
                            class
                          </span>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ))}

            {uncategorized.length > 0 && (
              <div>
                <p className="font-display text-sm text-brass-400 mb-2 pb-1 border-b border-ink-700">
                  Other
                </p>
                <div className="space-y-1">
                  {uncategorized.map((board) => (
                    <Link
                      key={board.id}
                      href={`/b/${board.slug}`}
                      onClick={() => setOpen(false)}
                      className="block text-sm text-parchment-100 hover:text-brass-400 transition-colors"
                    >
                      {board.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-ink-700 mt-6 pt-4">
            <Link
              href="/boards"
              onClick={() => setOpen(false)}
              className="text-xs text-ink-400 hover:text-brass-400 transition-colors"
            >
              View all boards &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
