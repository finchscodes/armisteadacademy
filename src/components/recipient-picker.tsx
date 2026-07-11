"use client";

import { useState, useTransition } from "react";
import { searchCharactersAction } from "@/actions/messages";

type CharacterOption = { id: number; name: string; firstName: string; lastName: string; slug: string };

export function RecipientPicker({
  selected,
  onChange,
  name,
  excludeIds = [],
}: {
  selected: CharacterOption[];
  onChange: (next: CharacterOption[]) => void;
  name: string;
  excludeIds?: number[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CharacterOption[]>([]);
  const [pending, startTransition] = useTransition();

  function handleInput(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const found = await searchCharactersAction(value);
      const selectedIds = new Set(selected.map((s) => s.id));
      setResults(found.filter((f) => !selectedIds.has(f.id) && !excludeIds.includes(f.id)));
    });
  }

  function addRecipient(c: CharacterOption) {
    onChange([...selected, c]);
    setQuery("");
    setResults([]);
  }

  function removeRecipient(id: number) {
    onChange(selected.filter((s) => s.id !== id));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selected.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-2 text-xs bg-ink-800 border border-ink-600 rounded-full pl-3.5 pr-1.5 py-1.5"
          >
            {c.firstName} {c.lastName}
            <input type="hidden" name={name} value={c.id} />
            <button
              type="button"
              onClick={() => removeRecipient(c.id)}
              className="w-4 h-4 rounded-full bg-ink-700 hover:bg-claret-600 text-parchment-100 flex items-center justify-center leading-none"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Type to pick a recipient..."
          className="w-full text-sm bg-ink-800 border border-ink-600 rounded-md px-3 py-2 focus:outline-none focus:border-brass-500"
        />
        {query && (results.length > 0 || pending) && (
          <div className="absolute z-10 mt-1 w-full bg-ink-900 border border-ink-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {pending && results.length === 0 ? (
              <p className="text-xs text-ink-400 px-3 py-2">Searching...</p>
            ) : (
              results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => addRecipient(c)}
                  className="block w-full text-left text-sm px-3 py-2 hover:bg-ink-800 transition-colors"
                >
                  {c.firstName} {c.lastName}{" "}
                  <span className="text-ink-400 text-xs">({c.name})</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
