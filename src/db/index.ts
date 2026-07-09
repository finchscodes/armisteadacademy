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
  postgres(process.env.DATABASE_URL, { max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
