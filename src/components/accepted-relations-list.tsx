"use client";

import Link from "next/link";
import { useTransition } from "react";
import { removeRelationAction } from "@/actions/relations";
import { CharacterBadge } from "@/components/character-badge";
import { jobColor } from "@/lib/roles";
import type { AcceptedRelation } from "@/lib/character-relations";

export function AcceptedRelationsList({
  relations,
  canRemove,
  compact = false,
}: {
  relations: AcceptedRelation[];
  canRemove: boolean;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (relations.length === 0) {
    return compact ? null : <p className="text-sm text-ink-400 italic">No relations yet.</p>;
  }

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "space-y-2"}>
      {relations.map((r) => {
        const nameColor = jobColor((r.other.job ?? "none") as never) ?? undefined;
        return compact ? (
          <Link
            key={r.id}
            href={`/c/${r.other.slug}`}
            className="inline-flex items-center gap-1.5 text-xs bg-ink-800 border border-ink-600 rounded-full pl-1 pr-2.5 py-1 hover:border-gunmetal-500/50 transition-colors"
          >
            <CharacterBadge name={`${r.other.firstName} ${r.other.lastName}`} avatarUrl={r.other.avatarUrl} size="sm" />
            <span className="text-ink-400">{r.label}</span>
            <span style={{ color: nameColor }} className={nameColor ? "" : "text-parchment-100"}>
              {r.other.firstName} {r.other.lastName}
            </span>
          </Link>
        ) : (
          <div
            key={r.id}
            className="flex items-center justify-between bg-ink-900 border border-ink-700 rounded-lg px-4 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <CharacterBadge name={`${r.other.firstName} ${r.other.lastName}`} avatarUrl={r.other.avatarUrl} size="sm" />
              <p className="text-sm">
                <span className="text-gunmetal-400">{r.label}</span>{" "}
                <Link
                  href={`/c/${r.other.slug}`}
                  className={`hover:text-gunmetal-400 ${nameColor ? "" : "text-parchment-100"}`}
                  style={{ color: nameColor }}
                >
                  {r.other.firstName} {r.other.lastName}
                </Link>
              </p>
            </div>
            {canRemove && (
              <form action={(fd) => startTransition(() => removeRelationAction(fd))}>
                <input type="hidden" name="relationId" value={r.id} />
                <button
                  type="submit"
                  disabled={pending}
                  className="text-xs text-ink-400 hover:text-claret-500 transition-colors disabled:opacity-60 shrink-0"
                >
                  Remove
                </button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
