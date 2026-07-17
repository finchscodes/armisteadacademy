"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  adminBanAccountAction,
  adminUnbanAccountAction,
  adminBanIpAction,
} from "@/actions/admin";

export function BanControls({
  userId,
  isBanned,
  banReason,
  lastIpAddress,
}: {
  userId: number;
  isBanned: boolean;
  banReason: string | null;
  lastIpAddress: string | null;
}) {
  const router = useRouter();
  const [showBanForm, setShowBanForm] = useState(false);
  const [showIpBanForm, setShowIpBanForm] = useState(false);
  const [banState, banFormAction, banPending] = useActionState(adminBanAccountAction, undefined);
  const [ipBanState, ipBanFormAction, ipBanPending] = useActionState(adminBanIpAction, undefined);

  async function handleUnban() {
    if (!confirm("Unban this account?")) return;
    const formData = new FormData();
    formData.set("userId", String(userId));
    await adminUnbanAccountAction(formData);
    router.refresh();
  }

  return (
    <div className="mt-6 bg-ink-900 border border-ink-700 rounded-lg p-4 space-y-4">
      <p className="text-[10px] uppercase tracking-wider text-ink-400">Banning</p>

      {isBanned ? (
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-claret-500 font-medium">This account is banned</p>
            {banReason && <p className="text-xs text-ink-400 mt-0.5">Reason: {banReason}</p>}
          </div>
          <button
            type="button"
            onClick={handleUnban}
            className="shrink-0 text-xs bg-ink-800 border border-ink-600 text-parchment-100 px-3 py-1.5 rounded-md hover:border-gunmetal-500/50 transition-colors"
          >
            Unban
          </button>
        </div>
      ) : showBanForm ? (
        <form
          action={async (fd) => {
            await banFormAction(fd);
            router.refresh();
          }}
          className="space-y-2"
        >
          <input type="hidden" name="userId" value={userId} />
          <label className="block text-xs font-medium mb-1" htmlFor="reason">
            Reason (optional, shown to the person if they try to log in)
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={2}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          />
          {banState?.error && <p className="text-xs text-claret-500">{banState.error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={banPending}
              className="text-xs bg-claret-600 text-parchment-100 px-3 py-1.5 rounded-md font-medium hover:bg-claret-500 transition-colors disabled:opacity-60"
            >
              {banPending ? "Banning..." : "Confirm ban"}
            </button>
            <button
              type="button"
              onClick={() => setShowBanForm(false)}
              className="text-xs text-ink-400 hover:text-parchment-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowBanForm(true)}
          className="text-xs bg-ink-800 border border-claret-600/50 text-claret-500 px-3 py-1.5 rounded-md hover:bg-claret-600/10 transition-colors"
        >
          Ban this account
        </button>
      )}

      <div className="border-t border-ink-800 pt-4">
        <p className="text-xs text-ink-400 mb-2">
          Last known IP:{" "}
          {lastIpAddress ? (
            <span className="text-parchment-100 font-mono">{lastIpAddress}</span>
          ) : (
            "unknown"
          )}
        </p>
        {showIpBanForm ? (
          <form
            action={async (fd) => {
              await ipBanFormAction(fd);
              router.refresh();
              setShowIpBanForm(false);
            }}
            className="space-y-2"
          >
            <input type="hidden" name="userId" value={userId} />
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="ipAddress">
                IP address
              </label>
              <input
                id="ipAddress"
                name="ipAddress"
                defaultValue={lastIpAddress ?? ""}
                required
                className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gunmetal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="ipReason">
                Reason (optional)
              </label>
              <input
                id="ipReason"
                name="reason"
                className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
              />
            </div>
            {ipBanState?.error && <p className="text-xs text-claret-500">{ipBanState.error}</p>}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={ipBanPending}
                className="text-xs bg-claret-600 text-parchment-100 px-3 py-1.5 rounded-md font-medium hover:bg-claret-500 transition-colors disabled:opacity-60"
              >
                {ipBanPending ? "Banning..." : "Ban this IP"}
              </button>
              <button
                type="button"
                onClick={() => setShowIpBanForm(false)}
                className="text-xs text-ink-400 hover:text-parchment-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowIpBanForm(true)}
            disabled={!lastIpAddress}
            className="text-xs bg-ink-800 border border-claret-600/50 text-claret-500 px-3 py-1.5 rounded-md hover:bg-claret-600/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Ban this IP
          </button>
        )}
      </div>
    </div>
  );
}
