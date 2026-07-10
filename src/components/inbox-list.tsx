"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { markThreadsReadAction, deleteThreadsAction } from "@/actions/messages";

type Thread = {
  id: number;
  subject: string;
  isRead: boolean;
  lastMessageAt: string;
  participants: { characterId: number; characterFirstName: string; characterLastName: string }[];
  lastMessage: { content: string; characterId: number } | null;
};

function timeAgo(iso: string) {
  const date = new Date(iso);
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

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function InboxList({ threads, myCharacterId }: { threads: Thread[]; myCharacterId: number }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const names = t.participants.map((p) => `${p.characterFirstName} ${p.characterLastName}`).join(" ");
      return t.subject.toLowerCase().includes(q) || names.toLowerCase().includes(q);
    });
  }, [threads, query]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((t) => t.id))));
  }

  function runBulk(action: "read" | "unread" | "delete") {
    const ids = [...selected];
    if (ids.length === 0) return;
    startTransition(async () => {
      if (action === "delete") await deleteThreadsAction(ids);
      else await markThreadsReadAction(ids, action === "read");
      setSelected(new Set());
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Link
          href="/messages/new"
          className="text-sm bg-brass-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors"
        >
          + New Message
        </Link>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages..."
          className="text-sm bg-ink-800 border border-ink-600 rounded-md px-3 py-2 w-full sm:w-64 focus:outline-none focus:border-brass-500"
        />
      </div>

      <div className="flex items-center gap-3 mb-2 px-1">
        <input
          type="checkbox"
          checked={filtered.length > 0 && selected.size === filtered.length}
          onChange={toggleAll}
        />
        <button
          type="button"
          onClick={() => runBulk("delete")}
          disabled={pending || selected.size === 0}
          className="text-xs text-ink-400 hover:text-claret-500 disabled:opacity-40 transition-colors"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => runBulk("read")}
          disabled={pending || selected.size === 0}
          className="text-xs text-ink-400 hover:text-brass-400 disabled:opacity-40 transition-colors"
        >
          Mark read
        </button>
        <button
          type="button"
          onClick={() => runBulk("unread")}
          disabled={pending || selected.size === 0}
          className="text-xs text-ink-400 hover:text-brass-400 disabled:opacity-40 transition-colors"
        >
          Mark unread
        </button>
      </div>

      <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-800">
        {filtered.length === 0 ? (
          <p className="text-sm text-ink-400 px-4 py-6 text-center">No messages yet.</p>
        ) : (
          filtered.map((t) => {
            const others = t.participants.filter((p) => p.characterId !== myCharacterId);
            const names =
              others.length > 0
                ? others.map((p) => `${p.characterFirstName} ${p.characterLastName}`).join(", ")
                : "Just you";
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-800/50 transition-colors">
                <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                <Link href={`/messages/${t.id}`} className="flex-1 min-w-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm truncate ${t.isRead ? "text-ink-300" : "text-parchment-100 font-semibold"}`}>
                      {names}
                    </p>
                    <p className="text-xs text-ink-400 truncate">
                      <span className={t.isRead ? "" : "text-brass-400 font-medium"}>{t.subject}</span>
                      {t.lastMessage && <> &mdash; {stripHtml(t.lastMessage.content).slice(0, 80)}</>}
                    </p>
                  </div>
                  <span className="text-xs text-ink-500 shrink-0">{timeAgo(t.lastMessageAt)}</span>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
