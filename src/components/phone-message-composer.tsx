"use client";

import { useRef, useState } from "react";
import { uploadFaceclaimAction } from "@/actions/uploads";
import { formatActionLine, formatImageLine, formatCallContent, parseCallContent } from "@/lib/phone-messages";

type Participant = { id: number; name: string; avatarUrl: string | null };

/**
 * The phone/texting board composer. No rich-text editor — it's just a
 * textarea where each line becomes its own message bubble, plus buttons to
 * insert an action line, a photo, or switch into "call" mode entirely
 * (one continuous narrative instead of line-by-line messages).
 */
export function PhoneMessageComposer({
  name = "content",
  initialValue = "",
  placeholder = "Type a message, then press Enter to start the next one...",
  participants = [],
}: {
  name?: string;
  initialValue?: string;
  placeholder?: string;
  /** Other characters already in this conversation — offered as call targets. */
  participants?: Participant[];
}) {
  const initialCall = initialValue ? parseCallContent(initialValue) : null;

  const [mode, setMode] = useState<"message" | "call">(initialCall ? "call" : "message");
  const [value, setValue] = useState(initialCall ? "" : initialValue);
  const [showActionInput, setShowActionInput] = useState(false);
  const [actionText, setActionText] = useState("");
  const [showPhotoUrlInput, setShowPhotoUrlInput] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [callTargetId, setCallTargetId] = useState<string>(
    initialCall?.calleeId ? String(initialCall.calleeId) : "__custom"
  );
  const [callTargetName, setCallTargetName] = useState(initialCall?.calleeName ?? "");
  const [callBody, setCallBody] = useState(initialCall?.body ?? "");

  function appendLine(line: string) {
    setValue((prev) => (prev.trim().length > 0 ? `${prev.replace(/\n+$/, "")}\n${line}` : line));
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function confirmAction() {
    if (!actionText.trim()) return;
    appendLine(formatActionLine(actionText));
    setActionText("");
    setShowActionInput(false);
  }

  function confirmPhotoUrl() {
    if (!photoUrl.trim()) return;
    appendLine(formatImageLine(photoUrl));
    setPhotoUrl("");
    setShowPhotoUrlInput(false);
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

  const finalValue =
    mode === "call"
      ? formatCallContent(
          callTargetId === "__custom"
            ? { calleeId: null, calleeName: callTargetName }
            : { calleeId: Number(callTargetId), calleeName: "" },
          callBody
        )
      : value;

  return (
    <div>
      <input type="hidden" name={name} value={finalValue} />

      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode("message")}
          className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
            mode === "message"
              ? "bg-brass-500 text-ink-950 border-brass-500 font-medium"
              : "bg-ink-800 border-ink-600 text-parchment-100 hover:border-brass-500/50"
          }`}
        >
          💬 Texting
        </button>
        <button
          type="button"
          onClick={() => setMode("call")}
          className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
            mode === "call"
              ? "bg-brass-500 text-ink-950 border-brass-500 font-medium"
              : "bg-ink-800 border-ink-600 text-parchment-100 hover:border-brass-500/50"
          }`}
        >
          📞 Call
        </button>
      </div>

      {mode === "message" ? (
        <>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={5}
            placeholder={placeholder}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500 font-sans"
          />
          <p className="text-[11px] text-ink-400 mt-1">
            Each line becomes its own message. Use the buttons below to add context (like
            &ldquo;left on read&rdquo;) or a photo.
          </p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
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
              {uploading ? "Uploading..." : "+ Photo (upload)"}
            </button>
            <button
              type="button"
              onClick={() => setShowPhotoUrlInput((v) => !v)}
              className="text-xs bg-ink-800 border border-ink-600 text-parchment-100 px-3 py-1.5 rounded-md hover:border-brass-500/50 transition-colors"
            >
              + Photo (URL)
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

          {showPhotoUrlInput && (
            <div className="flex items-center gap-2 mt-2">
              <input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmPhotoUrl();
                  }
                }}
                autoFocus
                placeholder="https://..."
                className="flex-1 rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-xs focus:outline-none focus:border-brass-500"
              />
              <button
                type="button"
                onClick={confirmPhotoUrl}
                className="text-xs bg-brass-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-brass-400 transition-colors"
              >
                Add
              </button>
            </div>
          )}

          {uploadError && <p className="text-xs text-claret-500 mt-1">{uploadError}</p>}
        </>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-ink-400 mb-1">Calling</label>
            {participants.length > 0 ? (
              <select
                value={callTargetId}
                onChange={(e) => setCallTargetId(e.target.value)}
                className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value="__custom">Someone else...</option>
              </select>
            ) : null}
            {(participants.length === 0 || callTargetId === "__custom") && (
              <input
                value={callTargetName}
                onChange={(e) => setCallTargetName(e.target.value)}
                placeholder="Who's being called?"
                className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500 mt-2"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-400 mb-1">Call narrative</label>
            <textarea
              value={callBody}
              onChange={(e) => setCallBody(e.target.value)}
              rows={6}
              placeholder='Write the call as one continuous scene. Wrap spoken dialogue in "quotes" to highlight it.'
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
