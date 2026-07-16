import { getBannedIpsForAdmin } from "@/actions/admin";
import { UnbanIpButton } from "@/components/unban-ip-button";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminBannedIpsPage() {
  const bannedIps = await getBannedIpsForAdmin();

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl text-parchment-100 mb-1">Banned IPs</h1>
      <p className="text-sm text-ink-400 mb-6">
        Blocked outright at login/registration. Ban an IP from a specific user&apos;s page in Users.
      </p>

      {bannedIps.length === 0 ? (
        <p className="text-sm text-ink-400 italic">No IPs banned.</p>
      ) : (
        <div className="space-y-2">
          {bannedIps.map((b) => (
            <div
              key={b.id}
              className="bg-ink-900 border border-ink-700 rounded-lg p-4 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm text-parchment-100">{b.ipAddress}</p>
                {b.reason && <p className="text-xs text-ink-400 mt-0.5">{b.reason}</p>}
                <p className="text-[11px] text-ink-500 mt-1">
                  Banned {b.createdAt.toLocaleDateString()}
                  {b.bannedByEmail && ` by ${b.bannedByEmail}`}
                </p>
              </div>
              <UnbanIpButton id={b.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
