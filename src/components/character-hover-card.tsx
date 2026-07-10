"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { getMiniProfileAction, type MiniProfile } from "@/actions/mini-profile";

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
        const left = Math.min(rect.left, window.innerWidth - 280);
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
          className="z-50 w-64 bg-ink-900 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 p-2 flex gap-2.5"
        >
          <Link href={`/c/${slug}`} className="shrink-0 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatarUrl ?? undefined}
              alt={`${profile.firstName} ${profile.lastName}`}
              className="w-20 h-20 rounded-md object-cover border border-brass-500/50 bg-ink-800"
              style={{ display: profile.avatarUrl ? "block" : "none" }}
            />
            {!profile.avatarUrl && (
              <div
                className="w-20 h-20 rounded-md border border-brass-500/50 bg-gradient-to-br from-claret-600 to-claret-500 flex items-center justify-center"
                style={{ color: profile.nameColor ?? undefined }}
              >
                <span className="font-display text-2xl text-parchment-100">
                  {profile.firstName.charAt(0)}
                </span>
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-ink-900 ${
                profile.isOnline ? "bg-green-500" : "bg-claret-600"
              }`}
              title={profile.isOnline ? "Online" : "Offline"}
            />
          </Link>
          <div className="text-xs space-y-0.5 py-0.5 min-w-0 flex-1">
            <p>
              <span className="text-ink-400">Age: </span>
              <span className="text-parchment-100">{profile.age}</span>
            </p>
            <p>
              <span className="text-ink-400">Year: </span>
              <span className="text-parchment-100">{profile.year}</span>
            </p>
            <p className="leading-snug">
              <span className="text-ink-400">Major: </span>
              <span className="text-brass-400">{profile.major}</span>
            </p>
          </div>
        </div>
      )}
    </span>
  );
}
