import { getAllCharactersDirectory } from "@/lib/characters";
import { MassMessageForm } from "@/components/mass-message-form";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminMassMessagePage() {
  const members = await getAllCharactersDirectory();

  const majorOptions = [...new Set(members.map((m) => m.major))].sort();
  const hallOptions = [...new Set(members.map((m) => m.hall).filter((h) => h !== null))].sort();
  const yearOptions = [...new Set(members.map((m) => m.year))].sort();
  const ageOptions = [...new Set(members.map((m) => m.age))].sort((a, b) => a - b);

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl text-parchment-100 mb-1">Mass message</h1>
      <p className="text-sm text-ink-400 mb-6">
        Send the same message to every character matching the filters below — each one gets its
        own individual thread with you, not a shared group thread.
      </p>
      <MassMessageForm
        majorOptions={majorOptions}
        hallOptions={hallOptions}
        yearOptions={yearOptions}
        ageOptions={ageOptions}
      />
    </div>
  );
}
