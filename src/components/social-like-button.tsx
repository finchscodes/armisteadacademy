"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleReactionAction } from "@/actions/post-interactions";
import { HeartIcon } from "@/components/nav-icons";

const LIKE_EMOJI = "❤️";

export function SocialLikeButton({
  postId,
  count,
  likedByViewer,
  canInteract,
}: {
  postId: number;
  count: number;
  likedByViewer: boolean;
  canInteract: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!canInteract) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("postId", String(postId));
      formData.set("emoji", LIKE_EMOJI);
      await toggleReactionAction(formData);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || !canInteract}
      className="flex items-center gap-1.5 text-sm disabled:opacity-60"
    >
      <HeartIcon className="w-5 h-5" filled={likedByViewer} />
      {count > 0 && <span className="text-ink-300">{count}</span>}
    </button>
  );
}
