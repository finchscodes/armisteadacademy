import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getInboxThreads } from "@/lib/messages";
import { InboxList } from "@/components/inbox-list";

// The inbox changes as new mail arrives — must render per-request, never
// prerendered at build time.
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.activeCharacter) redirect("/characters");

  const threads = await getInboxThreads(current.activeCharacter.id);
  const serialized = threads.map((t) => ({
    ...t,
    lastMessageAt: t.lastMessageAt.toISOString(),
    lastMessage: t.lastMessage ? { ...t.lastMessage } : null,
  }));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-brass-400 mb-1">Messages</h1>
      <p className="text-ink-400 text-sm mb-6">Private messages between characters.</p>
      <InboxList threads={serialized} myCharacterId={current.activeCharacter.id} />
    </div>
  );
}
