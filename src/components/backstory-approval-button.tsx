"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBackstoryApprovalAction } from "@/actions/characters";

export function BackstoryApprovalButton({
  characterId,
  reviewerCharacterId,
  isApproved,
}: {
  characterId: number;
  reviewerCharacterId: number | null;
  isApproved: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      if (reviewerCharacterId) formData.set("reviewerCharacterId", String(reviewerCharacterId));
      await toggleBackstoryApprovalAction(formData);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`text-xs px-3 py-1.5 rounded-md border transition-colors disabled:opacity-60 ${
        isApproved
          ? "border-ink-600 text-ink-400 hover:border-claret-500/50 hover:text-claret-500"
          : "border-brass-500/50 text-brass-400 hover:bg-brass-500/10"
      }`}
    >
      {pending ? "..." : isApproved ? "Unapprove" : "Approve backstory"}
    </button>
  );
}
