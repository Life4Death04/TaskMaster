import { prisma } from "../config/database.js";
import type { UserSettings } from "@prisma/client";
import { NotFoundError } from "../utils/errors.js";

// Service: encapsulates settings business logic and data access with Prisma

/**
 * Get user settings by userId
 * Creates default settings if they don't exist
 */
export async function getUserSettings(userId: number): Promise<UserSettings> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Try to find existing settings
  let settings = await prisma.userSettings.findUnique({
    where: { userId: userId },
  });

  // If settings don't exist, create default ones
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId: userId,
        theme: "LIGHT",
        dateFormat: "MM_DD_YYYY",
        language: "EN",
        defaultPriority: "MEDIUM",
        defaultStatus: "TODO",
      },
    });
  }

  return settings;
}

/**
 * Update user settings
 */
export async function updateUserSettings(input: {
  userId: number;
  theme?: "LIGHT" | "DARK";
  dateFormat?: "MM_DD_YYYY" | "DD_MM_YYYY" | "YYYY_MM_DD";
  language?: "EN" | "ES";
  defaultPriority?: "LOW" | "MEDIUM" | "HIGH";
  defaultStatus?: "TODO" | "IN_PROGRESS" | "DONE";
}): Promise<UserSettings> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Check if settings exist
  const existingSettings = await prisma.userSettings.findUnique({
    where: { userId: input.userId },
  });

  // If settings don't exist, create them with provided values
  if (!existingSettings) {
    return await prisma.userSettings.create({
      data: {
        userId: input.userId,
        theme: input.theme ?? "LIGHT",
        dateFormat: input.dateFormat ?? "MM_DD_YYYY",
        language: input.language ?? "EN",
        defaultPriority: input.defaultPriority ?? "MEDIUM",
        defaultStatus: input.defaultStatus ?? "TODO",
      },
    });
  }

  // Build update data dynamically (only include provided fields)
  const updateData: Partial<UserSettings> = {};
  if (input.theme !== undefined) updateData.theme = input.theme;
  if (input.dateFormat !== undefined) updateData.dateFormat = input.dateFormat;
  if (input.language !== undefined) updateData.language = input.language;
  if (input.defaultPriority !== undefined)
    updateData.defaultPriority = input.defaultPriority;
  if (input.defaultStatus !== undefined)
    updateData.defaultStatus = input.defaultStatus;

  const updatedSettings = await prisma.userSettings.update({
    where: { userId: input.userId },
    data: updateData,
  });

  return updatedSettings;
}
