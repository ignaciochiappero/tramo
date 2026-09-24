/**
 * Which driver talks to the database behind a connection string.
 *
 * Neon's serverless driver reaches Neon through its WebSocket proxy, so it
 * only works with Neon hosts. Anything else (the local Postgres in
 * compose.yaml, another provider) goes through node-postgres over plain TCP.
 */
export type DatabaseDriver = "neon" | "pg";

export function databaseDriver(connectionString: string): DatabaseDriver {
  let host: string;
  try {
    host = new URL(connectionString).hostname;
  } catch {
    throw new Error("DATABASE_URL is not a valid Postgres connection string.");
  }
  return host === "neon.tech" || host.endsWith(".neon.tech") ? "neon" : "pg";
}
