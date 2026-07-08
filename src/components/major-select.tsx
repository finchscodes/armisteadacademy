"use client";

import { useState } from "react";
import { MAJORS } from "@/lib/majors";

const DEFAULT_MAJOR = "Undecided/Witness Protection";

export function MajorSelect() {
  const [selected, setSelected] = useState(DEFAULT_MAJOR);
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
        {MAJORS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      {description && <p className="text-xs text-ink-400 mt-1.5 leading-relaxed">{description}</p>}
    </div>
  );
}
