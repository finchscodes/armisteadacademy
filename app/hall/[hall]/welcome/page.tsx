import { notFound } from "next/navigation";
import Link from "next/link";
import { getHallWelcomeMessage, canEditHallWelcome } from "@/actions/admin";
import { getCurrentUser } from "@/lib/current-user";
import { HALL_VALUES, hallLabel, hallColor } from "@/lib/halls";
import { RichTextDisplay } from "@/components/rich-text-display";
import { HallWelcomeForm } from "@/components/hall-welcome-form";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function HallWelcomePage({ params }: { params: Promise<{ hall: string }> }) {
  const { hall } = await params;
  if (!HALL_VALUES.includes(hall as (typeof HALL_VALUES)[number])) notFound();

  const [message, current] = await Promise.all([getHallWelcomeMessage(hall), getCurrentUser()]);

  const canEdit =
    Boolean(current?.session.isAdmin) ||
    (current?.activeCharacter ? await canEditHallWelcome(current.activeCharacter.id, hall) : false);

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="rounded-lg overflow-hidden border"
        style={{ borderColor: `${hallColor(hall)}66` }}
      >
        <div className="px-6 py-4" style={{ backgroundColor: `${hallColor(hall)}26` }}>
          <p className="text-xs uppercase tracking-wider text-ink-400">
            A note from your Resident Advisor
          </p>
          <h1 className="font-display text-2xl" style={{ color: hallColor(hall) ?? undefined }}>
            Welcome to {hallLabel(hall)}
          </h1>
        </div>
        <div className="bg-ink-900 p-6">
          <h2 className="font-display text-lg text-parchment-100 mb-2">
            {message?.title ?? "Welcome!"}
          </h2>
          {message?.content ? (
            <RichTextDisplay html={message.content} className="text-sm text-parchment-100/90" />
          ) : (
            <p className="text-sm text-ink-400 italic">
              Your Resident Advisor hasn&apos;t written a welcome message yet.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-block text-sm bg-brass-500 text-ink-950 px-5 py-2.5 rounded-md font-medium hover:bg-brass-400 transition-colors"
        >
          Continue to Armistead Academy
        </Link>
      </div>

      {canEdit && (
        <div className="mt-10 pt-6 border-t border-ink-700">
          <p className="text-xs uppercase tracking-wider text-ink-400 mb-3">
            Edit this welcome message
          </p>
          <HallWelcomeForm
            hall={hall}
            title={message?.title ?? "Welcome!"}
            content={message?.content ?? ""}
            characterId={current?.activeCharacter?.id ?? null}
          />
        </div>
      )}
    </div>
  );
}
