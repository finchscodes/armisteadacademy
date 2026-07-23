import { getPendingConfessions } from "@/lib/confessions";
import { ConfessionQueue } from "@/components/confession-queue";

export const dynamic = "force-dynamic";

export default async function AdminConfessionsPage() {
  const pending = await getPendingConfessions();

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-lg text-parchment-100 mb-1">Confessions</h2>
      <p className="text-sm text-ink-400 mb-4">
        Approved confessions show on the homepage for 2 weeks, then are deleted automatically.
        Rejected ones are deleted immediately.
      </p>
      <ConfessionQueue confessions={pending} />
    </div>
  );
}
