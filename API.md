# API Documentation - TaskMaster Backend

Complete API reference for the TaskMaster Backend REST API.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained through the `/api/auth/login` endpoint and are valid for 7 days by default.

---

## 📌 Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Rate Limit:** 10 requests per 15 minutes (production)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123",
  "profileImage": "https://example.com/avatar.jpg" // Optional
}
```

**Validation Rules:**
- `firstName`: Required, 2-50 characters
- `lastName`: Required, 2-50 characters
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters
- `profileImage`: Optional, valid URL

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "profileImage": "https://example.com/avatar.jpg",
    "phoneNumber": null,
    "createdAt": "2026-03-16T10:00:00.000Z",
    "emailVerified": false
  }
}
```

**Error Responses:**
- `400` - Validation error (invalid email, short password, etc.)
- `409` - Email already exists
- `429` - Too many registration attempts

---

### Login

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Rate Limit:** 10 requests per 15 minutes (production)

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Invalid credentials
- `429` - Too many login attempts

---

## 👤 User Endpoints

### Get Current User

Get the authenticated user's profile.

**Endpoint:** `GET /api/users/me`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "profileImage": "https://example.com/avatar.jpg",
    "phoneNumber": null,
    "createdAt": "2026-03-16T10:00:00.000Z",
    "emailVerified": false
  }
}
```

**Error Responses:**
- `401` - Unauthorized (invalid or missing token)
- `404` - User not found

---

### Update Current User

Update the authenticated user's profile.

**Endpoint:** `PUT /api/users/me`

**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "profileImage": "https://example.com/new-avatar.jpg"
}
```

**Notes:**
- All fields are optional
- Cannot update email or password through this endpoint

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.doe@example.com",
    "profileImage": "https://example.com/new-avatar.jpg"
  }
}
```

---

### Delete Account

Delete the authenticated user's account and all associated data.

**Endpoint:** `DELETE /api/users/me`

**Authentication:** Required

**Warning:** This action is permanent and will delete:
- User account
- All tasks
- All lists
- User settings

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## ✅ Task Endpoints

### Get All Tasks

Retrieve all tasks for the authenticated user with pagination.

**Endpoint:** `GET /api/tasks`

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (TODO, IN_PROGRESS, DONE)
- `priority` (optional): Filter by priority (LOW, MEDIUM, HIGH)
- `listId` (optional): Filter by list ID
- `archived` (optional): Include archived tasks (true/false)

**Example:**
```
GET /api/tasks?page=2&limit=20&status=TODO&priority=HIGH
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "taskName": "Complete project documentation",
        "description": "Write comprehensive API docs",
        "status": "TODO",
        "priority": "HIGH",
        "dueDate": "2026-03-20T00:00:00.000Z",
        "archived": false,
        "authorId": 1,
        "listId": 2
      }
    ],
    "pagination": {
      "total": 45,
      "page": 2,
      "limit": 20,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": true
    }
  }
}
```

---

### Create Task

Create a new task.

**Endpoint:** `POST /api/tasks`

**Authentication:** Required

**Request Body:**
```json
{
  "taskName": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2026-03-20T00:00:00.000Z",
  "listId": 2
}
```

**Validation Rules:**
- `taskName`: Required, 1-100 characters
- `description`: Optional, max 200 characters
- `status`: Required, one of: TODO, IN_PROGRESS, DONE
- `priority`: Required, one of: LOW, MEDIUM, HIGH
- `dueDate`: Optional, must be a valid ISO 8601 date
- `listId`: Optional, must be a valid list ID owned by the user

**Success Response (201):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": 1,
    "taskName": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2026-03-20T00:00:00.000Z",
    "archived": false,
    "authorId": 1,
    "listId": 2
  }
}
```

---

### Get Task by ID

Get details of a specific task.

**Endpoint:** `GET /api/tasks/:id`

**Authentication:** Required

**URL Parameters:**
- `id`: Task ID (integer)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "taskName": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2026-03-20T00:00:00.000Z",
    "archived": false,
    "authorId": 1,
    "listId": 2
  }
}
```

**Error Responses:**
- `404` - Task not found
- `403` - Task belongs to another user

---

### Update Task

Update an existing task.

**Endpoint:** `PUT /api/tasks/:id`

**Authentication:** Required

**URL Parameters:**
- `id`: Task ID (integer)

**Request Body:**
```json
{
  "taskName": "Updated task name",
  "status": "IN_PROGRESS",
  "priority": "MEDIUM"
}
```

**Notes:**
- All fields are optional
- Only provided fields will be updated
- Cannot change task ownership

**Success Response (200):**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": 1,
    "taskName": "Updated task name",
    "status": "IN_PROGRESS",
    "priority": "MEDIUM"
  }
}
```

---

### Delete Task

Delete a task permanently.

**Endpoint:** `DELETE /api/tasks/:id`

**Authentication:** Required

**URL Parameters:**
- `id`: Task ID (integer)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## 📋 List Endpoints

### Get All Lists

Retrieve all lists for the authenticated user.

**Endpoint:** `GET /api/lists`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Work Projects",
      "description": "All work-related tasks",
      "color": "#FF5733",
      "isFavorite": true,
      "authorId": 1,
      "createdAt": "2026-03-16T10:00:00.000Z"
    },
    {
      "id": 2,
      "title": "Personal",
      "description": "Personal tasks and errands",
      "color": "#3498DB",
      "isFavorite": false,
      "authorId": 1,
      "createdAt": "2026-03-15T10:00:00.000Z"
    }
  ]
}
```

---

### Create List

Create a new list.

**Endpoint:** `POST /api/lists`

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Work Projects",
  "description": "All work-related tasks",
  "color": "#FF5733",
  "isFavorite": true
}
```

