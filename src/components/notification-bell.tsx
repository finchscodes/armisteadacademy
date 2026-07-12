"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { markAllNotificationsReadAction, getMyNotificationsAction } from "@/actions/notifications";
import { BellIcon } from "./nav-icons";

const POLL_INTERVAL_MS = 15000;

export type NotificationItem = {
  id: number;
  type: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
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

export function NotificationBell({ initial }: { initial: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const fresh = await getMyNotificationsAction();
        setItems(fresh);
      } catch {
        // transient poll failure — next tick will retry
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    startTransition(() => markAllNotificationsReadAction());
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-1 text-ink-200 hover:text-brass-400 transition-colors"
        data-tooltip="Notifications" data-tooltip-side="bottom"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-claret-600 text-parchment-100 text-[10px] leading-none rounded-full px-1.5 py-0.5 min-w-[1rem] text-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-ink-900 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-700">
            <h3 className="font-display text-sm text-brass-400 uppercase tracking-wider">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={pending}
                className="text-xs text-ink-400 hover:text-brass-400 transition-colors disabled:opacity-60"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-ink-400 text-center">Nothing yet.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-2.5 text-sm border-b border-ink-800 hover:bg-ink-800/60 transition-colors ${
                    n.isRead ? "text-ink-400" : "text-parchment-100"
                  }`}
                >
                  <p>{n.message}</p>
                  <p className="text-[11px] text-ink-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
