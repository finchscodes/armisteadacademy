"use client";

import { useState } from "react";
import { MAJORS, SELECTABLE_MAJORS, UNDECIDED_MAJOR, type Major } from "@/lib/majors";
import { StyledSelect } from "@/components/styled-select";

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
      <StyledSelect
        id="major"
        name="major"
        value={selected}
        onChange={setSelected}
        options={list.map((m) => ({ value: m.value, label: m.label, accentColor: m.color }))}
      />
      {description && <p className="text-xs text-ink-400 mt-1.5 leading-relaxed">{description}</p>}
    </div>
  );
}
