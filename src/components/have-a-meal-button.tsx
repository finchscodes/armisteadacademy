"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { haveAMealAction } from "@/actions/needs";
import { FadingMessage } from "@/components/fading-message";

export function HaveAMealButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await haveAMealAction();
      if (result?.error) setError(result.error);
      else if (result?.success) setMessage(result.success);
      router.refresh();
    });
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="shrink-0 text-sm bg-ink-800 border border-ink-600 text-parchment-100 px-4 py-2 rounded-md hover:border-gunmetal-500/50 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : "Have a meal"}
      </button>
      <div className="absolute top-full right-0 mt-1 z-10 max-w-[220px] text-right">
        <FadingMessage message={message} variant="success" />
        <FadingMessage message={error} variant="error" />
      </div>
    </div>
  );
}
