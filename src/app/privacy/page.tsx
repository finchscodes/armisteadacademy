import { getPrivacyPolicy } from "@/actions/admin";
import { RichTextDisplay } from "@/components/rich-text-display";

export const metadata = { title: "Privacy Policy — Armistead Academy" };

// Admin edits this at /admin/privacy and expects it to show up immediately.
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  let policy;
  try {
    policy = await getPrivacyPolicy();
  } catch (err) {
    console.error("PrivacyPage failed to load policy content:", err);
    policy = null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-gunmetal-400 mb-1">Privacy Policy</h1>
      <p className="text-xs text-ink-400 mb-8">
        Last updated {policy?.updatedAt ? policy.updatedAt.toLocaleDateString() : "—"}
      </p>

      {policy?.content ? (
        <RichTextDisplay html={policy.content} className="text-sm text-parchment-100/85 leading-relaxed" />
      ) : (
        <p className="text-sm text-ink-400 italic">This page hasn&apos;t been written yet.</p>
      )}
    </div>
  );
}
