/**
 * Custom TypeScript Types and Interfaces
 * These extend Prisma-generated types with API-specific structures
 */

import type {
  User,
  Task,
  List,
  UserSettings,
  Priority,
  Status,
  Theme,
  DateFormat,
  Language,
} from "@prisma/client";

/**
 * Re-export Prisma enums for convenience
 */
export { Priority, Status, Theme, DateFormat, Language };

/**
 * User Types
 */

// Safe user type (without password) for API responses
export type SafeUser = Omit<User, "password">;

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profileImage?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: SafeUser;
}

/**
 * Task Types
 */

export interface CreateTaskRequest {
  taskName: string;
  description?: string;
  status?: Status;
  dueDate?: Date | string;
  priority?: Priority;
  authorId: number;
  listId?: number;
}

export interface UpdateTaskRequest {
  id: number;
  taskName?: string;
  description?: string;
  status?: Status;
  dueDate?: Date | string;
  priority?: Priority;
  listId?: number;
}

export interface TaskResponse {
  success: boolean;
  message: string;
  task: Task;
}

export interface TasksResponse {
  success: boolean;
  tasks: Task[];
}

/**
 * List Types
 */

export interface CreateListRequest {
  title: string;
  description?: string;
  color?: string;
  authorId: number;
}

export interface UpdateListRequest {
  id: number;
  title?: string;
  description?: string;
  color?: string;
}

export interface ListResponse {
  success: boolean;
  message: string;
  list: List;
}

export interface ListsResponse {
  success: boolean;
  lists: List[];
}

// List with tasks included
export type ListWithTasks = List & {
  tasks: Task[];
};

/**
 * Settings Types
 */

export interface UpdateSettingsRequest {
  theme?: Theme;
  dateFormat?: DateFormat;
  language?: Language;
  defaultPriority?: Priority;
  defaultStatus?: Status;
}

export interface SettingsResponse {
  success: boolean;
  message: string;
  settings: UserSettings;
}

/**
 * Generic API Response Types
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

/**
 * JWT Payload Type
 */

export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Pagination Types
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
