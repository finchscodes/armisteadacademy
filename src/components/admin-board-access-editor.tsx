"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminGrantBoardAccessAction, adminRevokeBoardAccessAction } from "@/actions/admin";

type Grant = { id: number; boardId: number; boardName: string };
type BoardOption = { id: number; name: string; kind: string };

export function AdminBoardAccessEditor({
  characterId,
  userId,
  currentGrants,
  boards,
}: {
  characterId: number;
  userId: number;
  currentGrants: Grant[];
  boards: BoardOption[];
}) {
  const router = useRouter();
  const articleBoards = boards.filter((b) => b.kind === "article");
  const [boardId, setBoardId] = useState(String(articleBoards[0]?.id ?? ""));
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    if (!boardId) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      formData.set("boardId", boardId);
      await adminGrantBoardAccessAction(formData);
      router.refresh();
    });
  }

  function handleRemove(grantId: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("grantId", String(grantId));
      formData.set("userId", String(userId));
      await adminRevokeBoardAccessAction(formData);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {currentGrants.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {currentGrants.map((g) => (
            <span
              key={g.id}
              className="inline-flex items-center gap-1.5 text-xs bg-ink-800 border border-ink-600 rounded-full pl-2.5 pr-1 py-1"
            >
              {g.boardName}
              <button
                type="button"
                onClick={() => handleRemove(g.id)}
                disabled={pending}
                className="w-4 h-4 rounded-full bg-ink-700 hover:bg-claret-600 text-parchment-100 flex items-center justify-center leading-none disabled:opacity-50"
                title="Remove"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <select
          value={boardId}
          onChange={(e) => setBoardId(e.target.value)}
          className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500"
        >
          {articleBoards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending || !boardId}
          className="text-xs bg-brass-500 text-ink-950 px-2 py-1 rounded font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
        >
          {pending ? "..." : "Grant access"}
        </button>
      </div>
      <p className="text-[11px] text-ink-400">
        Posting access to an article board without a public job — for quiet helpers.
      </p>
    </div>
  );
}
