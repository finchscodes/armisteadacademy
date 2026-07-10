"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminDeleteBoardAction } from "@/actions/admin";

export function DeleteBoardButton({ boardId, boardName }: { boardId: number; boardName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Permanently delete "${boardName}"? This also deletes every thread and post on it.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("boardId", String(boardId));
      const result = await adminDeleteBoardAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/admin/boards");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-sm text-claret-500 hover:text-claret-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete board"}
      </button>
      {error && <p className="text-xs text-claret-500 mt-1">{error}</p>}
    </div>
  );
}
