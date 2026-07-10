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
  myCharacterId: number | null;
  myFirstName: string | null;
  myLastName: string | null;
}) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-[calc(100vh-7rem)] min-h-[500px] w-8 bg-ink-900 border border-ink-700 rounded-lg flex items-center justify-center hover:border-brass-500/50 transition-colors"
        title="Show chat"
      >
        <span
          className="font-display text-xs text-brass-400 uppercase tracking-widest"
          style={{ writingMode: "vertical-rl" }}
        >
          Chat
        </span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(false)}
        className="absolute -left-3 top-3 z-10 w-6 h-6 rounded-full bg-ink-800 border border-ink-600 text-ink-400 hover:text-brass-400 hover:border-brass-500/50 transition-colors flex items-center justify-center text-xs"
        title="Hide chat"
      >
        &rsaquo;
      </button>
      <ChatSidebar {...props} />
    </div>
  );
}
