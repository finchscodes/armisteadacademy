"use client";

import { useTransition } from "react";
import { deletePostAction, deleteThreadAction } from "@/actions/forum";

export function DeletePostButton({
  postId,
  isOpeningPost,
}: {
  postId: number;
  isOpeningPost: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        const message = isOpeningPost
          ? "Delete this post? It's the opening post, so the entire thread will be deleted."
          : "Delete this post?";
        if (confirm(message)) {
          startTransition(() => deletePostAction(fd));
        }
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-ink-400 hover:text-claret-500 transition-colors disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}

export function DeleteThreadButton({ threadId }: { threadId: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        if (confirm("Delete this entire thread and all its posts?")) {
          startTransition(() => deleteThreadAction(fd));
        }
      }}
    >
      <input type="hidden" name="threadId" value={threadId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-ink-400 hover:text-claret-500 transition-colors disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete thread"}
      </button>
    </form>
  );
}
