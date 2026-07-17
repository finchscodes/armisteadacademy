"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markThreadsReadAction } from "@/actions/messages";

export function MarkUnreadButton({ threadId }: { threadId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await markThreadsReadAction([threadId], false);
          router.push("/messages");
        })
      }
      disabled={pending}
      className="text-sm bg-ink-800 border border-ink-600 text-parchment-100 px-4 py-2 rounded-md hover:border-gunmetal-500/50 transition-colors disabled:opacity-60"
    >
      Mark unread
    </button>
  );
}
