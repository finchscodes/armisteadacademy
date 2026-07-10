"use client";

import { useState } from "react";
import { RichTextDisplay } from "@/components/rich-text-display";

type Section = { id: number; title: string; slug: string; content: string };

export function GuideAccordion({ sections }: { sections: Section[] }) {
  const [activeId, setActiveId] = useState<number | null>(sections[0]?.id ?? null);
  const active = sections.find((s) => s.id === activeId) ?? null;
  const activeIndex = sections.findIndex((s) => s.id === activeId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <h1 className="font-display text-xl text-brass-400 leading-tight">Armistead Academy</h1>
        <p className="text-xs uppercase tracking-widest text-ink-400 mt-1 mb-4">Guidebook</p>
        {sections.length === 0 ? (
          <p className="text-xs text-ink-400 italic">Nothing here yet.</p>
        ) : (
          <nav className="border-t border-ink-700 pt-3 space-y-2">
            {sections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`flex items-baseline gap-2 text-sm text-left w-full transition-colors ${
                  activeId === s.id ? "text-brass-400" : "text-parchment-100/85 hover:text-brass-400"
                }`}
              >
                <span className="text-[10px] text-ink-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}.
                </span>
                {s.title}
              </button>
            ))}
          </nav>
        )}
      </aside>

      <div className="min-w-0">
        {!active ? (
          <p className="text-sm text-ink-400">
            The guidebook hasn&apos;t been written yet — check back soon.
          </p>
        ) : (
          <section>
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="brass-rule w-24 mx-auto mb-4" />
              <p className="text-xs tracking-[0.3em] text-ink-400">
                {String(activeIndex + 1).padStart(3, "0")}
              </p>
              <h2 className="font-display text-4xl text-parchment-100 mt-2">{active.title}</h2>
              <div className="brass-rule w-24 mx-auto mt-4" />
            </div>
            <div className="max-w-2xl mx-auto">
              <RichTextDisplay html={active.content} className="text-parchment-100/90" />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
