import { beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "../src/config/database";

/**
 * Global Test Setup
 * Runs before all tests
 */
beforeAll(async () => {
  // Ensure we're using a test database
  if (!process.env.DATABASE_URL?.includes("test")) {
    console.warn(
      "⚠️  WARNING: DATABASE_URL doesn't contain 'test'. Using test database.",
    );
  }
});

/**
 * Clean database before each test
 * Ensures test isolation
 */
beforeEach(async () => {
  // Delete all records in reverse order of dependencies
  await prisma.task.deleteMany({});
  await prisma.list.deleteMany({});
  await prisma.userSettings.deleteMany({});
  await prisma.user.deleteMany({});
});

/**
 * Global Test Teardown
 * Runs after all tests
 */
afterAll(async () => {
  await prisma.$disconnect();
});
