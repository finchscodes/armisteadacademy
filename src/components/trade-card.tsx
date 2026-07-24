"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { respondToTradeAction, approveTradeAction, rejectTradeAction } from "@/actions/trades";
import { useToast } from "@/components/toast-provider";
import type { ArsenalRow } from "@/lib/shops";

type Trade = {
  id: number;
  status: "awaiting_offer" | "awaiting_approval" | "accepted" | "rejected";
  initiatorCharacterId: number;
  recipientCharacterId: number;
  initiatorCharacter: { id: number; name: string; slug: string } | null;
  recipientCharacter: { id: number; name: string; slug: string } | null;
  initiatorItem: { id: number; name: string; imageUrl: string | null } | null;
  recipientItem: { id: number; name: string; imageUrl: string | null } | null;
};

export function TradeCard({
  trade,
  myCharacterId,
  myArsenal,
}: {
  trade: Trade;
  myCharacterId: number;
  myArsenal: ArsenalRow[];
}) {
  const router = useRouter();
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [pickingOffer, setPickingOffer] = useState(false);
  const [chosenItemId, setChosenItemId] = useState<number | null>(null);

  const isInitiator = trade.initiatorCharacterId === myCharacterId;
  const otherCharacter = isInitiator ? trade.recipientCharacter : trade.initiatorCharacter;

  function handleRespond() {
    if (!chosenItemId) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("tradeId", String(trade.id));
      formData.set("itemId", String(chosenItemId));
      const result = await respondToTradeAction(undefined, formData);
      if (result?.error) showToast(result.error, "error");
      else if (result?.success) showToast(result.success, "success");
      setPickingOffer(false);
      router.refresh();
    });
  }

  function handleApprove() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("tradeId", String(trade.id));
      const result = await approveTradeAction(formData);
      if (result?.error) showToast(result.error, "error");
      else if (result?.success) showToast(result.success, "success");
      router.refresh();
    });
  }

  function handleReject() {
    if (!confirm("Reject this trade? Items will be returned.")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("tradeId", String(trade.id));
      const result = await rejectTradeAction(formData);
      if (result?.error) showToast(result.error, "error");
      else if (result?.success) showToast(result.success, "success");
      router.refresh();
    });
  }

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
        <p className="text-sm">
          {isInitiator ? "You" : otherCharacter?.name} offered{" "}
          <span className="text-parchment-100">{trade.initiatorItem?.name ?? "an item"}</span>
          {" to "}
          {isInitiator ? (
            otherCharacter ? (
              <Link href={`/c/${otherCharacter.slug}`} className="text-gunmetal-400 hover:underline">
                {otherCharacter.name}
              </Link>
            ) : (
              "someone"
            )
          ) : (
            "you"
          )}
        </p>
      </div>

      {trade.recipientItem && (
        <p className="text-sm text-ink-300 mb-2">
          Countered with <span className="text-parchment-100">{trade.recipientItem.name}</span>
        </p>
      )}

      {trade.status === "awaiting_offer" && !isInitiator && !pickingOffer && (
        <button
          type="button"
          onClick={() => setPickingOffer(true)}
          className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors"
        >
          Counter with an item
        </button>
      )}

      {pickingOffer && (
        <div className="space-y-2 mt-2">
          <select
            value={chosenItemId ?? ""}
            onChange={(e) => setChosenItemId(Number(e.target.value) || null)}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          >
            <option value="">Pick an item...</option>
            {myArsenal.map((row) => (
              <option key={row.id} value={row.itemId}>
                {row.itemName}
                {row.quantity > 1 ? ` ×${row.quantity}` : ""}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRespond}
              disabled={pending || !chosenItemId}
              className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
            >
              Send counter-offer
            </button>
            <button
              type="button"
              onClick={() => setPickingOffer(false)}
              className="text-xs text-ink-400 hover:text-parchment-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {trade.status === "awaiting_offer" && isInitiator && (
        <p className="text-xs text-ink-400 italic">Waiting on {otherCharacter?.name ?? "them"} to counter-offer.</p>
      )}

      {trade.status === "awaiting_approval" && isInitiator && (
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={pending}
            className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={pending}
            className="text-xs text-claret-500 hover:text-claret-400 disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      )}

      {trade.status === "awaiting_approval" && !isInitiator && (
        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-ink-400 italic">Waiting on their approval.</p>
          <button
            type="button"
            onClick={handleReject}
            disabled={pending}
            className="text-xs text-claret-500 hover:text-claret-400 disabled:opacity-60"
          >
            Cancel trade
          </button>
        </div>
      )}

      {trade.status === "awaiting_offer" && !isInitiator && !pickingOffer && (
        <button
          type="button"
          onClick={handleReject}
          disabled={pending}
          className="text-xs text-claret-500 hover:text-claret-400 disabled:opacity-60 mt-2 ml-2"
        >
          Decline
        </button>
      )}
    </div>
  );
}
