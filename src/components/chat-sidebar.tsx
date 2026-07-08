"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { sendChatMessageAction } from "@/actions/chat";
import { roleColor, type UserRole } from "@/lib/roles";

export type ChatMessage = {
  id: number;
  content: string;
  createdAt: string;
  characterId: number;
  characterName: string;
  characterSlug: string;
  characterAvatarUrl: string | null;
  posterRole: UserRole;
};

const POLL_INTERVAL_MS = 4000;

export function ChatSidebar({
  initialMessages,
  canChat,
}: {
  initialMessages: ChatMessage[];
  canChat: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/chat/messages", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      // transient poll failure — next tick will retry
    }
  }

  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await sendChatMessageAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        await refresh();
      }
    });
  }

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg flex flex-col h-[70vh] min-h-[400px]">
      <div className="px-4 py-3 border-b border-ink-700 shrink-0">
        <h2 className="font-display text-sm text-brass-400 uppercase tracking-wider">Chat</h2>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {messages.length === 0 ? (
          <p className="text-xs text-ink-400 italic">No messages yet — say something.</p>
        ) : (
          messages.map((m) => (
            <p key={m.id} className="text-sm leading-snug">
              <Link
                href={`/c/${m.characterSlug}`}
                className="hover:underline font-medium text-brass-400"
                style={roleColor(m.posterRole) ? { color: roleColor(m.posterRole)! } : undefined}
              >
                {m.characterName}
              </Link>
              <span className="text-parchment-100/90"> {m.content}</span>
            </p>
          ))
        )}
      </div>

      {canChat ? (
        <form
          ref={formRef}
          action={handleSubmit}
          className="border-t border-ink-700 p-3 flex gap-2 shrink-0"
        >
          <input
            name="content"
            required
            maxLength={1000}
            placeholder="Say something..."
            autoComplete="off"
            className="flex-1 min-w-0 rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm focus:outline-none focus:border-brass-500"
          />
          <button
            type="submit"
            disabled={pending}
            className="text-sm bg-brass-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-brass-400 transition-colors disabled:opacity-60 shrink-0"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="border-t border-ink-700 p-3 text-xs text-ink-400 text-center shrink-0">
          <Link href="/login" className="text-brass-400 hover:underline">
            Log in
          </Link>{" "}
          to join the chat.
        </div>
      )}
      {error && <p className="text-xs text-claret-500 px-3 pb-2 shrink-0">{error}</p>}
    </div>
  );
}
