"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { getMiniProfileAction, type MiniProfile } from "@/actions/mini-profile";
import { CharacterBadge } from "./character-badge";

const cache = new Map<number, MiniProfile>();

export function CharacterHoverCard({
  characterId,
  slug,
  className = "relative inline-block",
  children,
}: {
  characterId: number;
  slug: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<MiniProfile | null>(cache.get(characterId) ?? null);
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  function handleEnter() {
    timeoutRef.current = setTimeout(async () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const top = rect.bottom + 8;
        // Keep the card from running off the right edge of the viewport.
        const left = Math.min(rect.left, window.innerWidth - 240);
        setPos({ top, left });
      }
      setShow(true);
      const cached = cache.get(characterId);
      if (cached) {
        setProfile(cached);
        return;
      }
      const data = await getMiniProfileAction(characterId);
      if (data) {
        cache.set(characterId, data);
        setProfile(data);
      }
    }, 350);
  }

  function handleLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(false);
  }

  return (
    <span
      ref={containerRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={className}
    >
      {children}
      {show && profile && (
        <div
          style={{ position: "fixed", top: pos.top, left: pos.left }}
          className="z-50 w-56 bg-ink-900 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 p-3"
        >
          <Link href={`/c/${slug}`} className="flex items-center gap-2.5">
            <CharacterBadge
              name={`${profile.firstName} ${profile.lastName}`}
              avatarUrl={profile.avatarUrl}
              size="sm"
            />
            <span
              className="text-sm font-medium leading-tight"
              style={{ color: profile.nameColor ?? "#f6efdc" }}
            >
              {profile.firstName} {profile.lastName}
            </span>
          </Link>
          <div className="mt-2 pt-2 border-t border-ink-700 space-y-0.5">
            <p className="text-xs text-brass-400">{profile.major}</p>
            <p className="text-xs text-ink-400">{profile.year}</p>
            {profile.socialStatus && <p className="text-xs text-ink-400">{profile.socialStatus}</p>}
          </div>
        </div>
      )}
    </span>
  );
}
