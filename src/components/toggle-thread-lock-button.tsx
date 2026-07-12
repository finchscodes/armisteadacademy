"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleThreadLockAction } from "@/actions/forum";

export function ToggleThreadLockButton({
  threadId,
  isLocked,
}: {
  threadId: number;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("threadId", String(threadId));
      await toggleThreadLockAction(formData);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      data-tooltip={isLocked ? "Unlock topic — allow replies again" : "Lock topic — no more replies"}
      className="text-xs text-ink-400 hover:text-brass-400 transition-colors disabled:opacity-60"
    >
      {pending ? "..." : isLocked ? "Unlock" : "Lock"}
    </button>
  );
}
