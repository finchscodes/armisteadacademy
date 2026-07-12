"use client";

import { usePathname } from "next/navigation";
import { CollapsibleChat } from "@/components/collapsible-chat";
import type { ChatMessage } from "@/components/chat-sidebar";

type OnlineCharacter = {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
};

export function GlobalShell({
  children,
  chatProps,
}: {
  children: React.ReactNode;
  chatProps: {
    initialMessages: ChatMessage[];
    initialOnline: OnlineCharacter[];
    canChat: boolean;
    canPingAll: boolean;
    myCharacterId: number | null;
    myFirstName: string | null;
    myLastName: string | null;
    isModerator: boolean;
    myTimeoutUntil: string | null;
  };
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">{children}</div>
      <div className="w-full lg:w-auto lg:sticky lg:top-14 lg:self-start">
        <CollapsibleChat {...chatProps} />
      </div>
    </div>
  );
}
