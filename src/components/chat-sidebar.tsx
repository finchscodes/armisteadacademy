"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { sendChatMessageAction, deleteChatMessageAction, deleteAllChatMessagesFromCharacterAction, timeoutCharacterAction } from "@/actions/chat";
import { jobColor, type CharacterJob } from "@/lib/roles";
import { CHAT_EMOJI } from "@/lib/chat-emoji";
import { playPingSound, primeAudio } from "@/lib/ping-sound";
import { CharacterHoverCard } from "./character-hover-card";

export type ChatMessage = {
  id: number;
  content: string;
  isAnnouncement: boolean;
  createdAt: string;
  characterId: number;
  characterSlug: string;
  characterFirstName: string;
  characterLastName: string;
  characterJob: CharacterJob;
  characterAvatarUrl: string | null;
};

type OnlineCharacter = {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
};

const POLL_INTERVAL_MS = 4000;

function isMentioned(content: string, firstName: string, lastName: string): boolean {
  const lower = content.toLowerCase();
  if (/(^|\s)@all(\s|$)/.test(lower)) return true;
  const target = `@${firstName} ${lastName}`.toLowerCase();
  return lower.includes(target);
}

export function ChatSidebar({
  initialMessages,
  initialOnline,
  canChat,
  canPingAll,
  myCharacterId,
  myFirstName,
  myLastName,
  isModerator,
  myTimeoutUntil,
  onCollapse,
}: {
  initialMessages: ChatMessage[];
  initialOnline: OnlineCharacter[];
  canChat: boolean;
  canPingAll: boolean;
  myCharacterId: number | null;
  myFirstName: string | null;
  myLastName: string | null;
  isModerator: boolean;
  myTimeoutUntil: string | null;
  onCollapse?: () => void;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [online, setOnline] = useState(initialOnline);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [pingedIds, setPingedIds] = useState<Set<number>>(new Set());
  const [autoScroll, setAutoScroll] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [modPending, startModTransition] = useTransition();
  const [timeoutUntil, setTimeoutUntil] = useState(myTimeoutUntil);
  const [, forceTick] = useState(0);

  // The timeout banner's "is it still active" check only re-runs when
  // something re-renders this component — without this, it would silently
  // stay stuck showing "timed out" even after the time has actually passed,
  // until something else (like sending a message) happened to re-render it.
  useEffect(() => {
    if (!timeoutUntil) return;
    const interval = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timeoutUntil]);

  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<number>>(new Set(initialMessages.map((m) => m.id)));

  // Audio needs a real user gesture to unlock before an async poll can play a
  // sound later — prime it on the first click/keypress anywhere in the widget.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function unlock() {
      primeAudio();
      el?.removeEventListener("pointerdown", unlock);
      el?.removeEventListener("keydown", unlock);
    }
    el.addEventListener("pointerdown", unlock);
    el.addEventListener("keydown", unlock);
    return () => {
      el.removeEventListener("pointerdown", unlock);
      el.removeEventListener("keydown", unlock);
    };
  }, []);

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
      setOnline(data.online ?? []);
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
    if (openMenuId === null) return;
    function handleClickAway() {
      setOpenMenuId(null);
    }
    document.addEventListener("click", handleClickAway);
    return () => document.removeEventListener("click", handleClickAway);
  }, [openMenuId]);

  useEffect(() => {
    if (!autoScroll) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, autoScroll]);

  function handleSubmit(formData: FormData) {
    if (!inputValue.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await sendChatMessageAction(formData);
      if (result.error) {
        setError(result.error);
        if (result.error.toLowerCase().includes("timed out") || result.error.includes("Slow down")) {
          setTimeoutUntil(new Date(Date.now() + 60 * 1000).toISOString());
        }
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

  function selectMention(mentionLabel: string) {
    const input = inputRef.current;
    if (!input || mentionQuery === null) return;
    const cursor = input.selectionStart ?? inputValue.length;
    const upToCursor = inputValue.slice(0, cursor);
    const atIndex = upToCursor.lastIndexOf("@");
    const before = inputValue.slice(0, atIndex);
    const after = inputValue.slice(cursor);
    const mentionText = `@${mentionLabel} `;
    const next = before + mentionText + after;
    setInputValue(next);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      input.focus();
      const pos = before.length + mentionText.length;
      input.setSelectionRange(pos, pos);
    });
  }

  // Only online characters are pingable — mentioning someone offline wouldn't
  // reach them in any meaningful way, so they aren't offered as candidates.
  // "@all" is always offered too, when it matches what's been typed — it
  // pings everyone currently online.
  const showAllOption =
    canPingAll && mentionQuery !== null && "all".startsWith(mentionQuery.toLowerCase());
  const mentionMatches =
    mentionQuery !== null
      ? online
          .filter((c) => c.id !== myCharacterId)
          .filter((c) =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
          )
          .slice(0, 6)
      : [];

  return (
    <div
      ref={containerRef}
      className="bg-ink-900 border border-ink-700 rounded-lg flex flex-col h-[calc(100vh-7rem)] min-h-[500px]"
    >
      <div className="px-4 py-2.5 border-b border-ink-700 shrink-0 flex items-center justify-between gap-2">
        <h2 className="font-ui text-xs uppercase tracking-widest text-ink-400">Chat</h2>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setAutoScroll((v) => !v)}
            data-tooltip={autoScroll ? "Auto-scroll on" : "Auto-scroll off"}
            data-tooltip-side="bottom"
            className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border transition-colors ${
              autoScroll
                ? "border-brass-500/50 text-brass-400"
                : "border-ink-600 text-ink-400 hover:text-parchment-100"
            }`}
          >
            Auto-scroll
          </button>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              data-tooltip="Hide chat"
              className="w-6 h-6 rounded-full bg-ink-800 border border-ink-600 text-ink-400 hover:text-brass-400 hover:border-brass-500/50 transition-colors flex items-center justify-center shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <path
                  d="M14.5 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-[0.45rem]">
        {messages.length === 0 ? (
          <p className="text-xs text-ink-400 italic">No messages yet — say something.</p>
        ) : (
          messages.map((m) => {
            if (m.isAnnouncement) {
              return (
                <div
                  key={m.id}
                  className="text-center text-xs px-3 py-2.5 my-1.5 bg-brass-500/10 border border-brass-500/40"
                >
                  <span className="uppercase tracking-wider text-brass-400 font-semibold">
                    {m.characterFirstName} {m.characterLastName}
                  </span>
                  <span className="text-ink-400 mx-1.5">&bull;</span>
                  <span className="text-parchment-100">{m.content}</span>
                </div>
              );
            }
            const isMe = m.content.toLowerCase().startsWith("/me ");
            if (isMe) {
              return (
                <p
                  key={m.id}
                  className={`text-sm italic text-center leading-snug rounded px-1.5 py-1 transition-colors ${
                    pingedIds.has(m.id) ? "bg-brass-500/15 ring-1 ring-brass-500/40" : ""
                  }`}
                >
                  <span className="text-brass-300">
                    {m.characterFirstName} {m.characterLastName} {m.content.slice(4)}
                  </span>
                </p>
              );
            }
            return (
              <div
                key={m.id}
                className={`group relative text-sm leading-snug rounded px-1.5 -mx-1.5 transition-colors break-words ${
                  pingedIds.has(m.id) ? "bg-brass-500/15 ring-1 ring-brass-500/40 py-0.5" : ""
                }`}
              >
                {isModerator && (
                  <span className="relative inline-block align-middle mr-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === m.id ? null : m.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-ink-500 hover:text-brass-400 transition-opacity px-1"
                      data-tooltip="Moderate"
                    >
                      &#8942;
                    </button>
                    {openMenuId === m.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 bottom-full z-30 mb-1 w-48 bg-ink-800 border border-ink-600 rounded-md shadow-xl overflow-hidden text-xs"
                      >
                        <button
                          type="button"
                          disabled={modPending}
                          onClick={() => {
                            setOpenMenuId(null);
                            startModTransition(async () => {
                              const fd = new FormData();
                              fd.set("messageId", String(m.id));
                              await deleteChatMessageAction(fd);
                              await refresh();
                            });
                          }}
                          className="block w-full text-left px-3 py-1.5 hover:bg-ink-700 text-claret-500"
                        >
                          Delete this message
                        </button>
                        <button
                          type="button"
                          disabled={modPending}
                          onClick={() => {
                            setOpenMenuId(null);
                            if (!confirm(`Delete every message from ${m.characterFirstName} ${m.characterLastName}?`))
                              return;
                            startModTransition(async () => {
                              const fd = new FormData();
                              fd.set("characterId", String(m.characterId));
                              await deleteAllChatMessagesFromCharacterAction(fd);
                              await refresh();
                            });
                          }}
                          className="block w-full text-left px-3 py-1.5 hover:bg-ink-700 text-claret-500 border-t border-ink-700"
                        >
                          Delete all from this user
                        </button>
                        <div className="border-t border-ink-700 px-3 py-1 text-[10px] uppercase tracking-wider text-ink-500">
                          Timeout
                        </div>
                        {[1, 5, 10].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            disabled={modPending}
                            onClick={() => {
                              setOpenMenuId(null);
                              startModTransition(async () => {
                                const fd = new FormData();
                                fd.set("characterId", String(m.characterId));
                                fd.set("minutes", String(mins));
                                await timeoutCharacterAction(fd);
                              });
                            }}
                            className="block w-full text-left px-3 py-1.5 hover:bg-ink-700 text-parchment-100"
                          >
                            {mins} minute{mins === 1 ? "" : "s"}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={modPending}
                          onClick={() => {
                            setOpenMenuId(null);
                            const input = prompt("Timeout duration in minutes:");
                            const mins = Number(input);
                            if (!input || !mins || mins <= 0) return;
                            startModTransition(async () => {
                              const fd = new FormData();
                              fd.set("characterId", String(m.characterId));
                              fd.set("minutes", String(mins));
                              await timeoutCharacterAction(fd);
                            });
                          }}
                          className="block w-full text-left px-3 py-1.5 hover:bg-ink-700 text-parchment-100 border-t border-ink-700"
                        >
                          Custom...
                        </button>
                      </div>
                    )}
                  </span>
                )}
                <CharacterHoverCard characterId={m.characterId} slug={m.characterSlug}>
                  <Link
                    href={`/c/${m.characterSlug}`}
                    className="hover:underline font-medium text-parchment-100"
                    style={{ color: jobColor(m.characterJob) ?? undefined }}
                  >
                    {m.characterFirstName} {m.characterLastName}
                  </Link>
                </CharacterHoverCard>
                <span className="text-parchment-100/90">: {m.content}</span>
              </div>
            );
          })
        )}
      </div>

      {timeoutUntil && new Date(timeoutUntil) > new Date() ? (
        <div className="border-t border-ink-700 p-3 shrink-0 text-center">
          <p className="text-xs text-claret-500">
            You&apos;re timed out from chat until {new Date(timeoutUntil).toLocaleTimeString()}.
          </p>
        </div>
      ) : canChat ? (
        <form
          ref={formRef}
          action={handleSubmit}
          className="border-t border-ink-700 p-3 shrink-0 relative"
        >
          {(mentionMatches.length > 0 || showAllOption) && (
            <div className="absolute bottom-full left-3 mb-1 w-56 bg-ink-800 border border-ink-600 rounded-md shadow-xl overflow-hidden">
              {showAllOption && (
                <button
                  type="button"
                  onClick={() => selectMention("all")}
                  className="w-full text-left px-3 py-1.5 text-sm text-brass-400 hover:bg-ink-700 transition-colors flex items-center gap-2 border-b border-ink-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brass-400 shrink-0" />
                  @all — ping everyone online
                </button>
              )}
              {mentionMatches.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectMention(`${c.firstName} ${c.lastName}`)}
                  className="w-full text-left px-3 py-1.5 text-sm text-parchment-100 hover:bg-ink-700 transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
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
              maxLength={1000}
              placeholder="Say something..."
              autoComplete="off"
              className="flex-1 min-w-0 rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm focus:outline-none focus:border-brass-500"
            />
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className="text-lg px-2 rounded-md border border-ink-600 hover:border-brass-500/50 transition-colors shrink-0"
              data-tooltip="Insert emoji"
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
