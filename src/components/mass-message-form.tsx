"use client";

import { useState, useEffect, useActionState } from "react";
import { adminMassMessageAction, countMassMessageRecipientsAction } from "@/actions/mass-message";
import { RichTextEditor } from "@/components/rich-text-editor";
import { StyledSelect } from "@/components/styled-select";
import { hallLabel } from "@/lib/halls";

const ALL = "__all";

export function MassMessageForm({
  majorOptions,
  hallOptions,
  yearOptions,
  ageOptions,
}: {
  majorOptions: string[];
  hallOptions: string[];
  yearOptions: string[];
  ageOptions: number[];
}) {
  const [state, formAction, pending] = useActionState(adminMassMessageAction, undefined);
  const [major, setMajor] = useState(ALL);
  const [hall, setHall] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [age, setAge] = useState(ALL);
  const [count, setCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setCountLoading(true);
      const n = await countMassMessageRecipientsAction({ major, hall, year, age });
      if (!cancelled) {
        setCount(n);
        setCountLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [major, hall, year, age]);

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <input type="hidden" name="major" value={major} />
      <input type="hidden" name="hall" value={hall} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="age" value={age} />

      <div>
        <p className="text-sm font-medium mb-2">Recipients</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-ink-400 mb-1">Major</label>
            <StyledSelect
              value={major}
              onChange={setMajor}
              options={[{ value: ALL, label: "All majors" }, ...majorOptions.map((m) => ({ value: m, label: m }))]}
            />
          </div>
          <div>
            <label className="block text-[11px] text-ink-400 mb-1">Hall</label>
            <StyledSelect
              value={hall}
              onChange={setHall}
              options={[
                { value: ALL, label: "All halls" },
                ...hallOptions.map((h) => ({ value: h, label: hallLabel(h) })),
              ]}
            />
          </div>
          <div>
            <label className="block text-[11px] text-ink-400 mb-1">Year</label>
            <StyledSelect
              value={year}
              onChange={setYear}
              options={[{ value: ALL, label: "All years" }, ...yearOptions.map((y) => ({ value: y, label: y }))]}
            />
          </div>
          <div>
            <label className="block text-[11px] text-ink-400 mb-1">Age</label>
            <StyledSelect
              value={age}
              onChange={setAge}
              options={[
                { value: ALL, label: "Any age" },
                ...ageOptions.map((a) => ({ value: String(a), label: String(a) })),
              ]}
            />
          </div>
        </div>
        <p className="text-xs text-ink-400 mt-2">
          {countLoading ? "Counting..." : count === null ? "" : `${count} character${count === 1 ? "" : "s"} match`}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="subject">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-gunmetal-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <RichTextEditor name="content" />
      </div>

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-500">{state.success}</p>}

      <button
        type="submit"
        disabled={pending || count === 0}
        className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Sending..." : `Send${count ? ` to ${count}` : ""}`}
      </button>
    </form>
  );
}
