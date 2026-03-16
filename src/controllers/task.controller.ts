import type { Request, Response, NextFunction } from "express";
import * as TaskService from "../services/task.service.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "../schemas/task.schema.js";

// Controller: handles HTTP layer for tasks, delegates business logic to service

/**
 * Fetch all tasks for authenticated user
 * GET /api/tasks
 */
export async function fetchTasks(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get userId from authenticated request
    const userIdRaw = req.user?.sub ?? req.user?.id;
    const userId =
      typeof userIdRaw === "string" ? Number(userIdRaw) : userIdRaw;

    if (!userId || Number.isNaN(userId)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const tasks = await TaskService.fetchUserTasks(userId);

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new task
 * POST /api/tasks
 */
export async function createTask(
  req: Request<{}, {}, CreateTaskInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get userId from authenticated request
    const userIdRaw = req.user?.sub ?? req.user?.id;
    const userId =
      typeof userIdRaw === "string" ? Number(userIdRaw) : userIdRaw;

    if (!userId || Number.isNaN(userId)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Ensure authorId matches authenticated user
    const taskData = { ...req.body, authorId: userId };

    const task = await TaskService.createTask(taskData);

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an existing task
 * PATCH /api/tasks
 */
export async function updateTask(
  req: Request<{}, {}, UpdateTaskInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get userId from authenticated request
    const userIdRaw = req.user?.sub ?? req.user?.id;
    const userId =
      typeof userIdRaw === "string" ? Number(userIdRaw) : userIdRaw;

    if (!userId || Number.isNaN(userId)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Ensure authorId matches authenticated user
    const taskData = { ...req.body, authorId: userId };

    const task = await TaskService.updateTask(taskData);

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a task by ID
 * DELETE /api/tasks/:taskId
 */
export async function deleteTask(
  req: Request<{ taskId: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get userId from authenticated request
    const userIdRaw = req.user?.sub ?? req.user?.id;
    const userId =
      typeof userIdRaw === "string" ? Number(userIdRaw) : userIdRaw;

    if (!userId || Number.isNaN(userId)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const taskId = Number(req.params.taskId);
    if (Number.isNaN(taskId)) {
      res.status(400).json({ message: "Invalid task ID" });
      return;
    }

    await TaskService.deleteTaskById(userId, taskId);

    res.status(200).json({
      success: true,
      message: `Task deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Toggle task archived status
 * PATCH /api/tasks/:taskId/toggle-archived
 */
export async function toggleArchived(
  req: Request<{ taskId: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get userId from authenticated request
    const userIdRaw = req.user?.sub ?? req.user?.id;
    const userId =
      typeof userIdRaw === "string" ? Number(userIdRaw) : userIdRaw;

    if (!userId || Number.isNaN(userId)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const taskId = Number(req.params.taskId);
    if (Number.isNaN(taskId)) {
      res.status(400).json({ message: "Invalid task ID" });
      return;
    }

    const task = await TaskService.toggleTaskArchived(userId, taskId);

    res.status(200).json({
      success: true,
      message: "Task archived status toggled successfully",
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Toggle task status (TODO <-> DONE)
 * PATCH /api/tasks/:taskId/toggle-status
 */
export async function toggleStatus(
  req: Request<{ taskId: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get userId from authenticated request
    const userIdRaw = req.user?.sub ?? req.user?.id;
    const userId =
      typeof userIdRaw === "string" ? Number(userIdRaw) : userIdRaw;

    if (!userId || Number.isNaN(userId)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const taskId = Number(req.params.taskId);
    if (Number.isNaN(taskId)) {
      res.status(400).json({ message: "Invalid task ID" });
      return;
    }

    const task = await TaskService.toggleTaskStatus(userId, taskId);

    res.status(200).json({
      success: true,
      message: "Task status toggled successfully",
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a specific task by ID
 * GET /api/tasks/:taskId
 */
export async function getTask(
  req: Request<{ taskId: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get userId from authenticated request
    const userIdRaw = req.user?.sub ?? req.user?.id;
    const userId =
      typeof userIdRaw === "string" ? Number(userIdRaw) : userIdRaw;

    if (!userId || Number.isNaN(userId)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const taskId = Number(req.params.taskId);
    if (Number.isNaN(taskId)) {
      res.status(400).json({ message: "Invalid task ID" });
      return;
    }

    const task = await TaskService.getTaskById(userId, taskId);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (err) {
    next(err);
  }
}
