"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFollowAction } from "@/actions/social";

export function FollowButton({ threadId, isFollowing }: { threadId: number; isFollowing: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("threadId", String(threadId));
      await toggleFollowAction(formData);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`text-xs px-3 py-1 rounded-md font-medium border transition-colors disabled:opacity-60 ${
        isFollowing
          ? "border-ink-600 text-parchment-100 hover:border-claret-600/50 hover:text-claret-500"
          : "border-gunmetal-500/50 text-gunmetal-400 hover:bg-gunmetal-500/10"
      }`}
    >
      {pending ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
