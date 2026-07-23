import { getPrivacyPolicy } from "@/actions/admin";
import { PrivacyPolicyForm } from "@/components/privacy-policy-form";

export const dynamic = "force-dynamic";

export default async function AdminPrivacyPage() {
  const policy = await getPrivacyPolicy();

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-lg text-parchment-100 mb-3">Privacy Policy</h2>
      <p className="text-sm text-ink-400 mb-4">
        This is the text shown at{" "}
        <a href="/privacy" target="_blank" className="text-gunmetal-400 hover:underline">
          /privacy
        </a>
        .
      </p>
      <PrivacyPolicyForm content={policy?.content ?? ""} />
    </div>
  );
}
