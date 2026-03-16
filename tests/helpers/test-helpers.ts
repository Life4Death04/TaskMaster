import { User } from "@prisma/client";
import { prisma } from "../../src/config/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env.js";

let userCounter = 0;

/**
 * Factory function to create a test user in the database
 */
export async function createTestUser(overrides?: Partial<User>): Promise<User> {
  userCounter++;
  const hashedPassword = await bcrypt.hash("password123", 10);

  return prisma.user.create({
    data: {
      email: overrides?.email || `testuser${userCounter}@example.com`,
      password: hashedPassword,
      firstName: overrides?.firstName || `TestFirstName${userCounter}`,
      lastName: overrides?.lastName || `TestLastName${userCounter}`,
      profileImage: overrides?.profileImage || null,
      ...overrides,
    },
  });
}

/**
 * Generate a JWT auth token for testing
 */
export function generateAuthToken(userId: number, email: string): string {
  return jwt.sign({ sub: userId, email }, env.JWT_SECRET, { expiresIn: "7d" });
}
