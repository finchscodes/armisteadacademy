"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { sendChatMessageAction } from "@/actions/chat";
import { jobColor, type CharacterJob } from "@/lib/roles";
import { CHAT_EMOJI } from "@/lib/chat-emoji";
import { playPingSound } from "@/lib/ping-sound";
import { CharacterHoverCard } from "./character-hover-card";

export type ChatMessage = {
  id: number;
  content: string;
  createdAt: string;
  characterId: number;
  characterSlug: string;
  characterFirstName: string;
  characterLastName: string;
  characterJob: CharacterJob;
  characterAvatarUrl: string | null;
};

type MentionCandidate = { id: number; firstName: string; lastName: string; slug: string };

const POLL_INTERVAL_MS = 4000;

function isMentioned(content: string, firstName: string, lastName: string): boolean {
  const target = `@${firstName} ${lastName}`.toLowerCase();
  return content.toLowerCase().includes(target);
}

export function ChatSidebar({
  initialMessages,
  canChat,
  mentionCandidates,
  myFirstName,
  myLastName,
}: {
  initialMessages: ChatMessage[];
  canChat: boolean;
  mentionCandidates: MentionCandidate[];
  myFirstName: string | null;
  myLastName: string | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [pingedIds, setPingedIds] = useState<Set<number>>(new Set());

  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const knownIds = useRef<Set<number>>(new Set(initialMessages.map((m) => m.id)));

  async function refresh() {
    try {
      const res = await fetch("/api/chat/messages", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const incoming: ChatMessage[] = data.messages;

      if (myFirstName && myLastName) {
        const newlyPinged: number[] = [];
        for (const m of incoming) {
          if (!knownIds.current.has(m.id) && isMentioned(m.content, myFirstName, myLastName)) {
            newlyPinged.push(m.id);
          }
        }
        if (newlyPinged.length > 0) {
          playPingSound();
          setPingedIds((prev) => {
            const next = new Set(prev);
            newlyPinged.forEach((id) => next.add(id));
            return next;
          });
        }
      }
      knownIds.current = new Set(incoming.map((m) => m.id));
      setMessages(incoming);
    } catch {
      // transient poll failure — next tick will retry
    }
  }

  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setInputValue("");
        await refresh();
      }
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputValue(value);

    const cursor = e.target.selectionStart ?? value.length;
    const upToCursor = value.slice(0, cursor);
    const atIndex = upToCursor.lastIndexOf("@");
    if (atIndex === -1) {
      setMentionQuery(null);
      return;
    }
    const afterAt = upToCursor.slice(atIndex + 1);
    if (/\s/.test(afterAt)) {
      setMentionQuery(null);
      return;
    }
    setMentionQuery(afterAt);
  }

  function insertAtCursor(text: string) {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? inputValue.length;
    const end = input.selectionEnd ?? inputValue.length;
    const next = inputValue.slice(0, start) + text + inputValue.slice(end);
    setInputValue(next);
    requestAnimationFrame(() => {
      input.focus();
      const pos = start + text.length;
      input.setSelectionRange(pos, pos);
    });
  }

  function selectMention(candidate: MentionCandidate) {
    const input = inputRef.current;
    if (!input || mentionQuery === null) return;
    const cursor = input.selectionStart ?? inputValue.length;
    const upToCursor = inputValue.slice(0, cursor);
    const atIndex = upToCursor.lastIndexOf("@");
    const before = inputValue.slice(0, atIndex);
    const after = inputValue.slice(cursor);
    const mentionText = `@${candidate.firstName} ${candidate.lastName} `;
    const next = before + mentionText + after;
    setInputValue(next);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      input.focus();
      const pos = before.length + mentionText.length;
      input.setSelectionRange(pos, pos);
    });
  }

  const mentionMatches =
    mentionQuery !== null
      ? mentionCandidates
          .filter((c) =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
          )
          .slice(0, 6)
      : [];

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg flex flex-col h-[calc(100vh-7rem)] min-h-[500px]">
      <div className="px-4 py-3 border-b border-ink-700 shrink-0">
        <h2 className="font-display text-sm text-brass-400 uppercase tracking-wider">Chat</h2>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {messages.length === 0 ? (
          <p className="text-xs text-ink-400 italic">No messages yet — say something.</p>
        ) : (
          messages.map((m) => (
            <p
              key={m.id}
              className={`text-sm leading-snug rounded px-1.5 -mx-1.5 py-0.5 transition-colors ${
                pingedIds.has(m.id) ? "bg-brass-500/15 ring-1 ring-brass-500/40" : ""
              }`}
            >
              <CharacterHoverCard characterId={m.characterId} slug={m.characterSlug}>
                <Link
                  href={`/c/${m.characterSlug}`}
                  className="hover:underline font-medium text-parchment-100"
                  style={{ color: jobColor(m.characterJob) ?? undefined }}
                >
                  {m.characterFirstName} {m.characterLastName}
                </Link>
              </CharacterHoverCard>
              <span className="text-parchment-100/90"> {m.content}</span>
            </p>
          ))
        )}
      </div>

      {canChat ? (
        <form
          ref={formRef}
          action={handleSubmit}
          className="border-t border-ink-700 p-3 shrink-0 relative"
        >
          {mentionMatches.length > 0 && (
            <div className="absolute bottom-full left-3 mb-1 w-56 bg-ink-800 border border-ink-600 rounded-md shadow-xl overflow-hidden">
              {mentionMatches.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectMention(c)}
                  className="w-full text-left px-3 py-1.5 text-sm text-parchment-100 hover:bg-ink-700 transition-colors"
                >
                  {c.firstName} {c.lastName}
                </button>
              ))}
            </div>
          )}

          {showEmoji && (
            <div className="absolute bottom-full right-3 mb-1 w-56 bg-ink-800 border border-ink-600 rounded-md shadow-xl p-2 grid grid-cols-8 gap-1">
              {CHAT_EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    insertAtCursor(emoji);
                    setShowEmoji(false);
                  }}
                  className="text-lg hover:bg-ink-700 rounded p-0.5 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              name="content"
              value={inputValue}
              onChange={handleInputChange}
              required
              maxLength={1000}
              placeholder="Say something... (@ to mention)"
              autoComplete="off"
              className="flex-1 min-w-0 rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm focus:outline-none focus:border-brass-500"
            />
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className="text-lg px-2 rounded-md border border-ink-600 hover:border-brass-500/50 transition-colors shrink-0"
              title="Insert emoji"
            >
              🙂
            </button>
            <button
              type="submit"
              disabled={pending}
              className="text-sm bg-brass-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-brass-400 transition-colors disabled:opacity-60 shrink-0"
            >
              Send
            </button>
          </div>
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
