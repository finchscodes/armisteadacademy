"use client";

import { useRef, useState, type CSSProperties } from "react";
import { getMiniProfileAction, type MiniProfile } from "@/actions/mini-profile";
import { MiniProfileCard } from "@/components/mini-profile-card";

const cache = new Map<number, MiniProfile>();

/**
 * Renders stored rich text. Safe because everything passed to this was
 * already run through sanitizeRichText() (see src/lib/sanitize.ts) before it
 * was written to the database — this component trusts that, it doesn't
 * re-sanitize on render.
 *
 * Also wires up hover cards on @mentions. Mentions render as plain <a>
 * tags inside dangerouslySetInnerHTML (not React elements), so there's
 * nothing to attach a hover handler to individually — instead this
 * delegates: one mouseover/mouseout listener on the container that checks
 * whether the hovered element is a mention link.
 */
export function RichTextDisplay({
  html,
  className = "",
  style,
}: {
  html: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [hover, setHover] = useState<{ profile: MiniProfile; slug: string; top: number; left: number } | null>(
    null
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleMouseOver(e: React.MouseEvent) {
    const target = (e.target as HTMLElement).closest<HTMLElement>("a.mention[data-mention-id]");
    if (!target) return;

    const characterId = Number(target.dataset.mentionId);
    const slug = target.dataset.mentionSlug ?? "";
    if (!characterId || !slug) return;

    timeoutRef.current = setTimeout(async () => {
      const rect = target.getBoundingClientRect();
      const top = rect.bottom + 8;
      const left = Math.min(rect.left, window.innerWidth - 280);

      const cached = cache.get(characterId);
      if (cached) {
        setHover({ profile: cached, slug, top, left });
        return;
      }
      const data = await getMiniProfileAction(characterId);
      if (data) {
        cache.set(characterId, data);
        setHover({ profile: data, slug, top, left });
      }
    }, 350);
  }

  function handleMouseOut(e: React.MouseEvent) {
    const target = (e.target as HTMLElement).closest("a.mention[data-mention-id]");
    if (!target) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHover(null);
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`rich-text-content ${className}`}
        style={style}
        dangerouslySetInnerHTML={{ __html: html }}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      />
      {hover && <MiniProfileCard profile={hover.profile} slug={hover.slug} top={hover.top} left={hover.left} />}
    </div>
  );
}
