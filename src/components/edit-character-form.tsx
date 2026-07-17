"use client";

import { useActionState, useState } from "react";
import { updateCharacterAction } from "@/actions/characters";
import { MajorSelect } from "@/components/major-select";
import { FaceclaimUpload } from "@/components/faceclaim-upload";
import { UNDECIDED_MAJOR, getMajorColor } from "@/lib/majors";
import { RATING_VALUES, RATING_META } from "@/lib/thread-rating";
import { RichTextEditor } from "@/components/rich-text-editor";
import { StyledSelect } from "@/components/styled-select";
import { QUARTER_ORDER, QUARTER_WEEKS, DAY_NAMES, type Quarter } from "@/lib/game-calendar";

function InfoRow({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm py-1">
      <span className="text-ink-400">{label}</span>
      <span className="ml-auto text-right" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

type Tab = "personality" | "appearance" | "transcript";

export function EditCharacterForm({
  characterId,
  legalName,
  age,
  name,
  major,
  avatarUrl,
  bio,
  backstoryRating,
  gender,
  socialStatus,
  personality,
  appearance,
  birthdayQuarter,
  birthdayWeek,
  birthdayDayOfWeek,
}: {
  characterId: number;
  legalName: string;
  age: number;
  name: string;
  major: string;
  avatarUrl: string | null;
  bio: string | null;
  backstoryRating: number | null;
  gender: string | null;
  socialStatus: string | null;
  personality: string | null;
  appearance: string | null;
  birthdayQuarter: Quarter | null;
  birthdayWeek: number | null;
  birthdayDayOfWeek: number | null;
}) {
  const [state, formAction, pending] = useActionState(updateCharacterAction, undefined);
  const majorIsLocked = major !== UNDECIDED_MAJOR;
  const [hasBirthday, setHasBirthday] = useState(Boolean(birthdayQuarter));
  const [bdQuarter, setBdQuarter] = useState<Quarter>(birthdayQuarter ?? "fall");
  const [bdWeek, setBdWeek] = useState(String(birthdayWeek ?? 1));
  const [bdDay, setBdDay] = useState(String(birthdayDayOfWeek ?? 1));
  const [tab, setTab] = useState<Tab>("personality");

  const tabs: { key: Tab; label: string }[] = [
    { key: "personality", label: "Personality" },
    { key: "appearance", label: "Appearance" },
    { key: "transcript", label: "Transcript" },
  ];

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <input type="hidden" name="characterId" value={characterId} />

      <div className="border-t border-ink-700 pt-3">
        <InfoRow label="Legal name" value={legalName} />
        <InfoRow label="Age" value={age} />
        <InfoRow label="Gender" value={gender} />
        <InfoRow label="Status" value={socialStatus} />
        {majorIsLocked && <InfoRow label="Major" value={major} color={getMajorColor(major) ?? undefined} />}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Code name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={name}
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      <FaceclaimUpload name="avatarUrl" initialUrl={avatarUrl} />

      {!majorIsLocked && (
        <div>
          <label className="block text-sm font-medium mb-1">Major</label>
          <MajorSelect initialValue={major} />
        </div>
      )}

      <div>
        <div className="flex gap-1 border-b border-ink-700 mb-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`text-sm px-3 py-2 border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-brass-500 text-brass-400"
                  : "border-transparent text-ink-400 hover:text-parchment-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "personality" && (
          <div>
            <RichTextEditor name="personality" initialValue={personality ?? ""} />
          </div>
        )}

        {tab === "appearance" && (
          <div>
            <RichTextEditor name="appearance" initialValue={appearance ?? ""} />
          </div>
        )}

        {tab === "transcript" && (
          <div className="space-y-3">
            <div>
              <RichTextEditor name="bio" initialValue={bio ?? ""} />
              <p className="text-[11px] text-ink-400 mt-1">
                Editing this puts your transcript back to pending review.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="backstoryRating">
                Transcript rating
              </label>
              <select
                id="backstoryRating"
                name="backstoryRating"
                defaultValue={backstoryRating ?? ""}
                className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
              >
                <option value="">Unrated</option>
                {RATING_VALUES.map((r) => (
                  <option key={r} value={r}>
                    {RATING_META[r].label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-ink-400 mt-1">
                So readers know what to expect before opening your transcript.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-ink-700 pt-4">
        {birthdayQuarter ? (
          <>
            <label className="block text-sm font-medium mb-1">Birthday</label>
            <p className="text-sm text-parchment-100">
              {birthdayQuarter[0].toUpperCase() + birthdayQuarter.slice(1)}, Week {birthdayWeek},{" "}
              {DAY_NAMES[(birthdayDayOfWeek ?? 1) - 1]}
            </p>
            <p className="text-[11px] text-ink-400 mt-1">
              Set once, permanently — an admin can change it if something needs fixing.
            </p>
          </>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <input
                type="checkbox"
                checked={hasBirthday}
                onChange={(e) => setHasBirthday(e.target.checked)}
                className="rounded border-ink-600"
              />
              Set a birthday
            </label>
            <p className="text-[11px] text-ink-400 mb-2">
              Your character&apos;s age goes up by one automatically when the in-game calendar reaches this
              date. This can only be set once — choose carefully.
            </p>
            {hasBirthday && (
              <div className="grid grid-cols-3 gap-2">
                <input type="hidden" name="birthdayQuarter" value={bdQuarter} />
                <input type="hidden" name="birthdayWeek" value={bdWeek} />
                <input type="hidden" name="birthdayDayOfWeek" value={bdDay} />
                <StyledSelect
                  value={bdQuarter}
                  onChange={(v) => {
                    setBdQuarter(v as Quarter);
                    setBdWeek("1");
                  }}
                  options={QUARTER_ORDER.map((q) => ({ value: q, label: q[0].toUpperCase() + q.slice(1) }))}
                />
                <StyledSelect
                  value={bdWeek}
                  onChange={setBdWeek}
                  options={Array.from({ length: QUARTER_WEEKS[bdQuarter] }, (_, i) => ({
                    value: String(i + 1),
                    label: `Week ${i + 1}`,
                  }))}
                />
                <StyledSelect
                  value={bdDay}
                  onChange={setBdDay}
                  options={DAY_NAMES.map((d, i) => ({ value: String(i + 1), label: d }))}
                />
              </div>
            )}
          </>
        )}
      </div>

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-brass-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
