import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { getAdminAccessContext, getBoardNames } from "@/lib/admin-access";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/boards", label: "Boards" },
  { href: "/admin/guide", label: "Guidebook" },
  { href: "/admin/home-board", label: "Home Board" },
  { href: "/admin/hall-welcome", label: "Hall Welcome" },
  { href: "/admin/sorting-quiz", label: "Sorting Quiz" },
  { href: "/admin/grading", label: "Grading" },
];

export default async function AdminIndexPage() {
  const current = await getCurrentUser();
  const access = await getAdminAccessContext(
    current?.activeCharacter?.id ?? null,
    Boolean(current?.session.isAdmin)
  );

  if (access.isFullAdmin) {
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

  // Limited access — only show the sections this character actually has a reason to see.
  const [hallBoards, gradingBoards] = await Promise.all([
    getBoardNames(access.hallBoardIds),
    access.canViewAllGrading ? Promise.resolve([]) : getBoardNames(access.gradingBoardIds),
  ]);

  const limitedSections = [
    access.canAccessUsers && { href: "/admin/users", label: "Users (hiring)" },
    ...hallBoards.map((b) => ({ href: "/admin/hall-welcome", label: `${b.name} Welcome` })),
    access.canViewAllGrading && { href: "/admin/grading", label: "Grading (all classes)" },
    ...gradingBoards.map((b) => ({ href: "/admin/grading", label: `${b.name} Grading` })),
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {limitedSections.map((s, i) => (
        <Link
          key={`${s.href}-${i}`}
          href={s.href}
          className="bg-ink-900 border border-ink-700 rounded-lg p-5 hover:border-brass-500/50 transition-colors"
        >
          <h2 className="font-display text-lg text-brass-400">{s.label}</h2>
        </Link>
      ))}
    </div>
  );
}
