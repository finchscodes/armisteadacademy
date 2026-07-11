import { redirect } from "next/navigation";
import { getHallWelcomeMessage } from "@/actions/admin";
import { getCurrentUser } from "@/lib/current-user";
import { HALL_VALUES, hallLabel } from "@/lib/halls";
import { HallWelcomeForm } from "@/components/hall-welcome-form";
import { HallBlurbForm } from "@/components/hall-blurb-form";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminHallWelcomePage() {
  const current = await getCurrentUser();
  if (!current?.session.isAdmin) redirect("/");

  const messages = await Promise.all(
    HALL_VALUES.map(async (hall) => ({ hall, message: await getHallWelcomeMessage(hall) }))
  );

  return (
    <div className="max-w-xl space-y-10">
      {messages.map(({ hall, message }) => (
        <div key={hall}>
          <h2 className="font-display text-lg text-parchment-100 mb-3">{hallLabel(hall)}</h2>
          <div className="space-y-3">
            <HallBlurbForm hall={hall} blurb={message?.blurb ?? ""} />
            <div>
              <p className="text-xs font-medium text-ink-400 mb-1">
                RA&apos;s welcome message (also editable by that hall&apos;s Resident Advisor)
              </p>
              <HallWelcomeForm
                hall={hall}
                title={message?.title ?? "Welcome!"}
                content={message?.content ?? ""}
                characterId={null}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
