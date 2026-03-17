import { z } from "zod";
import { idSchema, isoDateString, priorityEnum, statusEnum } from "./common.js";

// Task: create
export const createTaskSchema = z.object({
  taskName: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  status: statusEnum.default("TODO"),
  dueDate: isoDateString.optional().or(z.literal("")),
  priority: priorityEnum.default("LOW"),
  listId: idSchema.optional(),
});

// Task: update (partial but requires id from params, not body)
export const updateTaskSchema = z
  .object({
    id: idSchema, // Keep this because tasks send id in body, not URL param
    taskName: z.string().min(1).max(100).optional(),
    description: z.string().max(200).optional(),
    status: statusEnum.optional(),
    dueDate: isoDateString.optional().or(z.literal("")),
    priority: priorityEnum.optional(),
    listId: idSchema.optional(),
  })
  .refine((data) => Object.keys(data).some((k) => k !== "id"), {
    message: "At least one field besides id must be provided",
    path: ["id"],
  });

// Task: toggle status via params
export const taskIdParamsSchema = z.object({
  taskId: z.coerce.number().int().positive(),
});
export const toggleStatusBodySchema = z.object({ status: statusEnum });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
