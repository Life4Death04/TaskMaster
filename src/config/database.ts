/**
 * Prisma Client Singleton
 * Creates a single instance of Prisma Client to be shared across the application
 * This prevents multiple instances and connection pool exhaustion
 */

import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

/**
 * PrismaClient is attached to the `global` object in development
 * to prevent exhausting your database connection limit.
 *
 * Learn more:
 * https://pris.ly/d/help/next-js-best-practices
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize Prisma Client with connection configuration
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// In development, save the Prisma instance to prevent hot-reload issues
if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Ensures database connections are closed properly before server stops
 *
 * Purpose: Reusable wrapper function to close Prisma connection
 * Called by all shutdown event handlers below
 */
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};

/**
 * Event: beforeExit
 * Triggers: When Node.js event loop is empty and about to exit naturally
 * Example: Server finishes all work and exits normally
 */
process.on("beforeExit", async () => {
  await disconnectDatabase();
});

/**
 * Event: SIGINT
 * Triggers: When you press Ctrl+C in the terminal
 * Does: Disconnect database → Exit with code 0 (success)
 */
process.on("SIGINT", async () => {
  await disconnectDatabase();
  process.exit(0);
});

/**
 * Event: SIGTERM
 * Triggers: When Docker/Kubernetes/hosting platform stops your server
 * Does: Disconnect database → Exit with code 0 (success)
 */
process.on("SIGTERM", async () => {
  await disconnectDatabase();
  process.exit(0);
});
