"use client";

import { useRef, useState } from "react";
import { uploadFaceclaimAction } from "@/actions/uploads";
import { formatActionLine, formatImageLine } from "@/lib/phone-messages";

/**
 * The phone/texting board composer. No rich-text editor — it's just a
 * textarea where each line becomes its own message bubble, plus two
 * buttons that insert specially-prefixed lines ("/action ..." and
 * "/img ...") that render differently. Used for new topics, replies, and
 * edits alike.
 */
export function PhoneMessageComposer({
  name = "content",
  initialValue = "",
  placeholder = "Type a message, then press Enter to start the next one...",
}: {
  name?: string;
  initialValue?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [showActionInput, setShowActionInput] = useState(false);
  const [actionText, setActionText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function appendLine(line: string) {
    setValue((prev) => (prev.trim().length > 0 ? `${prev.replace(/\n+$/, "")}\n${line}` : line));
    // Put focus back so someone can keep typing right after.
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function confirmAction() {
    if (!actionText.trim()) return;
    appendLine(formatActionLine(actionText));
    setActionText("");
    setShowActionInput(false);
  }

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadFaceclaimAction(formData);
    setUploading(false);

    if (result.error) {
      setUploadError(result.error);
      return;
    }
    if (result.url) {
      appendLine(formatImageLine(result.url));
    }
  }

  return (
    <div>
      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        placeholder={placeholder}
        className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500 font-sans"
      />
      <p className="text-[11px] text-ink-400 mt-1">
        Each line becomes its own message. Use the buttons below to add context (like &ldquo;left
        on read&rdquo;) or a photo.
      </p>

      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => setShowActionInput((v) => !v)}
          className="text-xs bg-ink-800 border border-ink-600 text-parchment-100 px-3 py-1.5 rounded-md hover:border-brass-500/50 transition-colors"
        >
          + Action
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs bg-ink-800 border border-ink-600 text-parchment-100 px-3 py-1.5 rounded-md hover:border-brass-500/50 transition-colors disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "+ Photo"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={handlePhotoPick}
          className="hidden"
        />
      </div>

      {showActionInput && (
        <div className="flex items-center gap-2 mt-2">
          <input
            value={actionText}
            onChange={(e) => setActionText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmAction();
              }
            }}
            autoFocus
            placeholder='e.g. "message delivered" or "left on read"'
            className="flex-1 rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-xs focus:outline-none focus:border-brass-500"
          />
          <button
            type="button"
            onClick={confirmAction}
            className="text-xs bg-brass-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-brass-400 transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {uploadError && <p className="text-xs text-claret-500 mt-1">{uploadError}</p>}
    </div>
  );
}
