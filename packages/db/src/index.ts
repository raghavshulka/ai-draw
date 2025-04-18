import { PrismaClient } from "../generated/client/index.js";

// Use recommended pattern for avoiding multiple instances
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "../generated/client/index.js";