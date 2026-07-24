"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/boards", label: "Boards" },
  { href: "/admin/guide", label: "Guidebook" },
  { href: "/admin/home-board", label: "Home Board" },
  { href: "/admin/privacy", label: "Privacy Policy" },
  { href: "/admin/confessions", label: "Confessions" },
  { href: "/admin/hall-welcome", label: "Hall Welcome" },
  { href: "/admin/sorting-quiz", label: "Sorting Quiz" },
  { href: "/admin/grading", label: "Grading" },
  { href: "/admin/mass-message", label: "Mass Message" },
  { href: "/admin/banned-ips", label: "Banned IPs" },
  { href: "/admin/game-time", label: "Game Time" },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 w-full lg:w-56 shrink-0">
      {SECTIONS.map((s) => {
        const isActive = pathname === s.href || pathname?.startsWith(s.href + "/");
        return (
          <Link
            key={s.href}
            href={s.href}
            className={`text-sm px-4 py-3 rounded-lg border transition-colors ${
              isActive
                ? "border-gunmetal-500 bg-gunmetal-500/10 text-gunmetal-400"
                : "border-ink-700 bg-ink-900 text-ink-200 hover:border-ink-600 hover:text-gunmetal-400"
            }`}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
