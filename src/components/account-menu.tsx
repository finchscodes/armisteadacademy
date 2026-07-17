"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CharacterSwitcher } from "./character-switcher";
import { CharacterBadge } from "./character-badge";
import { logoutAction } from "@/actions/auth";
import { getMajorColor } from "@/lib/majors";
import { CoinIcon } from "@/components/nav-icons";

type Character = { id: number; firstName: string; lastName: string };

export function AccountMenu({
  characters,
  activeCharacter,
  balance,
  level,
  xpIntoLevel,
  xpForLevel,
  isAdmin,
  canAccessAdminPanel = false,
}: {
  characters: Character[];
  activeCharacter: {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    slug: string;
    avatarUrl: string | null;
    major: string;
  } | null;
  balance: number | null;
  level: number | null;
  xpIntoLevel: number | null;
  xpForLevel: number | null;
  isAdmin: boolean;
  /** True admin, or a character holding a job the limited admin panel grants access to. */
  canAccessAdminPanel?: boolean;
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="block rounded-md ring-2 ring-transparent hover:ring-gunmetal-500/50 transition-all"
        data-tooltip="Account menu" data-tooltip-side="bottom-left"
      >
        <CharacterBadge
          name={activeCharacter?.name ?? "?"}
          avatarUrl={activeCharacter?.avatarUrl ?? null}
          size="sm"
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-ink-900 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 z-30">
          <div className="p-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Posting as</p>
              <CharacterSwitcher characters={characters} activeCharacterId={activeCharacter?.id ?? null} />
            </div>

            {activeCharacter && (
              <Link
                href={`/c/${activeCharacter.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 hover:bg-ink-800/60 -mx-4 px-4 py-2 transition-colors"
              >
                <CharacterBadge name={activeCharacter.name} avatarUrl={activeCharacter.avatarUrl} />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-ink-400 truncate">
                    {activeCharacter.firstName}
                  </p>
                  <p
                    className="font-display text-lg -mt-1 truncate"
                    style={{ color: getMajorColor(activeCharacter.major) ?? undefined }}
                  >
                    {activeCharacter.lastName}
                  </p>
                </div>
              </Link>
            )}

            {balance !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-400">Money</span>
                <span className="text-gunmetal-400 flex items-center gap-1 font-mono">
                  <CoinIcon className="w-3.5 h-3.5" />
                  {balance}
                </span>
              </div>
            )}

            {level !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-400">Level</span>
                <span className="text-ink-200 font-mono">
                  Lv {level}
                  <span className="text-xs text-ink-400 ml-1.5">
                    ({xpIntoLevel}/{xpForLevel} xp)
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-ink-700 py-1.5">
            <Link
              href="/characters"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-ink-200 hover:bg-ink-800/60 hover:text-gunmetal-400 transition-colors"
            >
              Characters
            </Link>
            {activeCharacter && (
              <Link
                href={`/c/${activeCharacter.slug}/edit`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-ink-200 hover:bg-ink-800/60 hover:text-gunmetal-400 transition-colors"
              >
                Edit Profile
              </Link>
            )}
            {canAccessAdminPanel && (
              <Link
                href={isAdmin ? "/admin/users" : "/admin"}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-claret-500 hover:bg-ink-800/60 hover:text-claret-400 transition-colors"
              >
                Admin
              </Link>
            )}
          </div>

          <form action={logoutAction} className="border-t border-ink-700 py-1.5">
            <button className="w-full text-left px-4 py-2 text-sm text-ink-400 hover:bg-ink-800/60 hover:text-claret-500 transition-colors">
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
