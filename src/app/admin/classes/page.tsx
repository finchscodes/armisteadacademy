import { getClassAssignmentOverview } from "@/actions/admin";
import { ClassAssignmentCard } from "@/components/class-assignment-card";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminClassesPage() {
  const classes = await getClassAssignmentOverview();

  return (
    <div>
      <p className="text-sm text-ink-400 mb-4">
        Assign characters to teach specific classes. An assigned character can post lessons only
        to the classes they&apos;re assigned to (admins can post to any). Enter the character&apos;s
        legal first and last name &mdash; not their code name, since that can be changed anytime.
      </p>

      {classes.length === 0 ? (
        <p className="text-sm text-ink-400">No class boards exist yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {classes.map((c) => (
            <ClassAssignmentCard
              key={c.id}
              boardId={c.id}
              boardName={c.name}
              assigned={c.assigned}
            />
          ))}
        </div>
      )}
    </div>
  );
}
