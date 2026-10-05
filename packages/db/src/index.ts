import { PrismaClient } from "../generated/client/index.js";

// Use recommended pattern for avoiding multiple instances
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Tolerate a DATABASE_URL pasted with surrounding quotes or whitespace (common in hosting dashboards).
const rawUrl = process.env.DATABASE_URL ?? "";
const cleanUrl = rawUrl.trim().replace(/^['"]+|['"]+$/g, "");
if (cleanUrl !== rawUrl) process.env.DATABASE_URL = cleanUrl;

/** Non-secret summary of the database configuration, for health checks. */
export function databaseConfigSummary() {
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try { host = new URL(url).host; } catch { host = ""; }
  return { configured: url.length > 0, validProtocol: /^postgres(ql)?:\/\//.test(url), host };
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "../generated/client/index.js";