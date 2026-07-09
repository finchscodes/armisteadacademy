import Link from "next/link";
import { getGuideSections } from "@/actions/guide";
import { RichTextDisplay } from "@/components/rich-text-display";

export default async function GuidePage() {
  const sections = await getGuideSections();

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
              <Link
                key={s.id}
                href={`#${s.slug}`}
                className="flex items-baseline gap-2 text-sm text-parchment-100/85 hover:text-brass-400 transition-colors"
              >
                <span className="text-[10px] text-ink-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}.
                </span>
                {s.title}
              </Link>
            ))}
          </nav>
        )}
      </aside>

      <div className="space-y-16 min-w-0">
        {sections.length === 0 ? (
          <p className="text-sm text-ink-400">
            The guidebook hasn&apos;t been written yet — check back soon.
          </p>
        ) : (
          sections.map((s, i) => (
            <section key={s.id} id={s.slug} className="scroll-mt-20">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <div className="brass-rule w-24 mx-auto mb-4" />
                <p className="text-xs tracking-[0.3em] text-ink-400">
                  {String(i + 1).padStart(3, "0")}
                </p>
                <h2 className="font-display text-4xl text-parchment-100 mt-2">{s.title}</h2>
                <div className="brass-rule w-24 mx-auto mt-4" />
              </div>
              <div className="max-w-2xl mx-auto">
                <RichTextDisplay html={s.content} className="text-parchment-100/90" />
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
