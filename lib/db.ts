import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { databaseDriver } from "@/lib/database-url";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. See docs/setup.md, step 5.");
}

// Prisma 7 requires a driver adapter. On Neon, its serverless driver over the
// pooled connection (the host ends in -pooler); anywhere else, such as the
// local Postgres in compose.yaml, node-postgres.
const adapter =
  databaseDriver(connectionString) === "neon"
    ? new PrismaNeon({ connectionString })
    : new PrismaPg({ connectionString });

// Reuse the client across hot reloads in development; otherwise every reload
// opens a new pool and exhausts the database's connection limit.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
