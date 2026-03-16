import { z } from "zod";

// Shared enums matching Prisma enums
export const statusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const themeEnum = z.enum(["LIGHT", "DARK"]);
export const dateFormatEnum = z.enum([
  "MM_DD_YYYY",
  "DD_MM_YYYY",
  "YYYY_MM_DD",
]);
export const languageEnum = z.enum(["EN", "ES"]);

// Common primitives
export const idSchema = z.number().int().positive();
// For URL params (which are always strings) - wraps as object for validation
export const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export const colorHexSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: "Invalid color hex code",
  });

// ISO date string (keep flexible, services can parse)
export const isoDateString = z.iso.datetime().or(z.string().min(1));

/**
 * Pagination Query Parameters Schema
 * - page: Which page to retrieve (default: 1)
 * - limit: How many items per page (default: 10, max: 100)
 * 
 * Example usage: GET /api/tasks?page=2&limit=20
 */
export const paginationQuerySchema = z.object({
  // .coerce converts string to number (query params are always strings)
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .catch(1), // If invalid, use 1
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100) // Prevent requesting too many items
    .default(10)
    .catch(10), // If invalid, use 10
});

export type StatusEnum = z.infer<typeof statusEnum>;
export type PriorityEnum = z.infer<typeof priorityEnum>;
export type ThemeEnum = z.infer<typeof themeEnum>;
export type DateFormatEnum = z.infer<typeof dateFormatEnum>;
export type LanguageEnum = z.infer<typeof languageEnum>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
