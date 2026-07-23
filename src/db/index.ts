import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

// A single shared connection pool for the app.
// In dev, Next.js hot-reloads modules, so we cache the client on `global`
// to avoid opening a new pool on every reload.
const globalForDb = globalThis as unknown as {
  pgClient: postgres.Sql | undefined;
};

const client =
  globalForDb.pgClient ??
  postgres(process.env.DATABASE_URL, {
    // Each serverless function instance gets its own pool — on Vercel,
    // several instances can be running concurrently, each holding up to
    // `max` connections to Postgres. A large per-instance pool multiplies
    // fast and can exhaust Supabase's connection limit under real
    // traffic, at which point new connections just hang until the whole
    // request times out. Serverless functions are short-lived and rarely
    // need more than one or two connections open at once — the actual
    // pooling belongs to Supabase's own PgBouncer layer in front of
    // Postgres, not the app's client-side pool.
    max: 3,
    // Fail fast and with a clear error if a connection can't be acquired,
    // rather than hanging silently until Vercel's function timeout kills
    // the request with no useful message.
    connect_timeout: 10,
    idle_timeout: 20,
    // Supabase's pooled connection string (PgBouncer, transaction mode)
    // doesn't support prepared statements — this needs to be off for that
    // connection to work at all. Harmless either way if using the direct
    // connection instead, so safe to leave on regardless of which one
    // DATABASE_URL currently points to.
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