**Validation Rules:**
- `title`: Required, 1-50 characters
- `description`: Optional, max 50 characters
- `color`: Optional, valid hex color code (default: #000000)
- `isFavorite`: Optional, boolean (default: false)

**Success Response (201):**
```json
{
  "success": true,
  "message": "List created successfully",
  "data": {
    "id": 1,
    "title": "Work Projects",
    "description": "All work-related tasks",
    "color": "#FF5733",
    "isFavorite": true,
    "authorId": 1,
    "createdAt": "2026-03-16T10:00:00.000Z"
  }
}
```

---

### Get List by ID

Get details of a specific list including its tasks.

**Endpoint:** `GET /api/lists/:id`

**Authentication:** Required

**URL Parameters:**
- `id`: List ID (integer)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Work Projects",
    "description": "All work-related tasks",
    "color": "#FF5733",
    "isFavorite": true,
    "authorId": 1,
    "createdAt": "2026-03-16T10:00:00.000Z",
    "tasks": [
      {
        "id": 1,
        "taskName": "Complete documentation",
        "status": "TODO",
        "priority": "HIGH"
      }
    ]
  }
}
```

---

### Update List

Update an existing list.

**Endpoint:** `PUT /api/lists/:id`

**Authentication:** Required

**URL Parameters:**
- `id`: List ID (integer)

**Request Body:**
```json
{
  "title": "Updated Work Projects",
  "isFavorite": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "List updated successfully",
  "data": {
    "id": 1,
    "title": "Updated Work Projects",
    "isFavorite": false
  }
}
```

---

### Delete List

Delete a list and optionally its tasks.

**Endpoint:** `DELETE /api/lists/:id`

**Authentication:** Required

**URL Parameters:**
- `id`: List ID (integer)

**Query Parameters:**
- `deleteTasks` (optional): If true, delete all tasks in the list (default: false)

**Example:**
```
DELETE /api/lists/1?deleteTasks=true
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "List deleted successfully"
}
```

**Note:** If `deleteTasks` is false, tasks in the list will have their `listId` set to null.

---

## ⚙️ Settings Endpoints

### Get User Settings

Get the authenticated user's settings.

**Endpoint:** `GET /api/settings`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "theme": "DARK",
    "dateFormat": "MM_DD_YYYY",
    "language": "EN",
    "defaultPriority": "MEDIUM",
    "defaultStatus": "TODO",
    "userId": 1
  }
}
```

---

### Update User Settings

Update the authenticated user's settings.

**Endpoint:** `PUT /api/settings`

**Authentication:** Required

**Request Body:**
```json
{
  "theme": "DARK",
  "dateFormat": "DD_MM_YYYY",
  "language": "ES",
  "defaultPriority": "HIGH",
  "defaultStatus": "TODO"
}
```

**Validation Rules:**
- `theme`: Optional, one of: LIGHT, DARK
- `dateFormat`: Optional, one of: MM_DD_YYYY, DD_MM_YYYY, YYYY_MM_DD
- `language`: Optional, one of: EN, ES
- `defaultPriority`: Optional, one of: LOW, MEDIUM, HIGH
- `defaultStatus`: Optional, one of: TODO, IN_PROGRESS, DONE

**Success Response (200):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "id": 1,
    "theme": "DARK",
    "dateFormat": "DD_MM_YYYY",
    "language": "ES",
    "defaultPriority": "HIGH",
    "defaultStatus": "TODO",
    "userId": 1
  }
}
```

---

## 🏥 Health Check

### Health Check

Check if the API is running.

**Endpoint:** `GET /health`

**Authentication:** Not required

**Success Response (200):**
```json
{
  "status": "OK",
  "message": "TaskMaster API is running",
  "timestamp": "2026-03-16T10:00:00.000Z",
  "environment": "development"
}
```

---

## ❌ Error Responses

### Standard Error Format

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE"
}
```

### Validation Error Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "path": "taskName",
      "message": "Task name is required"
    },
    {
      "path": "priority",
      "message": "Priority must be one of: LOW, MEDIUM, HIGH"
    }
  ]
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 🔐 Rate Limiting

Rate limits vary by environment and endpoint type:

### Production Environment

- **General API endpoints**: 500 requests per 15 minutes
- **Authentication endpoints** (`/auth/*`): 10 requests per 15 minutes
- **Resource creation**: 30 requests per minute

### Development Environment

- **General API endpoints**: 10,000 requests per 15 minutes
- **Authentication endpoints**: 1,000 requests per 15 minutes
- **Resource creation**: 1,000 requests per minute

### Rate Limit Headers

When rate limiting is active, responses include these headers:

```http
RateLimit-Limit: 500
RateLimit-Remaining: 487
RateLimit-Reset: 1742376000
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## 📝 Enumerations

### Task Status
- `TODO` - Task not started
- `IN_PROGRESS` - Task in progress
- `DONE` - Task completed

### Task Priority
- `LOW` - Low priority
- `MEDIUM` - Medium priority
- `HIGH` - High priority

### Theme
- `LIGHT` - Light theme
- `DARK` - Dark theme

### Date Format
- `MM_DD_YYYY` - 03/16/2026
- `DD_MM_YYYY` - 16/03/2026
- `YYYY_MM_DD` - 2026-03-16

### Language
- `EN` - English
- `ES` - Spanish

---

## 🔗 Related Documentation

- [Main README](./README.md) - Project overview and setup
- [Architecture Documentation](./ARCHITECTURE.md) - Technical architecture
- [Prisma Schema](./prisma/schema.prisma) - Database schema

---

**Last Updated:** March 16, 2026
