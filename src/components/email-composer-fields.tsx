"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { MailIcon, DocumentIcon } from "@/components/nav-icons";

export function EmailComposerFields({
  initialFormat = "email",
  initialContent,
  initialLetterTo,
  initialLetterFrom,
}: {
  initialFormat?: "email" | "letter";
  initialContent?: string;
  initialLetterTo?: string;
  initialLetterFrom?: string;
}) {
  const [emailFormat, setEmailFormat] = useState<"email" | "letter">(initialFormat);

  return (
    <>
      <input type="hidden" name="emailFormat" value={emailFormat} />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEmailFormat("email")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors ${
            emailFormat === "email"
              ? "bg-brass-500 text-ink-950 border-brass-500 font-medium"
              : "bg-ink-800 border-ink-600 text-parchment-100 hover:border-brass-500/50"
          }`}
        >
          <MailIcon className="w-3.5 h-3.5" />
          Email
        </button>
        <button
          type="button"
          onClick={() => setEmailFormat("letter")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors ${
            emailFormat === "letter"
              ? "bg-brass-500 text-ink-950 border-brass-500 font-medium"
              : "bg-ink-800 border-ink-600 text-parchment-100 hover:border-brass-500/50"
          }`}
        >
          <DocumentIcon className="w-3.5 h-3.5" />
          Letter
        </button>
      </div>

      {emailFormat === "letter" && (
        <div className="space-y-3 border border-ink-700 rounded-lg p-4 bg-ink-800/40">
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="letterTo">
              To
            </label>
            <input
              id="letterTo"
              name="letterTo"
              defaultValue={initialLetterTo}
              placeholder="e.g. recipient's name"
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500 font-display"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="letterFrom">
              From
            </label>
            <input
              id="letterFrom"
              name="letterFrom"
              defaultValue={initialLetterFrom}
              placeholder="e.g. your name"
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500 font-display"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          {emailFormat === "letter" ? "Letter body" : "Email body"}
        </label>
        <RichTextEditor name="content" initialValue={initialContent} />
      </div>
    </>
  );
}
