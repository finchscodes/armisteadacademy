"use client";

import { useEffect, useRef, useState } from "react";
import { searchCharactersByNameAction, type CharacterNameMatch } from "@/actions/mini-profile";

/**
 * A text input that suggests matching characters after 3+ letters,
 * click-to-fill — same trigger threshold as chat's @mention autocomplete.
 * Submits via a hidden input under `name` so it drops straight into a
 * normal <form action>.
 */
export function CharacterNameAutocomplete({
  name,
  id,
  placeholder,
  required,
}: {
  name: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState("");
  const [matches, setMatches] = useState<CharacterNameMatch[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (value.trim().length < 3) {
        if (!cancelled) setMatches([]);
        return;
      }
      const results = await searchCharactersByNameAction(value);
      if (!cancelled) {
        setMatches(results);
        setOpen(results.length > 0);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => matches.length > 0 && setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
      />
      <input type="hidden" name={name} value={value} />
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-ink-900 border border-ink-700 rounded-lg shadow-xl overflow-hidden max-h-56 overflow-y-auto">
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setValue(m.name);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 text-left text-sm px-3 py-2 hover:bg-ink-800 transition-colors"
            >
              {m.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.avatarUrl} alt={m.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
              )}
              <span className="text-parchment-100">{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
