import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { auth } from "../middlewares/auth.js";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamsSchema,
} from "../schemas/task.schema.js";
import * as TaskController from "../controllers/task.controller.js";

const router = Router();

// All task routes are protected - require authentication

/**
 * GET /api/tasks
 * Fetch all tasks for authenticated user
 */
router.get("/tasks", auth, TaskController.fetchTasks);

/**
 * POST /api/tasks
 * Create a new task
 */
router.post(
  "/tasks",
  auth,
  validate({ body: createTaskSchema }),
  TaskController.createTask
);

/**
 * PATCH /api/tasks
 * Update an existing task
 */
router.patch(
  "/tasks",
  auth,
  validate({ body: updateTaskSchema }),
  TaskController.updateTask
);

/**
 * GET /api/tasks/:taskId
 * Get a specific task by ID
 */
router.get(
  "/tasks/:taskId",
  auth,
  validate({ params: taskIdParamsSchema }),
  TaskController.getTask
);

/**
 * DELETE /api/tasks/:taskId
 * Delete a task by ID
 */
router.delete(
  "/tasks/:taskId",
  auth,
  validate({ params: taskIdParamsSchema }),
  TaskController.deleteTask
);

/**
 * PATCH /api/tasks/:taskId/toggle-status
 * Toggle task status (TODO <-> DONE)
 */
router.patch(
  "/tasks/:taskId/toggle-status",
  auth,
  validate({ params: taskIdParamsSchema }),
  TaskController.toggleStatus
);

export default router;
