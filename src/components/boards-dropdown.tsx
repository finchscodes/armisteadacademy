"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BoardNode } from "@/lib/forum";

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
        <div className="absolute right-0 mt-2 w-72 bg-ink-900 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 py-2 z-30 max-h-[70vh] overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id} className="mb-1 last:mb-0">
              <p className="px-4 py-1 text-[11px] uppercase tracking-wider text-ink-400">
                {category.name}
              </p>
              {category.children.map((board) => (
                <Link
                  key={board.id}
                  href={`/b/${board.slug}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-1.5 text-sm text-parchment-100 hover:bg-ink-800 hover:text-brass-400 transition-colors"
                >
                  {board.name}
                  {board.kind === "class" && (
                    <span className="ml-1.5 text-[9px] uppercase tracking-wider text-claret-500">
                      class
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}

          {uncategorized.map((board) => (
            <Link
              key={board.id}
              href={`/b/${board.slug}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-1.5 text-sm text-parchment-100 hover:bg-ink-800 hover:text-brass-400 transition-colors"
            >
              {board.name}
            </Link>
          ))}

          <div className="border-t border-ink-700 mt-2 pt-2">
            <Link
              href="/boards"
              onClick={() => setOpen(false)}
              className="block px-4 py-1.5 text-xs text-ink-400 hover:text-brass-400 transition-colors"
            >
              View all boards &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
