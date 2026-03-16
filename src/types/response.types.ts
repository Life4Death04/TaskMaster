/**
 * Standardized API Response Types
 * Ensures type safety and consistency across all API responses
 */

/**
 * Generic success response with data
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Pagination Metadata
 * Contains information about the current page and available pages
 */
export interface PaginationMeta {
  total: number; // Total number of items in database
  page: number; // Current page number
  limit: number; // Items per page
  totalPages: number; // Total number of pages (calculated)
  hasNextPage: boolean; // Whether there's a next page available
  hasPreviousPage: boolean; // Whether there's a previous page available
}

/**
 * Paginated Response
 * Used when returning a list of items with pagination
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[]; // Array of items for current page
  pagination: PaginationMeta; // Pagination metadata
  message?: string;
}

/**
 * Generic error response
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    path: string;
    message: string;
  }>;
  stack?: string; // Only in development
}

/**
 * Validation error response (for Zod errors)
 */
export interface ApiValidationErrorResponse {
  success: false;
  message: "Validation failed";
  errors: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * 404 Not Found response
 */
export interface ApiNotFoundResponse {
  success: false;
  message: "Route not found";
  path: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: "OK" | "ERROR";
  message: string;
  timestamp: string;
  environment: string;
}

/**
 * Union type of all possible API responses
 */
export type ApiResponse<T = unknown> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse
  | ApiValidationErrorResponse
  | ApiNotFoundResponse;
