import { Prisma, PrismaClient } from "@prisma/client";
import { env } from "./env";

const logLevels: Prisma.LogLevel[] = env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

export const prisma = new PrismaClient({
  log: logLevels,
});

process.on("beforeExit", () => {
  void prisma.$disconnect();
});
