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

  return (
    <div
      className={`shrink-0 ${HEIGHT_CLASS} overflow-hidden transition-[width] duration-300 ease-in-out ${
        open ? "w-full lg:w-[420px]" : "w-10"
      }`}
    >
      {/* Fixed at the panel's full open width so its own content never
          reflows — the wrapper above clips it as it shrinks, giving a
          seamless slide instead of the contents squeezing and rewrapping. */}
      <div className="relative h-full w-full lg:w-[420px]">
        <div
          className={`h-full transition-opacity ${
            open ? "opacity-100 duration-150" : "opacity-0 duration-100 pointer-events-none"
          }`}
        >
          <ChatSidebar {...props} onCollapse={() => setOpen(false)} />
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          data-tooltip="Show chat"
          data-tooltip-side="bottom-left"
          className={`flex absolute inset-y-0 left-0 w-10 bg-ink-900 border border-ink-700 rounded-lg items-center justify-center hover:border-brass-500/50 transition-opacity ${
            open ? "opacity-0 duration-100 pointer-events-none" : "opacity-100 duration-150 delay-200"
          }`}
        >
          <span
            className="font-display text-xs text-brass-400 uppercase tracking-widest whitespace-nowrap"
            style={{ writingMode: "vertical-rl" }}
          >
            Chat
          </span>
        </button>
      </div>
    </div>
  );
}
