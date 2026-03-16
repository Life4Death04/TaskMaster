import type { PaginationMeta } from "../types/response.types.js";

/**
 * Pagination Utility Functions
 * These functions help calculate pagination values and format responses
 */

/**
 * Calculate pagination metadata
 * 
 * @param total - Total number of items in the database
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Pagination metadata object with calculated values
 * 
 * Example:
 * calculatePaginationMeta(50, 2, 10)
 * Returns: { total: 50, page: 2, limit: 10, totalPages: 5, hasNextPage: true, hasPreviousPage: true }
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  // Calculate total pages (rounded up)
  // Example: 25 items with limit 10 = 3 pages (10, 10, 5)
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    // Has next page if current page is less than total pages
    hasNextPage: page < totalPages,
    // Has previous page if current page is greater than 1
    hasPreviousPage: page > 1,
  };
}

/**
 * Calculate the skip/offset for database queries
 * 
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Number of items to skip in the query
 * 
 * Example:
 * - Page 1, Limit 10: skip 0 (items 1-10)
 * - Page 2, Limit 10: skip 10 (items 11-20)
 * - Page 3, Limit 10: skip 20 (items 21-30)
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Validate and sanitize pagination parameters
 * Ensures page and limit are within acceptable ranges
 * 
 * @param page - Requested page number
 * @param limit - Requested items per page
 * @returns Validated and sanitized pagination parameters
 */
export function sanitizePagination(page: number, limit: number) {
  return {
    // Ensure page is at least 1
    page: Math.max(1, page),
    // Ensure limit is between 1 and 100
    limit: Math.min(100, Math.max(1, limit)),
  };
}
