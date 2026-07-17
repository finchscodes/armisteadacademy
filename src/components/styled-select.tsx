"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type StyledSelectOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  /** Optional colored dot shown before the label (e.g. a major or hall color). */
  accentColor?: string;
};

/**
 * A button + custom listbox that looks like the rest of the site, unlike a
 * native <select> — whose open dropdown is drawn by the OS/browser and
 * can't be restyled with CSS, so it always looks out of place against the
 * dark theme.
 */
export function StyledSelect<T extends string = string>({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Select…",
  className = "",
  id,
  name,
}: {
  value: T;
  onChange: (value: T) => void;
  options: StyledSelectOption<T>[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  /** If set, renders a hidden input so this participates in a normal <form> submit. */
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-left text-parchment-100 focus:outline-none focus:border-gunmetal-500 disabled:opacity-60 hover:border-gunmetal-500/50 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0 truncate">
          {current?.accentColor && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: current.accentColor }}
            />
          )}
          <span className="truncate">{current?.label ?? placeholder}</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`w-3.5 h-3.5 shrink-0 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-ink-800 border border-ink-600 rounded-md shadow-xl shadow-black/40 z-30 py-1"
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm transition-colors hover:bg-ink-700 ${
                o.value === value ? "text-gunmetal-400" : "text-parchment-100"
              }`}
            >
              {o.accentColor && (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: o.accentColor }} />
              )}
              <span className="truncate">{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
