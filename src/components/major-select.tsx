"use client";

import { useState } from "react";
import { MAJORS, SELECTABLE_MAJORS, UNDECIDED_MAJOR, type Major } from "@/lib/majors";

export function MajorSelect({
  initialValue,
  options,
}: {
  initialValue?: string;
  /** Defaults to the user-selectable list. Pass MAJORS for admin use. */
  options?: Major[];
}) {
  const list = options ?? SELECTABLE_MAJORS;
  const [selected, setSelected] = useState(initialValue ?? UNDECIDED_MAJOR);
  const description = MAJORS.find((m) => m.value === selected)?.description;

  return (
    <div>
      <label className="block text-sm font-medium mb-1" htmlFor="major">
        Major
      </label>
      <select
        id="major"
        name="major"
        required
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
      >
        {list.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      {description && <p className="text-xs text-ink-400 mt-1.5 leading-relaxed">{description}</p>}
    </div>
  );
}
