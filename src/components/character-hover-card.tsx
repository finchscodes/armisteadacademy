"use client";

import { useRef, useState } from "react";
import { getMiniProfileAction, type MiniProfile } from "@/actions/mini-profile";
import { MiniProfileCard } from "@/components/mini-profile-card";

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
    <span ref={containerRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave} className={className}>
      {children}
      {show && profile && <MiniProfileCard profile={profile} slug={slug} top={pos.top} left={pos.left} />}
    </span>
  );
}
