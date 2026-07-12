"use client";

import { useTransition } from "react";
import { deletePostAction, deleteThreadAction } from "@/actions/forum";
import { adminDeleteCharacterAction, adminDeleteUserAction } from "@/actions/admin";
import { deleteLessonAction } from "@/actions/lessons";
import { deleteGuideSectionAction } from "@/actions/guide";

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

export function DeleteCharacterButton({
  characterId,
  userId,
  characterName,
}: {
  characterId: number;
  userId: number;
  characterName: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        if (
          confirm(
            `Permanently delete "${characterName}"? This also deletes all of their threads, posts, and history. This can't be undone.`
          )
        ) {
          startTransition(() => adminDeleteCharacterAction(fd));
        }
      }}
    >
      <input type="hidden" name="characterId" value={characterId} />
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-claret-500 hover:text-claret-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete character"}
      </button>
    </form>
  );
}

export function DeleteAccountButton({ userId, email }: { userId: number; email: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        if (
          confirm(
            `Permanently delete the account "${email}"? This deletes every character on it and all of their threads, posts, and history. This can't be undone.`
          )
        ) {
          startTransition(() => adminDeleteUserAction(fd));
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-claret-500 hover:text-claret-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete account"}
      </button>
    </form>
  );
}

export function DeleteLessonButton({ lessonId, lessonTitle }: { lessonId: number; lessonTitle: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        if (confirm(`Delete the lesson "${lessonTitle}"? This also deletes every submission and grade for it.`)) {
          startTransition(() => deleteLessonAction(fd));
        }
      }}
    >
      <input type="hidden" name="lessonId" value={lessonId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-claret-500 hover:text-claret-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}

export function DeleteGuideSectionButton({
  sectionId,
  sectionTitle,
}: {
  sectionId: number;
  sectionTitle: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        if (confirm(`Delete the "${sectionTitle}" section from the guidebook?`)) {
          startTransition(() => deleteGuideSectionAction(fd));
        }
      }}
    >
      <input type="hidden" name="sectionId" value={sectionId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-claret-500 hover:text-claret-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}
