"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminToggleGiftRuleAction, adminDeleteGiftRuleAction } from "@/actions/admin";

type Rule = {
  id: number;
  trigger: string;
  itemId: number;
  itemName: string;
  quantity: number;
  senderLabel: string;
  message: string | null;
  isActive: boolean;
};

const TRIGGER_LABELS: Record<string, string> = {
  birthday: "Birthday (character ages up)",
};

export function GiftRuleList({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleToggle(ruleId: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("ruleId", String(ruleId));
      await adminToggleGiftRuleAction(formData);
      router.refresh();
    });
  }

  function handleDelete(ruleId: number) {
    if (!confirm("Delete this gift rule?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("ruleId", String(ruleId));
      await adminDeleteGiftRuleAction(formData);
      router.refresh();
    });
  }

  if (rules.length === 0) {
    return <p className="text-sm text-ink-400 italic">No automatic gift rules yet.</p>;
  }

  return (
    <div className="space-y-2">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className={`bg-ink-900 border rounded-lg p-4 ${rule.isActive ? "border-ink-700" : "border-ink-800 opacity-50"}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gunmetal-400 mb-1">
                {TRIGGER_LABELS[rule.trigger] ?? rule.trigger}
              </p>
              <p className="text-sm text-parchment-100">
                {rule.quantity > 1 ? `${rule.quantity}x ` : ""}
                {rule.itemName} — from &quot;{rule.senderLabel}&quot;
              </p>
              {rule.message && <p className="text-xs text-ink-400 mt-1">&quot;{rule.message}&quot;</p>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleToggle(rule.id)}
                disabled={pending}
                className="text-[11px] text-gunmetal-400 hover:text-gunmetal-300 disabled:opacity-60"
              >
                {rule.isActive ? "Disable" : "Enable"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(rule.id)}
                disabled={pending}
                className="text-[11px] text-claret-500 hover:text-claret-400 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
