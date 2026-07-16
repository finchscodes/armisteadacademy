"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUnbanIpAction } from "@/actions/admin";

export function UnbanIpButton({ id }: { id: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleUnban() {
    if (!confirm("Unban this IP?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      await adminUnbanIpAction(formData);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleUnban}
      disabled={pending}
      className="shrink-0 text-xs bg-ink-800 border border-ink-600 text-parchment-100 px-3 py-1.5 rounded-md hover:border-brass-500/50 transition-colors disabled:opacity-60"
    >
      {pending ? "..." : "Unban"}
    </button>
  );
}
