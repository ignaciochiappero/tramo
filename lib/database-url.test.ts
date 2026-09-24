import { describe, expect, it } from "vitest";

import { databaseDriver } from "@/lib/database-url";

describe("databaseDriver", () => {
  it("uses Neon's serverless driver for Neon hosts, pooled or direct", () => {
    expect(databaseDriver("postgresql://u:p@ep-cool-sky-123-pooler.us-east-1.aws.neon.tech/db?sslmode=require")).toBe(
      "neon",
    );
    expect(databaseDriver("postgresql://u:p@ep-cool-sky-123.us-east-1.aws.neon.tech/db?sslmode=require")).toBe("neon");
  });

  it("uses node-postgres for anything else, like the local Postgres in Docker", () => {
    expect(databaseDriver("postgresql://tramo:tramo@localhost:5432/tramo")).toBe("pg");
    expect(databaseDriver("postgres://tramo:tramo@127.0.0.1:5432/tramo")).toBe("pg");
    expect(databaseDriver("postgresql://u:p@db.example.supabase.co:5432/postgres")).toBe("pg");
  });

  it("matches Neon by the end of the host name, not anywhere in it", () => {
    expect(databaseDriver("postgresql://u:p@neon.tech.example.com/db")).toBe("pg");
  });

  it("rejects what isn't a connection string", () => {
    expect(() => databaseDriver("not a url")).toThrow("DATABASE_URL");
  });
});
