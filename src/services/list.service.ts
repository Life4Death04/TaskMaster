import { prisma } from "../config/database.js";
import type { List } from "@prisma/client";
import { NotFoundError } from "../utils/errors.js";
import { calculateSkip, calculatePaginationMeta } from "../utils/pagination.js";
import type { PaginationMeta } from "../types/response.types.js";

// Service: encapsulates list business logic and data access with Prisma

/**
 * Create a new list
 */
export async function createList(input: {
  title: string;
  description?: string;
  color?: string;
  authorId: number;
}): Promise<List> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: input.authorId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const list = await prisma.list.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      color: input.color ?? "#000000",
      authorId: input.authorId,
    },
  });

  return list;
}

/**
 * Get all lists for a user with tasks included (non-paginated)
 * Use this when you need all lists at once
 */
export async function getListsByUserId(
  userId: number,
): Promise<(List & { tasks: any[] })[]> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const lists = await prisma.list.findMany({
    where: { authorId: userId },
    include: {
      tasks: true,
    },
    orderBy: { id: "desc" }, // Most recent first
  });

  return lists;
}

/**
 * Get lists for a user with pagination (tasks included)
 * Use this for endpoints that return large lists
 * 
 * @param userId - The ID of the user
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Object containing lists array (with tasks) and pagination metadata
 */
export async function getListsByUserIdPaginated(
  userId: number,
  page: number,
  limit: number,
): Promise<{
  lists: (List & { tasks: any[] })[];
  pagination: PaginationMeta;
}> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // 1. Count total lists for this user
  const total = await prisma.list.count({
    where: { authorId: userId },
  });

  // 2. Calculate skip value for pagination
  const skip = calculateSkip(page, limit);

  // 3. Fetch paginated lists with their tasks
  const lists = await prisma.list.findMany({
    where: { authorId: userId },
    include: {
      tasks: true, // Include all tasks for each list
    },
    orderBy: { id: "desc" }, // Most recent first
    skip, // Skip previous pages
    take: limit, // Take only 'limit' number of lists
  });

  // 4. Calculate pagination metadata
  const pagination = calculatePaginationMeta(total, page, limit);

  return { lists, pagination };
}

/**
 * Get a single list by ID with tasks
 */
export async function getSingleListById(
  listId: number,
  userId: number,
): Promise<List & { tasks: any[] }> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Find list and verify it belongs to user
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      authorId: userId,
    },
    include: {
      tasks: true,
    },
  });

  if (!list) {
    throw new NotFoundError("List not found or does not belong to user");
  }

  return list;
}

/**
 * Update a list by ID
 */
export async function updateListById(input: {
  id: number;
  userId: number;
  title?: string;
  description?: string;
  color?: string;
}): Promise<List> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Find list and verify it belongs to user
  const existingList = await prisma.list.findFirst({
    where: {
      id: input.id,
      authorId: input.userId,
    },
  });

  if (!existingList) {
    throw new NotFoundError("List not found or does not belong to user");
  }

  // Build update data dynamically
  const updateData: Partial<List> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.color !== undefined) updateData.color = input.color;

  const updatedList = await prisma.list.update({
    where: { id: input.id },
    data: updateData,
  });

  return updatedList;
}

/**
 * Delete a list by ID
 * Also deletes all associated tasks
 */
export async function deleteListById(
  listId: number,
  userId: number,
): Promise<void> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Find list and verify it belongs to user
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      authorId: userId,
    },
  });

  if (!list) {
    throw new NotFoundError("List not found or does not belong to user");
  }

  // Delete all tasks in the list first
  await prisma.task.deleteMany({
    where: { listId: listId },
  });

  // Delete the list
  await prisma.list.delete({
    where: { id: listId },
  });
}

/**
 * Toggle favorite status of a list
 */
export async function toggleListFavorite(
  listId: number,
  userId: number,
): Promise<List> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Find list and verify it belongs to user
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      authorId: userId,
    },
  });

  if (!list) {
    throw new NotFoundError("List not found or does not belong to user");
  }

  // Toggle the favorite status
  const updatedList = await prisma.list.update({
    where: { id: listId },
    data: {
      isFavorite: !list.isFavorite,
    },
  });

  return updatedList;
}
