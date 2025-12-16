import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import type { Prisma, User } from "@prisma/client";

// Service: encapsulates business logic and data access with Prisma
// Controllers call these functions; services should be unit-testable and side-effect aware

const SALT_ROUNDS = 10;

export async function createUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
}): Promise<User> {
  const hash = await bcrypt.hash(input.password, SALT_ROUNDS);
  return prisma.user.create({
    data: {
      email: input.email,
      password: hash,
      firstName: input.firstName,
      lastName: input.lastName,
      profileImage: input.profileImage ?? null,
    },
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: number): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function updateUserById(
  id: number,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
    phoneNumber?: string;
    password?: string;
  }
): Promise<User> {
  // Build update data object dynamically
  const updateData: Prisma.UserUpdateInput = {}; // Initialize empty update data. It creates an empty object (using the Prisma.UserUpdateInput type) to hold the fields that will be updated in the user record.
  if (data.firstName !== undefined) updateData.firstName = data.firstName; // Check if firstName is provided in data; if so, add it to updateData
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.profileImage !== undefined)
    updateData.profileImage = data.profileImage;
  if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
  if (data.password !== undefined)
    updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);

  const updated = await prisma.user.update({ where: { id }, data: updateData });
  return updated;
}

export async function deleteUserById(id: number): Promise<void> {
  await prisma.user.delete({ where: { id } });
}

export async function verifyPassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export function signToken(payload: {
  sub: number | string;
  email?: string;
}): string {
  const tokenPayload = {
    sub: String(payload.sub),
    ...(payload.email ? { email: payload.email } : {}),
  };
  return jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: "7d" });
}

// Convert User to SafeUser by omitting sensitive fields. Used in API responses.
export function toSafeUser(
  user: User
): Pick<
  User,
  "id" | "email" | "firstName" | "lastName" | "profileImage" | "createdAt"
> {
  // Never expose password or sensitive fields
  const { id, email, firstName, lastName, profileImage, createdAt } = user;
  return { id, email, firstName, lastName, profileImage, createdAt };
}
