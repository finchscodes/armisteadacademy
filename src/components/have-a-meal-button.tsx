"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { haveAMealAction } from "@/actions/needs";
import { useToast } from "@/components/toast-provider";

export function HaveAMealButton() {
  const router = useRouter();
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await haveAMealAction();
      if (result?.error) showToast(result.error, "error");
      else if (result?.success) showToast(result.success, "success");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="shrink-0 text-sm bg-ink-800 border border-ink-600 text-parchment-100 px-4 py-2 rounded-md hover:border-gunmetal-500/50 transition-colors disabled:opacity-60"
    >
      {pending ? "..." : "Have a meal"}
    </button>
  );
}
