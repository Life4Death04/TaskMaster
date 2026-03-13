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

export type StatusEnum = z.infer<typeof statusEnum>;
export type PriorityEnum = z.infer<typeof priorityEnum>;
export type ThemeEnum = z.infer<typeof themeEnum>;
export type DateFormatEnum = z.infer<typeof dateFormatEnum>;
export type LanguageEnum = z.infer<typeof languageEnum>;
