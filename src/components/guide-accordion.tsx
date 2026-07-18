"use client";

import { useState } from "react";
import { RichTextDisplay } from "@/components/rich-text-display";

type Section = { id: number; title: string; slug: string; content: string; parentId: number | null };

export function GuideAccordion({ sections }: { sections: Section[] }) {
  const topLevel = sections.filter((s) => !s.parentId);
  const childrenByParent = new Map<number, Section[]>();
  for (const s of sections) {
    if (s.parentId) {
      if (!childrenByParent.has(s.parentId)) childrenByParent.set(s.parentId, []);
      childrenByParent.get(s.parentId)!.push(s);
    }
  }

  const [activeId, setActiveId] = useState<number | null>(topLevel[0]?.id ?? sections[0]?.id ?? null);
  const active = sections.find((s) => s.id === activeId) ?? null;
  // Number by top-level position only — sub-tabs don't get their own number.
  const activeTopLevelIndex = topLevel.findIndex((s) => s.id === activeId || s.id === active?.parentId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
      <aside className="lg:sticky lg:top-14 lg:self-start">
        <h1 className="font-display text-xl text-gunmetal-400 leading-tight">Armistead Academy</h1>
        <p className="text-xs uppercase tracking-widest text-ink-400 mt-1 mb-4">Guidebook</p>
        {topLevel.length === 0 ? (
          <p className="text-xs text-ink-400 italic">Nothing here yet.</p>
        ) : (
          <nav className="border-t border-ink-700 pt-3 space-y-2">
            {topLevel.map((s, i) => {
              const children = childrenByParent.get(s.id) ?? [];
              const thisOrChildActive = activeId === s.id || active?.parentId === s.id;
              return (
                <div key={s.id}>
                  <button
                    onClick={() => setActiveId(s.id)}
                    className={`flex items-baseline gap-2 text-sm text-left w-full transition-colors ${
                      thisOrChildActive ? "text-gunmetal-400" : "text-parchment-100/85 hover:text-gunmetal-400"
                    }`}
                  >
                    <span className="text-[10px] text-ink-500 tabular-nums">
                      {String(i + 1).padStart(2, "0")}.
                    </span>
                    {s.title}
                  </button>
                  {children.length > 0 && (
                    <div className="ml-6 mt-1.5 space-y-1.5 border-l border-ink-700 pl-3">
                      {children.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setActiveId(c.id)}
                          className={`block text-xs text-left w-full uppercase tracking-wide transition-colors ${
                            activeId === c.id
                              ? "text-gunmetal-400"
                              : "text-parchment-100/60 hover:text-gunmetal-400"
                          }`}
                        >
                          {c.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
              <div className="gunmetal-rule w-24 mx-auto mb-4" />
              {!active.parentId && (
                <p className="font-mono text-xs tracking-[0.3em] text-ink-400">
                  {String(activeTopLevelIndex + 1).padStart(3, "0")}
                </p>
              )}
              <h2 className="font-hero text-4xl text-parchment-100 mt-2">{active.title}</h2>
              <div className="gunmetal-rule w-24 mx-auto mt-4" />
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
