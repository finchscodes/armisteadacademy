"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApproveConfessionAction, adminRejectConfessionAction } from "@/actions/confessions";

type PendingConfession = {
  id: number;
  content: string;
  createdAt: Date;
  characterId: number;
  characterFirstName: string;
  characterLastName: string;
  characterSlug: string;
};

export function ConfessionQueue({ confessions }: { confessions: PendingConfession[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleApprove(id: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("confessionId", String(id));
      await adminApproveConfessionAction(formData);
      router.refresh();
    });
  }

  function handleReject(id: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("confessionId", String(id));
      await adminRejectConfessionAction(formData);
      router.refresh();
    });
  }

  if (confessions.length === 0) {
    return <p className="text-sm text-ink-400 italic">Nothing waiting on review.</p>;
  }

  return (
    <div className="space-y-3">
      {confessions.map((c) => (
        <div key={c.id} className="bg-ink-900 border border-ink-700 rounded-lg p-4">
          <p className="text-sm text-parchment-100 whitespace-pre-wrap mb-2">{c.content}</p>
          <p className="text-[11px] text-ink-500 mb-3">
            Submitted by{" "}
            <Link href={`/c/${c.characterSlug}`} className="hover:text-gunmetal-400">
              {c.characterFirstName} {c.characterLastName}
            </Link>{" "}
            — never shown publicly
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleApprove(c.id)}
              disabled={pending}
              className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => handleReject(c.id)}
              disabled={pending}
              className="text-xs text-claret-500 hover:text-claret-400 disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
