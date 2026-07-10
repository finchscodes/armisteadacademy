import Link from "next/link";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/classes", label: "Class Assignments" },
  { href: "/admin/boards", label: "Boards" },
  { href: "/admin/article-boards", label: "Article Boards" },
  { href: "/admin/guide", label: "Guidebook" },
  { href: "/admin/home-board", label: "Home Board" },
  { href: "/admin/sorting-quiz", label: "Sorting Quiz" },
  { href: "/admin/grading", label: "Grading" },
];

export default function AdminIndexPage() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {SECTIONS.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          className="bg-ink-900 border border-ink-700 rounded-lg p-5 hover:border-brass-500/50 transition-colors"
        >
          <h2 className="font-display text-lg text-brass-400">{s.label}</h2>
        </Link>
      ))}
    </div>
  );
}
