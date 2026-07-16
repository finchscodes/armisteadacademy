import { headers } from "next/headers";

/**
 * Best-effort client IP from request headers. Vercel sets x-forwarded-for
 * correctly; this falls back gracefully for local dev where it's usually
 * absent. Only ever used for the banning feature — not a security-critical
 * value, just something for the ban list to key on.
 */
export async function getRequestIp(): Promise<string | null> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) {
    // Can be a comma-separated chain (client, proxy1, proxy2, ...) — the
    // first entry is the original client.
    return forwardedFor.split(",")[0]?.trim() || null;
  }
  return h.get("x-real-ip") || null;
}
