"use client";

import { useState } from "react";
import { ChatSidebar, type ChatMessage } from "./chat-sidebar";

type OnlineCharacter = {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
};

export function CollapsibleChat(props: {
  initialMessages: ChatMessage[];
  initialOnline: OnlineCharacter[];
  canChat: boolean;
  canPingAll: boolean;
  myCharacterId: number | null;
  myFirstName: string | null;
  myLastName: string | null;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={`relative shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out h-[calc(100vh-7rem)] min-h-[500px] ${
        open ? "w-full lg:w-[420px]" : "w-10"
      }`}
    >
      {/* Collapsed tab — stays mounted so ChatSidebar underneath never
          unmounts (keeps its scroll position instead of jumping on reopen). */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute inset-0 w-10 bg-ink-900 border border-ink-700 rounded-lg flex items-center justify-center hover:border-brass-500/50 transition-colors z-10"
          title="Show chat"
        >
          <span
            className="font-display text-xs text-brass-400 uppercase tracking-widest"
            style={{ writingMode: "vertical-rl" }}
          >
            Chat
          </span>
        </button>
      )}

      <div className={`absolute inset-0 w-full lg:w-[420px] ${open ? "" : "invisible"}`}>
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-20 w-6 h-6 rounded-full bg-ink-800 border border-ink-600 text-ink-400 hover:text-brass-400 hover:border-brass-500/50 transition-colors flex items-center justify-center"
          title="Hide chat"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
            <path
              d="M9.5 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <ChatSidebar {...props} />
      </div>
    </div>
  );
}
