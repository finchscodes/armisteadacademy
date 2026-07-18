"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPostAction } from "@/actions/forum";
import { uploadSocialPostImageAction } from "@/actions/social";
import { RichTextEditor } from "@/components/rich-text-editor";

export function SocialReplyForm({ threadSlug }: { threadSlug: string }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    startUpload(async () => {
      const result = await uploadSocialPostImageAction(formData);
      if (result.error) setUploadError(result.error);
      else if (result.url) setImageUrl(result.url);
    });
  }

  function confirmUrl() {
    const trimmed = urlDraft.trim();
    if (!/^https?:\/\/\S+$/i.test(trimmed)) {
      setUploadError("Enter a valid image URL starting with http:// or https://");
      return;
    }
    setUploadError(null);
    setImageUrl(trimmed);
    setUrlDraft("");
    setShowUrlInput(false);
  }

  function handleSubmit(formData: FormData) {
    setSubmitError(null);
    formData.set("imageUrl", imageUrl);
    startSubmit(async () => {
      const result = await createPostAction(undefined, formData);
      if (result?.error) {
        setSubmitError(result.error);
        return;
      }
      setImageUrl("");
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="bg-ink-900 border border-ink-700 rounded-lg p-4 space-y-3">
      <input type="hidden" name="threadSlug" value={threadSlug} />

      <div>
        <label className="block text-sm font-medium mb-1">Photo</label>
        {imageUrl ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="max-h-64 rounded-md border border-ink-600" />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="absolute top-1 right-1 bg-ink-950/80 text-parchment-100 text-xs rounded-full w-6 h-6 flex items-center justify-center hover:bg-claret-600 transition-colors"
            >
              &times;
            </button>
          </div>
        ) : showUrlInput ? (
          <div className="flex items-center gap-2">
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://..."
              autoFocus
              className="flex-1 min-w-0 rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            />
            <button
              type="button"
              onClick={confirmUrl}
              className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors"
            >
              Use
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="text-xs text-ink-400 hover:text-parchment-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs bg-ink-800 border border-ink-600 text-parchment-100 px-3 py-2 rounded-md hover:border-gunmetal-500/50 transition-colors disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload a photo"}
            </button>
            <span className="text-xs text-ink-500">or</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="text-xs bg-ink-800 border border-ink-600 text-parchment-100 px-3 py-2 rounded-md hover:border-gunmetal-500/50 transition-colors"
            >
              Paste a URL
            </button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        {uploadError && <p className="text-xs text-claret-500 mt-1">{uploadError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Caption (optional)</label>
        <RichTextEditor name="content" placeholder="Write a caption..." />
      </div>

      {submitError && <p className="text-sm text-claret-500">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {submitting ? "Posting..." : "Post"}
      </button>
    </form>
  );
}
