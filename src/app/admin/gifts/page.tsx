import { getAutomaticGiftRules, getAllItemsForAdmin } from "@/actions/admin";
import { GiftRuleForm } from "@/components/gift-rule-form";
import { GiftRuleList } from "@/components/gift-rule-list";

export const dynamic = "force-dynamic";

export default async function AdminGiftsPage() {
  const [rules, allItems] = await Promise.all([getAutomaticGiftRules(), getAllItemsForAdmin()]);

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-lg text-parchment-100 mb-1">Automatic Gifts</h2>
      <p className="text-sm text-ink-400 mb-4">
        Configure items sent automatically when something happens — for example, a birthday gift
        from the Spymaster whenever a character ages up. More trigger types can be added here
        later as they come up.
      </p>
      <GiftRuleForm items={allItems} />
      <GiftRuleList rules={rules} />
    </div>
  );
}
