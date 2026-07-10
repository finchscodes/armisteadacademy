import { getGuideSections } from "@/actions/guide";
import { GuideAccordion } from "@/components/guide-accordion";

// Admin edits this content and expects it to show up immediately — must
// render per-request, never prerendered at build time.
export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const sections = await getGuideSections();
  return <GuideAccordion sections={sections} />;
}
