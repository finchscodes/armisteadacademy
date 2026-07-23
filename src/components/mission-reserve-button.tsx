"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reserveMissionSpotAction, unreserveMissionSpotAction } from "@/actions/missions";
import { useToast } from "@/components/toast-provider";

export function MissionReserveButton({
  threadId,
  isReserved,
  isFull,
  isPastDeadline,
}: {
  threadId: number;
  isReserved: boolean;
  isFull: boolean;
  isPastDeadline: boolean;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("threadId", String(threadId));
      const action = isReserved ? unreserveMissionSpotAction : reserveMissionSpotAction;
      const result = await action(undefined, formData);
      if (result?.error) showToast(result.error, "error");
      else if (result?.success) showToast(result.success, "success");
      router.refresh();
    });
  }

  if (isPastDeadline) {
    return <p className="text-sm text-ink-400 italic">The deadline for this mission has passed.</p>;
  }
  if (isFull && !isReserved) {
    return <p className="text-sm text-claret-500 italic">This mission is full.</p>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={
        isReserved
          ? "text-sm bg-ink-800 border border-ink-600 text-parchment-100 px-4 py-2 rounded-md hover:border-claret-600/50 hover:text-claret-500 transition-colors disabled:opacity-60"
          : "text-sm bg-gunmetal-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      }
    >
      {pending ? "..." : isReserved ? "Cancel reservation" : "Reserve a spot"}
    </button>
  );
}
