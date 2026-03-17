import { prisma } from "../../src/config/database";
import bcrypt from "bcrypt";
import type { User, Task, List, UserSettings } from "@prisma/client";

/**
 * Test Factories
 * Helper functions to create test data
 */

let userCounter = 0;
let taskCounter = 0;
let listCounter = 0;

/**
 * Create a test user with hashed password
 */
export async function createTestUser(overrides?: Partial<User>): Promise<User> {
  userCounter++;
  const hashedPassword = await bcrypt.hash("password123", 10);

  return prisma.user.create({
    data: {
      firstName: `Test${userCounter}`,
      lastName: `User${userCounter}`,
      email: `test${userCounter}@example.com`,
      password: hashedPassword,
      emailVerified: false,
      ...overrides,
    },
  });
}

/**
 * Create a test task
 */
export async function createTestTask(
  userId: number,
  overrides?: Partial<Task>,
): Promise<Task> {
  taskCounter++;

  return prisma.task.create({
    data: {
      taskName: `Test Task ${taskCounter}`,
      description: `Description for task ${taskCounter}`,
      status: "TODO",
      priority: "MEDIUM",
      authorId: userId,
      ...overrides,
    },
  });
}

/**
 * Create a test list
 */
export async function createTestList(
  userId: number,
  overrides?: Partial<List>,
): Promise<List> {
  listCounter++;

  return prisma.list.create({
    data: {
      title: `Test List ${listCounter}`,
      description: `Description for list ${listCounter}`,
      color: "#FF5733",
      isFavorite: false,
      authorId: userId,
      ...overrides,
    },
  });
}

/**
 * Create test user settings
 */
export async function createTestSettings(
  userId: number,
  overrides?: Partial<UserSettings>,
): Promise<UserSettings> {
  return prisma.userSettings.create({
    data: {
      userId,
      theme: "LIGHT",
      dateFormat: "MM_DD_YYYY",
      language: "EN",
      defaultPriority: "MEDIUM",
      defaultStatus: "TODO",
      ...overrides,
    },
  });
}

/**
 * Reset counters (useful for specific test scenarios)
 */
export function resetCounters(): void {
  userCounter = 0;
  taskCounter = 0;
  listCounter = 0;
}
