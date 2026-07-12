"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetChatTimeoutAction } from "@/actions/chat";

export function AdminChatTimeoutStatus({
  userId,
  timeoutUntil,
}: {
  userId: number;
  timeoutUntil: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isActive = timeoutUntil && new Date(timeoutUntil) > new Date();
  if (!isActive) {
    return <p className="text-[11px] text-ink-400">Not timed out.</p>;
  }

  function handleReset() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", String(userId));
      await resetChatTimeoutAction(formData);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-[11px] text-claret-500">
        Timed out until {new Date(timeoutUntil!).toLocaleTimeString()}
      </p>
      <button
        type="button"
        onClick={handleReset}
        disabled={pending}
        className="text-[11px] bg-ink-800 border border-ink-600 text-parchment-100 px-2 py-0.5 rounded hover:border-brass-500/50 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : "Reset"}
      </button>
    </div>
  );
}
