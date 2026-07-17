"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateCharacterBirthdayAction } from "@/actions/admin";
import { QUARTER_ORDER, QUARTER_WEEKS, DAY_NAMES, type Quarter } from "@/lib/game-calendar";
import { StyledSelect } from "@/components/styled-select";

export function AdminBirthdayEditor({
  characterId,
  userId,
  birthdayQuarter,
  birthdayWeek,
  birthdayDayOfWeek,
}: {
  characterId: number;
  userId: number;
  birthdayQuarter: Quarter | null;
  birthdayWeek: number | null;
  birthdayDayOfWeek: number | null;
}) {
  const router = useRouter();
  const [hasBirthday, setHasBirthday] = useState(Boolean(birthdayQuarter));
  const [quarter, setQuarter] = useState<Quarter>(birthdayQuarter ?? "fall");
  const [week, setWeek] = useState(String(birthdayWeek ?? 1));
  const [day, setDay] = useState(String(birthdayDayOfWeek ?? 1));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSet() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      if (hasBirthday) {
        formData.set("birthdayQuarter", quarter);
        formData.set("birthdayWeek", week);
        formData.set("birthdayDayOfWeek", day);
      }
      const result = await adminUpdateCharacterBirthdayAction(undefined, formData);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={hasBirthday}
          onChange={(e) => setHasBirthday(e.target.checked)}
          className="rounded border-ink-600"
        />
        Has a birthday set
      </label>
      {hasBirthday && (
        <div className="grid grid-cols-3 gap-1.5">
          <StyledSelect
            value={quarter}
            onChange={(v) => {
              setQuarter(v as Quarter);
              setWeek("1");
            }}
            options={QUARTER_ORDER.map((q) => ({ value: q, label: q[0].toUpperCase() + q.slice(1) }))}
          />
          <StyledSelect
            value={week}
            onChange={setWeek}
            options={Array.from({ length: QUARTER_WEEKS[quarter] }, (_, i) => ({
              value: String(i + 1),
              label: `Wk ${i + 1}`,
            }))}
          />
          <StyledSelect
            value={day}
            onChange={setDay}
            options={DAY_NAMES.map((d, i) => ({ value: String(i + 1), label: d.slice(0, 3) }))}
          />
        </div>
      )}
      <button
        type="button"
        onClick={handleSet}
        disabled={pending}
        className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : "Set"}
      </button>
      {error && <p className="text-xs text-claret-500">{error}</p>}
    </div>
  );
}
