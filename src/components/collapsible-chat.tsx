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
  isModerator: boolean;
  myTimeoutUntil: string | null;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={`relative shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out h-[calc(100vh-7rem)] min-h-[500px] ${
        open ? "w-full lg:w-[420px]" : "w-10"
      }`}
    >
      {/* Collapsed tab — explicit width, not inset-fill, so it can't inherit
          the parent's mid-transition width and render the wrong shape. */}
      <button
        onClick={() => setOpen(true)}
        data-tooltip="Show chat"
        className={`absolute inset-y-0 left-0 w-10 bg-ink-900 border border-ink-700 rounded-lg flex items-center justify-center hover:border-brass-500/50 transition-opacity duration-200 ${
          open ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <span
          className="font-display text-xs text-brass-400 uppercase tracking-widest whitespace-nowrap"
          style={{ writingMode: "vertical-rl" }}
        >
          Chat
        </span>
      </button>

      {/* Full panel — fixed 420px width regardless of the outer wrapper's
          current (possibly mid-transition) width, cross-fades with the tab. */}
      <div
        className={`absolute inset-y-0 left-0 w-full lg:w-[420px] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChatSidebar {...props} onCollapse={() => setOpen(false)} />
      </div>
    </div>
  );
}
