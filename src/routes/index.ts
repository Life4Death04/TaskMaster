import { type Router } from "express";
import userRouter from "./user.routes.js";
import taskRouter from "./task.routes.js";
import listRouter from "./list.routes.js";
import settingsRouter from "./settings.routes.js";

/**
 * Centralized Route Registration
 * Imports and combines all route modules into a single array
 */

export const apiRoutes: Router[] = [
  userRouter,
  taskRouter,
  listRouter,
  settingsRouter,
];
