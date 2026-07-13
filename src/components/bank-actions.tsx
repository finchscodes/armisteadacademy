"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { depositAction, withdrawAction } from "@/actions/bank";

export function BankActions({
  walletBalance,
  bankBalance,
}: {
  walletBalance: number;
  bankBalance: number;
}) {
  const router = useRouter();
  const [depositState, depositFormAction, depositPending] = useActionState(depositAction, undefined);
  const [withdrawState, withdrawFormAction, withdrawPending] = useActionState(withdrawAction, undefined);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  function depositAll() {
    const formData = new FormData();
    formData.set("all", "true");
    depositFormAction(formData);
    router.refresh();
  }

  function withdrawAll() {
    const formData = new FormData();
    formData.set("all", "true");
    withdrawFormAction(formData);
    router.refresh();
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="bg-ink-900 border border-ink-700 rounded-lg p-4">
        <p className="text-sm font-medium mb-3">Deposit</p>
        <form
          action={(fd) => {
            depositFormAction(fd);
            router.refresh();
          }}
          className="flex items-center gap-2 mb-2"
        >
          <input
            type="number"
            name="amount"
            min={1}
            max={walletBalance}
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount"
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
          />
          <button
            type="submit"
            disabled={depositPending || walletBalance <= 0}
            className="shrink-0 text-xs bg-brass-500 text-ink-950 px-3 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
          >
            Deposit
          </button>
        </form>
        <button
          type="button"
          onClick={depositAll}
          disabled={depositPending || walletBalance <= 0}
          className="text-xs text-brass-400 hover:underline disabled:opacity-50 disabled:no-underline"
        >
          Deposit all ({walletBalance})
        </button>
        {depositState?.error && <p className="text-xs text-claret-500 mt-2">{depositState.error}</p>}
      </div>

      <div className="bg-ink-900 border border-ink-700 rounded-lg p-4">
        <p className="text-sm font-medium mb-3">Withdraw</p>
        <form
          action={(fd) => {
            withdrawFormAction(fd);
            router.refresh();
          }}
          className="flex items-center gap-2 mb-2"
        >
          <input
            type="number"
            name="amount"
            min={1}
            max={bankBalance}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Amount"
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
          />
          <button
            type="submit"
            disabled={withdrawPending || bankBalance <= 0}
            className="shrink-0 text-xs bg-brass-500 text-ink-950 px-3 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
          >
            Withdraw
          </button>
        </form>
        <button
          type="button"
          onClick={withdrawAll}
          disabled={withdrawPending || bankBalance <= 0}
          className="text-xs text-brass-400 hover:underline disabled:opacity-50 disabled:no-underline"
        >
          Withdraw all ({bankBalance})
        </button>
        {withdrawState?.error && <p className="text-xs text-claret-500 mt-2">{withdrawState.error}</p>}
      </div>
    </div>
  );
}
