"use client";

import { useState } from "react";
import { RichTextDisplay } from "@/components/rich-text-display";

type Section = { id: number; title: string; slug: string; content: string };

export function GuideAccordion({ sections }: { sections: Section[] }) {
  const [openId, setOpenId] = useState<number | null>(sections[0]?.id ?? null);

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
                onClick={() => setOpenId(s.id)}
                className={`flex items-baseline gap-2 text-sm text-left w-full transition-colors ${
                  openId === s.id ? "text-brass-400" : "text-parchment-100/85 hover:text-brass-400"
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

      <div className="space-y-3 min-w-0">
        {sections.length === 0 ? (
          <p className="text-sm text-ink-400">
            The guidebook hasn&apos;t been written yet — check back soon.
          </p>
        ) : (
          sections.map((s, i) => {
            const isOpen = openId === s.id;
            return (
              <div key={s.id} id={s.slug} className="border border-ink-700 rounded-lg overflow-hidden scroll-mt-20">
                <button
                  onClick={() => setOpenId(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-ink-900/60 transition-colors"
                >
                  <span className="text-xs text-ink-500 tabular-nums shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-lg text-parchment-100 flex-1">{s.title}</span>
                  <span className={`text-ink-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    &#9662;
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1">
                    <RichTextDisplay html={s.content} className="text-parchment-100/90" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
