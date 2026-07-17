"use client";

import { useActionState, useState } from "react";
import { adminCreateBoardAction } from "@/actions/admin";
import { ACTIVE_JOB_VALUES, jobLabel } from "@/lib/roles";

type Category = { id: number; name: string };

export function NewBoardForm({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(adminCreateBoardAction, undefined);
  const [kind, setKind] = useState<"category" | "board" | "class" | "article" | "phone" | "email" | "shop" | "bank">("board");

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-gunmetal-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="kind">
          Type
        </label>
        <select
          id="kind"
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
        >
          <option value="category">Category (a top-level menu section)</option>
          <option value="board">Topic area (regular threads)</option>
          <option value="class">Class (lessons only, no topics)</option>
          <option value="article">Article board (management posts, comments)</option>
          <option value="phone">Phone/texting board (message-bubble topics)</option>
          <option value="email">Email/letters board (envelope-style topics, comments)</option>
          <option value="shop">Shop (browse and buy items)</option>
          <option value="bank">Bank (deposit/withdraw, one per site really)</option>
        </select>
      </div>

      {kind !== "category" && (
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="parentId">
            Category
          </label>
          <select
            id="parentId"
            name="parentId"
            required
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {kind === "article" && (
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="extraArticleJob">
            Also let this job post here (optional)
          </label>
          <select
            id="extraArticleJob"
            name="extraArticleJob"
            defaultValue=""
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          >
            <option value="">None — management only</option>
            {ACTIVE_JOB_VALUES.filter((j) => j !== "none").map((j) => (
              <option key={j} value={j}>
                {jobLabel(j)}
              </option>
            ))}
          </select>
        </div>
      )}

      {kind === "class" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="restrictedYearMin">
              Minimum year (optional)
            </label>
            <input
              id="restrictedYearMin"
              name="restrictedYearMin"
              type="number"
              min={1}
              placeholder="e.g. 3 for 3rd year and up"
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="restrictedYearMax">
              Maximum year (optional)
            </label>
            <input
              id="restrictedYearMax"
              name="restrictedYearMax"
              type="number"
              min={1}
              placeholder="e.g. 1 for 1st years only"
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="clearance">
          Clearance (optional, flavor text)
        </label>
        <input
          id="clearance"
          name="clearance"
          placeholder="e.g. Level 3 Clearance Required"
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
        />
        <p className="text-[11px] text-ink-400 mt-1">Purely decorative — nothing enforces this.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Shown at the top of the board page. Leave blank for none."
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
        />
      </div>

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
