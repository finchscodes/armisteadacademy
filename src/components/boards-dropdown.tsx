"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BoardNode } from "@/lib/forum";

const KIND_BADGE: Record<string, string> = {
  class: "class",
  article: "board",
};

/**
 * Wide multi-column mega-menu, matching the World of Potter style: every
 * category gets its own column, all visible at once — no inner scrolling to
 * hunt through a narrow list.
 */
export function BoardsDropdown({
  tree,
  label,
  excludeCategorySlugs = [],
  onlyCategorySlugs,
}: {
  tree: BoardNode[];
  label: string;
  /** Hide these categories from this menu instance. */
  excludeCategorySlugs?: string[];
  /** If set, show ONLY these categories (takes priority over excludeCategorySlugs). */
  onlyCategorySlugs?: string[];
}) {
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

  const allCategories = tree.filter((b) => b.kind === "category");
  const categories = onlyCategorySlugs
    ? allCategories.filter((c) => onlyCategorySlugs.includes(c.slug))
    : allCategories.filter((c) => !excludeCategorySlugs.includes(c.slug));
  const uncategorized = onlyCategorySlugs ? [] : tree.filter((b) => b.kind !== "category");

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-ink-200 hover:text-brass-400 transition-colors flex items-center gap-1"
      >
        {label}
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
        <div
          className={`fixed left-1/2 -translate-x-1/2 mt-2 max-h-[85vh] overflow-y-auto bg-ink-900 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 p-4 z-30 ${
            categories.length === 1 && uncategorized.length === 0
              ? "w-[min(92vw,760px)]"
              : "w-[min(97vw,1240px)]"
          }`}
        >
          {categories.length === 1 && uncategorized.length === 0 ? (
            <div>
              <p className="font-display text-xs text-brass-400 mb-1.5 pb-1 border-b border-ink-700">
                {categories[0].name}
              </p>
              <div className="space-y-0.5">
                {categories[0].children.length === 0 ? (
                  <p className="text-[11px] text-ink-400 italic">Empty</p>
                ) : (
                  categories[0].children.map((board) => (
                    <Link
                      key={board.id}
                      href={board.restrictedToHall ? `/hall/${board.restrictedToHall}` : `/b/${board.slug}`}
                      onClick={() => setOpen(false)}
                      className="block text-xs leading-tight py-0.5 text-parchment-100 hover:text-brass-400 transition-colors"
                    >
                      {board.name}
                      {KIND_BADGE[board.kind] && (
                        <span className="kind-badge ml-1 text-[8px] uppercase tracking-wider text-ink-400">
                          {KIND_BADGE[board.kind]}
                        </span>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-4 xl:grid-cols-6 gap-x-5 gap-y-3">
            {categories
              .filter((c) => c.slug !== "communications")
              .map((category) => {
                const communications =
                  category.slug === "dormitories"
                    ? categories.find((c) => c.slug === "communications")
                    : null;
                return (
                  <div key={category.id}>
                    <p className="font-display text-xs text-brass-400 mb-1.5 pb-1 border-b border-ink-700">
                      {category.name}
                    </p>
                    <div className="space-y-0.5">
                      {category.children.length === 0 && category.slug !== "dormitories" ? (
                        <p className="text-[11px] text-ink-400 italic">Empty</p>
                      ) : (
                        category.children.map((board) => (
                          <Link
                            key={board.id}
                            href={board.restrictedToHall ? `/hall/${board.restrictedToHall}` : `/b/${board.slug}`}
                            onClick={() => setOpen(false)}
                            className="block text-xs leading-tight py-0.5 text-parchment-100 hover:text-brass-400 transition-colors"
                          >
                            {board.name}
                            {KIND_BADGE[board.kind] && (
                              <span className="kind-badge ml-1 text-[8px] uppercase tracking-wider text-ink-400">
                                {KIND_BADGE[board.kind]}
                              </span>
                            )}
                          </Link>
                        ))
                      )}
                      {/* Job List and Reputation live with the dorms — they're pages, not real topic areas. */}
                      {category.slug === "dormitories" && (
                        <>
                          <Link
                            href="/jobs"
                            onClick={() => setOpen(false)}
                            className="block text-xs leading-tight py-0.5 text-parchment-100 hover:text-brass-400 transition-colors"
                          >
                            Job List
                            <span className="kind-badge ml-1 text-[8px] uppercase tracking-wider text-ink-400">
                              directory
                            </span>
                          </Link>
                          <Link
                            href="/reputation"
                            onClick={() => setOpen(false)}
                            className="block text-xs leading-tight py-0.5 text-parchment-100 hover:text-brass-400 transition-colors"
                          >
                            Reputation
                            <span className="kind-badge ml-1 text-[8px] uppercase tracking-wider text-ink-400">
                              rankings
                            </span>
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Communications rides along in the same column as Dormitories —
                        no gap, just a label acting as a natural divider between them. */}
                    {communications && (
                      <>
                        <p className="font-display text-xs text-brass-400 mb-1.5 pb-1 border-b border-ink-700 mt-3">
                          {communications.name}
                        </p>
                        <div className="space-y-0.5">
                          {communications.children.map((board) => (
                            <Link
                              key={board.id}
                              href={board.restrictedToHall ? `/hall/${board.restrictedToHall}` : `/b/${board.slug}`}
                              onClick={() => setOpen(false)}
                              className="block text-xs leading-tight py-0.5 text-parchment-100 hover:text-brass-400 transition-colors"
                            >
                              {board.name}
                              {KIND_BADGE[board.kind] && (
                                <span className="kind-badge ml-1 text-[8px] uppercase tracking-wider text-ink-400">
                                  {KIND_BADGE[board.kind]}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

            {uncategorized.length > 0 && (
              <div>
                <p className="font-display text-xs text-brass-400 mb-1.5 pb-1 border-b border-ink-700">
                  Other
                </p>
                <div className="space-y-0.5">
                  {uncategorized.map((board) => (
                    <Link
                      key={board.id}
                      href={board.restrictedToHall ? `/hall/${board.restrictedToHall}` : `/b/${board.slug}`}
                      onClick={() => setOpen(false)}
                      className="block text-xs leading-tight py-0.5 text-parchment-100 hover:text-brass-400 transition-colors"
                    >
                      {board.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
