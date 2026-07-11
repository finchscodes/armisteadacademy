"use client";

import { useRef, useState, useTransition } from "react";
import { uploadFaceclaimAction } from "@/actions/uploads";

export function FaceclaimUpload({
  name = "avatarUrl",
  initialUrl,
  label = "Faceclaim",
  wide = false,
}: {
  name?: string;
  initialUrl?: string | null;
  label?: string;
  wide?: boolean;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadFaceclaimAction(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        setUrl(result.url);
      }
    });
  }

  const previewClass = wide
    ? "w-full sm:w-40 h-16 rounded-lg object-cover border-2 border-brass-500/60 shrink-0"
    : "w-16 h-16 rounded-lg object-cover border-2 border-brass-500/60 shrink-0";
  const placeholderClass = wide
    ? "w-full sm:w-40 h-16 rounded-lg border-2 border-dashed border-ink-600 flex items-center justify-center text-ink-400 text-[10px] text-center shrink-0"
    : "w-16 h-16 rounded-lg border-2 border-dashed border-ink-600 flex items-center justify-center text-ink-400 text-[10px] text-center shrink-0";

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className={previewClass} />
        ) : (
          <div className={placeholderClass}>No image</div>
        )}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleFile}
            className="text-xs text-ink-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-ink-700 file:text-parchment-100 file:text-xs hover:file:bg-ink-600"
          />
          <p className="text-[11px] text-ink-400 mt-1">PNG, JPG, GIF, or WEBP — up to 25MB. Optional.</p>
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="text-[11px] text-claret-500 hover:underline mt-1"
            >
              Remove image
            </button>
          )}
          {pending && <p className="text-xs text-brass-400 mt-1">Uploading...</p>}
          {error && <p className="text-xs text-claret-500 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}
