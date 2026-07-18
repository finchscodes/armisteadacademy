"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { haveAMealAction } from "@/actions/needs";

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
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-sm bg-gunmetal-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : "Have a meal"}
      </button>
      {message && <p className="text-xs text-green-500 mt-1">{message}</p>}
      {error && <p className="text-xs text-claret-500 mt-1">{error}</p>}
    </div>
  );
}
