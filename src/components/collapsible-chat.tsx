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

const HEIGHT_CLASS = "h-[calc(100vh-7rem)] min-h-[500px]";

export function CollapsibleChat(props: {
  initialMessages: ChatMessage[];
  initialOnline: OnlineCharacter[];
  canChat: boolean;
  canPingAll: boolean;
  myCharacterId: number | null;
  myFirstName: string | null;
  myLastName: string | null;
  isModerator: boolean;
  myTimeoutUntil: string | null;
}) {
  const [open, setOpen] = useState(true);

  // A single persistent wrapper whose width animates — the main content
  // next to it is flex-1, so it reflows in step with the transition
  // instead of snapping when chat collapses/expands.
  return (
    <div
      className={`shrink-0 ${HEIGHT_CLASS} overflow-hidden transition-[width] duration-300 ease-in-out ${
        open ? "w-full lg:w-[420px]" : "w-10"
      }`}
    >
      {open ? (
        <ChatSidebar {...props} onCollapse={() => setOpen(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-tooltip="Show chat"
          data-tooltip-side="bottom-left"
          className="w-10 h-full bg-ink-900 border border-ink-700 rounded-lg flex items-center justify-center hover:border-brass-500/50 transition-colors"
        >
          <span
            className="font-display text-xs text-brass-400 uppercase tracking-widest whitespace-nowrap"
            style={{ writingMode: "vertical-rl" }}
          >
            Chat
          </span>
        </button>
      )}
    </div>
  );
}
