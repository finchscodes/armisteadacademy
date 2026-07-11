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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        data-tooltip="Show chat"
        data-tooltip-side="left"
        className="shrink-0 w-10 h-[calc(100vh-7rem)] min-h-[500px] bg-ink-900 border border-ink-700 rounded-lg flex items-center justify-center hover:border-brass-500/50 transition-colors"
      >
        <span
          className="font-display text-xs text-brass-400 uppercase tracking-widest whitespace-nowrap"
          style={{ writingMode: "vertical-rl" }}
        >
          Chat
        </span>
      </button>
    );
  }

  return (
    <div className="relative shrink-0 w-full lg:w-[420px] h-[calc(100vh-7rem)] min-h-[500px]">
      <button
        onClick={() => setOpen(false)}
        data-tooltip="Hide chat"
        data-tooltip-side="left"
        className="absolute right-2 top-2 z-20 w-6 h-6 rounded-full bg-ink-800 border border-ink-600 text-ink-400 hover:text-brass-400 hover:border-brass-500/50 transition-colors flex items-center justify-center"
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
      <ChatSidebar {...props} />
    </div>
  );
}
