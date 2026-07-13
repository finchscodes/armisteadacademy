import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getCharacterBalance } from "@/lib/economy";
import { getBankBalance, applyPendingInterest } from "@/lib/bank";
import { CoinIcon } from "@/components/nav-icons";
import { BankActions } from "@/components/bank-actions";

export async function BankBoardView({ boardName }: { boardName: string }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.activeCharacter) redirect("/characters");

  await applyPendingInterest(current.activeCharacter.id);

  const [wallet, bank] = await Promise.all([
    getCharacterBalance(current.activeCharacter.id),
    getBankBalance(current.activeCharacter.id),
  ]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-brass-500/20 text-brass-400 border border-brass-500/40 rounded px-2 py-0.5">
          <CoinIcon className="w-3 h-3" />
          Currency
        </span>
      </div>
      <h1 className="font-display text-3xl text-brass-400 mb-1">{boardName}</h1>
      <p className="text-ink-400 text-sm mb-6">
        Money in the bank earns 2% interest per day — deposit what you&apos;re not spending.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-ink-900 border border-ink-700 rounded-lg p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">On hand</p>
          <p className="font-display text-2xl text-parchment-100">{wallet}</p>
        </div>
        <div className="bg-ink-900 border border-ink-700 rounded-lg p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">In the bank</p>
          <p className="font-display text-2xl text-brass-400">{bank}</p>
        </div>
      </div>

      <BankActions walletBalance={wallet} bankBalance={bank} />
    </div>
  );
}
