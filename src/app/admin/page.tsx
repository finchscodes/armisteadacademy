import Link from "next/link";

const SECTIONS = [
  { href: "/admin/users", label: "Users", description: "Manage accounts, characters, jobs, hall, statuses, and more." },
  { href: "/admin/classes", label: "Class Assignments", description: "Assign instructors to classes." },
  { href: "/admin/boards", label: "Boards", description: "Create and edit boards and categories." },
  { href: "/admin/article-boards", label: "Article Boards", description: "Grant posting access to article boards." },
  { href: "/admin/guide", label: "Guidebook", description: "Write and edit the Rules & Guidelines sections." },
  { href: "/admin/home-board", label: "Home Board", description: "Homepage announcement, weather, and spotlight." },
  { href: "/admin/sorting-quiz", label: "Sorting Quiz", description: "Write the hall-sorting quiz questions and answers." },
  { href: "/admin/grading", label: "Grading", description: "Override a submission's grade after the fact." },
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
          <h2 className="font-display text-lg text-brass-400 mb-1">{s.label}</h2>
          <p className="text-xs text-ink-400">{s.description}</p>
        </Link>
      ))}
    </div>
  );
}
