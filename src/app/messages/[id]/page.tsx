import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getMessageThread } from "@/lib/messages";
import { markThreadsReadAction } from "@/actions/messages";
import { CharacterBadge } from "@/components/character-badge";
import { RichTextDisplay } from "@/components/rich-text-display";
import { MessageReplyForm } from "@/components/message-reply-form";
import { ThreadParticipants } from "@/components/thread-participants";
import { MarkUnreadButton } from "@/components/mark-unread-button";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default async function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const threadId = Number(id);
  if (!threadId) notFound();

  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.activeCharacter) redirect("/characters");

  const data = await getMessageThread(threadId, current.activeCharacter.id);
  if (!data) notFound();

  await markThreadsReadAction([threadId], true);

  const { thread, participants, messages, isCreator } = data;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/messages" className="text-sm text-ink-400 hover:text-brass-400">
          &larr; Back to messages
        </Link>
        <MarkUnreadButton threadId={thread.id} />
      </div>

      <h1 className="font-display text-3xl text-brass-400 mb-3">{thread.subject}</h1>

      <ThreadParticipants
        threadId={thread.id}
        participants={participants}
        isCreator={isCreator}
        myCharacterId={current.activeCharacter.id}
      />

      <div className="bg-ink-900 border border-ink-700 rounded-lg p-4 mb-6">
        <MessageReplyForm threadId={thread.id} />
      </div>

      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="flex gap-3 bg-ink-900 border border-ink-700 rounded-lg p-4">
            <CharacterBadge name={m.characterName} avatarUrl={m.characterAvatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <Link href={`/c/${m.characterSlug}`} className="font-medium text-parchment-100 hover:text-brass-400">
                  {m.characterFirstName} {m.characterLastName}
                </Link>
                <span className="text-ink-500 text-xs ml-2">{timeAgo(m.createdAt)}</span>
              </p>
              <div className="text-sm text-parchment-100/90 mt-1">
                <RichTextDisplay html={m.content} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
