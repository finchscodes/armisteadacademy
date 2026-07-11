"use client";

import { useActionState, useTransition } from "react";
import { adminAddSiteLinkAction, adminRemoveSiteLinkAction } from "@/actions/admin";

type Link = { id: number; label: string; url: string };

export function SiteLinksForm({ links }: { links: Link[] }) {
  const [state, formAction, pending] = useActionState(adminAddSiteLinkAction, undefined);
  const [removePending, startRemove] = useTransition();

  return (
    <div className="space-y-4">
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between bg-ink-900 border border-ink-700 px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm text-parchment-100">{l.label}</p>
                <p className="text-xs text-ink-400 truncate">{l.url}</p>
              </div>
              <form
                action={(fd) => startRemove(() => adminRemoveSiteLinkAction(fd))}
                className="shrink-0 ml-3"
              >
                <input type="hidden" name="linkId" value={l.id} />
                <button
                  type="submit"
                  disabled={removePending}
                  className="text-xs text-ink-400 hover:text-claret-500 transition-colors disabled:opacity-60"
                >
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="flex flex-wrap gap-2 bg-ink-900 border border-ink-700 p-4">
        <input
          name="label"
          placeholder="Label (e.g. Discord)"
          required
          className="flex-1 min-w-[8rem] text-sm bg-ink-800 border border-ink-600 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
        <input
          name="url"
          placeholder="https://..."
          required
          className="flex-1 min-w-[10rem] text-sm bg-ink-800 border border-ink-600 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-sm bg-brass-500 text-ink-950 px-4 py-2 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
        >
          {pending ? "Adding..." : "Add"}
        </button>
        {state?.error && <p className="text-xs text-claret-500 w-full">{state.error}</p>}
      </form>
    </div>
  );
}
