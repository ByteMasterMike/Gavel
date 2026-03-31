import { PrismaClient } from "@prisma/client";

/** Avoid indefinite TCP hangs on serverless when DB is unreachable. */
function datasourceUrlWithConnectTimeout(url: string | undefined): string | undefined {
  if (!url?.trim()) return url;
  const trimmed = url.trim();
  if (/[?&]connect_timeout=/i.test(trimmed)) return trimmed;
  const sep = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${sep}connect_timeout=10`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const databaseUrl = process.env.DATABASE_URL;
const prismaOptions = {
  log:
    process.env.NODE_ENV === "development"
      ? (["error", "warn"] as ("error" | "warn")[])
      : (["error"] as "error"[]),
  ...(databaseUrl
    ? { datasourceUrl: datasourceUrlWithConnectTimeout(databaseUrl) }
    : {}),
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
