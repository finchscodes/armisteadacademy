"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/boards", label: "Boards" },
  { href: "/admin/guide", label: "Guidebook" },
  { href: "/admin/home-board", label: "Home Board" },
  { href: "/admin/hall-welcome", label: "Hall Welcome" },
  { href: "/admin/sorting-quiz", label: "Sorting Quiz" },
  { href: "/admin/grading", label: "Grading" },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-ink-700 pb-px">
      {SECTIONS.map((s) => {
        const isActive = pathname === s.href || pathname?.startsWith(s.href + "/");
        return (
          <Link
            key={s.href}
            href={s.href}
            className={`text-sm px-3 py-2 border-b-2 transition-colors ${
              isActive
                ? "border-brass-500 text-brass-400"
                : "border-transparent text-ink-200 hover:text-brass-400 hover:border-ink-600"
            }`}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
