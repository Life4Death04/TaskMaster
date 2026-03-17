import { prisma } from "../config/database.js";
import type { Task, Prisma } from "@prisma/client";
import { NotFoundError } from "../utils/errors.js";
import { calculateSkip, calculatePaginationMeta } from "../utils/pagination.js";
import type { PaginationMeta } from "../types/response.types.js";

// Service: encapsulates task business logic and data access with Prisma
// Controllers call these functions; services should be unit-testable

/**
 * Fetch all tasks for a specific user (non-paginated)
 * Use this when you need all tasks at once
 */
export async function fetchUserTasks(userId: number): Promise<Task[]> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const tasks = await prisma.task.findMany({
    where: { authorId: userId },
    orderBy: { id: "desc" }, // Most recent first
  });

  return tasks;
}

/**
 * Fetch tasks for a specific user with pagination
 * Use this for endpoints that return large lists of tasks
 * 
 * @param userId - The ID of the user
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Object containing tasks array and pagination metadata
 */
export async function fetchUserTasksPaginated(
  userId: number,
  page: number,
  limit: number,
): Promise<{ tasks: Task[]; pagination: PaginationMeta }> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // 1. Count total tasks for this user (needed for pagination metadata)
  const total = await prisma.task.count({
    where: { authorId: userId },
  });

  // 2. Calculate how many items to skip based on page number
  // Example: page 2, limit 10 → skip first 10 items
  const skip = calculateSkip(page, limit);

  // 3. Fetch the paginated tasks
  const tasks = await prisma.task.findMany({
    where: { authorId: userId },
    orderBy: { id: "desc" }, // Most recent first
    skip, // Skip items from previous pages
    take: limit, // Take only 'limit' number of items
  });

  // 4. Calculate pagination metadata
  const pagination = calculatePaginationMeta(total, page, limit);

  return { tasks, pagination };
}

/**
 * Create a new task
 */
export async function createTask(input: {
  taskName: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate?: Date | string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  authorId: number;
  listId?: number;
}): Promise<Task> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: input.authorId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // If listId is provided, verify it exists and belongs to the user
  if (input.listId) {
    const list = await prisma.list.findFirst({
      where: {
        id: input.listId,
        authorId: input.authorId,
      },
    });

    if (!list) {
      throw new NotFoundError("List not found or does not belong to user");
    }
  }

  const task = await prisma.task.create({
    data: {
      taskName: input.taskName,
      description: input.description ?? null,
      status: input.status ?? "TODO",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      priority: input.priority ?? "LOW",
      authorId: input.authorId,
      listId: input.listId ?? null,
    },
  });

  return task;
}

/**
 * Update an existing task
 */
export async function updateTask(input: {
  id: number;
  authorId: number;
  taskName?: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate?: Date | string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  listId?: number;
}): Promise<Task> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: input.authorId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Verify task exists and belongs to user
  const existingTask = await prisma.task.findFirst({
    where: {
      id: input.id,
      authorId: input.authorId,
    },
  });

  if (!existingTask) {
    throw new NotFoundError("Task not found or does not belong to user");
  }

  // If listId is being updated and provided, verify it exists and belongs to the user
  if (input.listId !== undefined && input.listId !== null) {
    const list = await prisma.list.findFirst({
      where: {
        id: input.listId,
        authorId: input.authorId,
      },
    });

    if (!list) {
      throw new NotFoundError("List not found or does not belong to user");
    }
  }

  // Build update data dynamically
  const updateData: Prisma.TaskUpdateInput = {};
  if (input.taskName !== undefined) updateData.taskName = input.taskName;
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.dueDate !== undefined)
    updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.listId !== undefined) {
    updateData.list = input.listId
      ? { connect: { id: input.listId } }
      : { disconnect: true };
  }

  const updatedTask = await prisma.task.update({
    where: { id: input.id },
    data: updateData,
  });

  return updatedTask;
}

/**
 * Delete a task by ID
 */
export async function deleteTaskById(
  authorId: number,
  taskId: number,
): Promise<void> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: authorId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Verify task exists and belongs to user before deleting
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      authorId: authorId,
    },
  });

  if (!task) {
    throw new NotFoundError("Task not found or does not belong to user");
  }

  await prisma.task.delete({
    where: { id: taskId },
  });
}

/**
 * Toggle task status (TODO <-> DONE)
 */
export async function toggleTaskStatus(
  authorId: number,
  taskId: number,
): Promise<Task> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: authorId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Find task and verify it belongs to user
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      authorId: authorId,
    },
  });

  if (!task) {
    throw new NotFoundError("Task not found or does not belong to user");
  }

  // Toggle between TODO and DONE; any other status will be set to DONE
  const newStatus = task.status === "DONE" ? "TODO" : "DONE";

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });

  return updatedTask;
}

/**
 * Get a specific task by ID
 */
export async function getTaskById(
  authorId: number,
  taskId: number,
): Promise<Task | null> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: authorId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      authorId: authorId,
    },
  });

  return task;
}
