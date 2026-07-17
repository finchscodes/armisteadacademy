"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  acceptRelationRequestAction,
  rejectRelationRequestAction,
  cancelRelationRequestAction,
} from "@/actions/relations";
import { CharacterBadge } from "@/components/character-badge";
import type { PendingRelation } from "@/lib/character-relations";

export function IncomingRequestsList({ requests }: { requests: PendingRelation[] }) {
  const [pending, startTransition] = useTransition();

  if (requests.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-parchment-100">Incoming requests</p>
      {requests.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between bg-ink-900 border border-ink-700 rounded-lg px-4 py-2.5"
        >
          <div className="flex items-center gap-2.5">
            <CharacterBadge name={`${r.other.firstName} ${r.other.lastName}`} avatarUrl={r.other.avatarUrl} size="sm" />
            <p className="text-sm">
              <Link href={`/c/${r.other.slug}`} className="text-parchment-100 hover:text-gunmetal-400">
                {r.other.firstName} {r.other.lastName}
              </Link>
              <span className="text-ink-400"> wants to be listed as </span>
              <span className="text-gunmetal-400">{r.label}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <form action={(fd) => startTransition(() => acceptRelationRequestAction(fd))}>
              <input type="hidden" name="relationId" value={r.id} />
              <button
                type="submit"
                disabled={pending}
                className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
              >
                Accept
              </button>
            </form>
            <form action={(fd) => startTransition(() => rejectRelationRequestAction(fd))}>
              <input type="hidden" name="relationId" value={r.id} />
              <button
                type="submit"
                disabled={pending}
                className="text-xs text-ink-400 hover:text-claret-500 transition-colors disabled:opacity-60"
              >
                Reject
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OutgoingRequestsList({ requests }: { requests: PendingRelation[] }) {
  const [pending, startTransition] = useTransition();

  if (requests.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-parchment-100">Sent, awaiting response</p>
      {requests.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between bg-ink-900 border border-ink-700 rounded-lg px-4 py-2.5"
        >
          <div className="flex items-center gap-2.5">
            <CharacterBadge name={`${r.other.firstName} ${r.other.lastName}`} avatarUrl={r.other.avatarUrl} size="sm" />
            <p className="text-sm">
              <span className="text-gunmetal-400">{r.label}</span>{" "}
              <Link href={`/c/${r.other.slug}`} className="text-parchment-100 hover:text-gunmetal-400">
                {r.other.firstName} {r.other.lastName}
              </Link>
            </p>
          </div>
          <form action={(fd) => startTransition(() => cancelRelationRequestAction(fd))}>
            <input type="hidden" name="relationId" value={r.id} />
            <button
              type="submit"
              disabled={pending}
              className="text-xs text-ink-400 hover:text-claret-500 transition-colors disabled:opacity-60 shrink-0"
            >
              Cancel
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
