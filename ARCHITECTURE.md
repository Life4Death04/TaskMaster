# Architecture Documentation - TaskMaster Backend

Comprehensive technical documentation for the TaskMaster Backend architecture, design patterns, and implementation details.

## 📐 Architecture Overview

TaskMaster Backend follows a **layered architecture** pattern with clear separation of concerns. This architecture promotes maintainability, testability, and scalability.

```
┌─────────────────────────────────────────────────────────┐
│                       Client Layer                       │
│              (Frontend, Mobile, etc.)                    │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────┐
│                   Middleware Layer                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   CORS   │ │  Helmet  │ │   Auth   │ │ Validate │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────┬───────────────────────────────────┘
┌─────────────────────▼───────────────────────────────────┐
│                    Routes Layer                          │
│         (API endpoint definitions)                       │
└─────────────────────┬───────────────────────────────────┘
┌─────────────────────▼───────────────────────────────────┐
│                 Controllers Layer                        │
│      (Request/Response handling)                         │
└─────────────────────┬───────────────────────────────────┘
┌─────────────────────▼───────────────────────────────────┐
│                  Services Layer                          │
│           (Business logic)                               │
└─────────────────────┬───────────────────────────────────┘
┌─────────────────────▼───────────────────────────────────┐
│              Data Access Layer                           │
│          (Prisma ORM)                                    │
└─────────────────────┬───────────────────────────────────┘
┌─────────────────────▼───────────────────────────────────┐
│                    Database                              │
│                   (MySQL)                                │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Design Principles

### 1. Separation of Concerns
Each layer has a single, well-defined responsibility:
- **Routes**: Define endpoints and apply middleware
- **Controllers**: Handle HTTP concerns (request/response)
- **Services**: Implement business logic
- **Database**: Data persistence

### 2. Dependency Injection
Services are injected into controllers, making testing easier and reducing coupling.

### 3. Type Safety
TypeScript and Prisma provide end-to-end type safety from database to API responses.

### 4. Error Handling
Centralized error handling with custom error classes.

### 5. Validation
Input validation at the entry point using Zod schemas.

## 📦 Layer Details

### 1. Middleware Layer

Located in: `src/middlewares/`

#### Authentication Middleware (`auth.ts`)

Verifies JWT tokens and attaches user information to the request.

```typescript
export function auth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded; // Attach user to request
    next();
  } catch (_err) {
    res.status(401).json({ message: "Invalid token" });
  }
}
```

**Features:**
- Extracts token from Authorization header
- Verifies token signature using JWT_SECRET
- Attaches decoded user data to request object
- Returns 401 for invalid/missing tokens

#### Validation Middleware (`validate.ts`)

Validates request data (body, query, params) against Zod schemas.

```typescript
export function validate(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validate body, query, and params
    // Return 400 with detailed errors if validation fails
    // Call next() if validation succeeds
  };
}
```

**Features:**
- Validates multiple parts of the request
- Returns detailed validation errors
- Type-safe validation using Zod
- Prevents invalid data from reaching controllers

### 2. Routes Layer

Located in: `src/routes/`

Routes define API endpoints and compose middleware pipelines.

#### Route Registration Pattern

```typescript
// src/routes/task.routes.ts
router.post(
  "/tasks",
  auth,                              // 1. Authentication
  validate({ body: createTaskSchema }), // 2. Validation
  TaskController.create              // 3. Controller
);
```

#### Centralized Route Management

```typescript
// src/routes/index.ts
export const apiRoutes: Router[] = [
  userRouter,
  taskRouter,
  listRouter,
  settingsRouter,
];

// All routes are registered in server.ts
apiRoutes.forEach((router) => {
  app.use("/api", router);
});
```

**Benefits:**
- Single source of truth for all routes
- Easy to add/remove route modules
- Consistent URL structure

### 3. Controllers Layer

Located in: `src/controllers/`

Controllers handle HTTP concerns and delegate business logic to services.

#### Controller Pattern

```typescript
export async function create(req: Request, res: Response): Promise<void> {
  try {
    // 1. Extract data from request
    const taskData = req.body;
    const userId = req.user!.id;
    
    // 2. Call service layer
    const task = await createTask(taskData, userId);
    
    // 3. Format and send response
    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    // 4. Errors are handled by global error handler
    throw error;
  }
}
```

**Responsibilities:**
- Extract data from requests
- Call appropriate service functions
- Format HTTP responses
- NOT responsible for business logic

### 4. Services Layer

Located in: `src/services/`

Services contain all business logic and database operations.

#### Service Pattern

```typescript
export async function createTask(
  taskData: CreateTaskInput,
  userId: number
): Promise<Task> {
  // 1. Validate business rules
  if (taskData.listId) {
    const list = await prisma.list.findFirst({
      where: { id: taskData.listId, authorId: userId },
    });
    
    if (!list) {
      throw new NotFoundError("List not found");
    }
  }
  
  // 2. Perform database operations
  const task = await prisma.task.create({
    data: {
      ...taskData,
      authorId: userId,
    },
  });
  
  // 3. Return result
  return task;
}
```

**Responsibilities:**
- Business logic validation
- Database operations (CRUD)
- Data transformations
- Throwing appropriate errors

**Design Decisions:**
- Pure functions (no side effects where possible)
- Each function has a single responsibility
- Functions are easily unit testable

### 5. Data Access Layer

The data access layer is handled by **Prisma ORM**.

#### Prisma Configuration

```typescript
// src/config/database.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});
```

#### Benefits of Prisma

1. **Type Safety**: Auto-generated types from schema
2. **Query Builder**: Type-safe query construction
3. **Migrations**: Version-controlled schema changes
4. **Relations**: Automatic relationship handling

#### Example Query

```typescript
const tasks = await prisma.task.findMany({
  where: {
    authorId: userId,
    status: "TODO",
  },
  include: {
    list: true, // Include related list
  },
  orderBy: {
    dueDate: "asc",
  },
});
```

## 🔐 Security Architecture

### 1. Authentication Flow

```
1. User registers → Password hashed with bcrypt → Stored in DB
2. User logs in → Password verified → JWT token generated
3. Protected request → Token verified → User ID extracted
4. Service checks → User owns resource → Operation performed
```

### 2. Password Security

```typescript
// Registration
const hashedPassword = await bcrypt.hash(password, 10);

// Login
const isValid = await bcrypt.compare(password, user.password);
```

- Passwords hashed with bcrypt (10 rounds)
- Never stored or transmitted in plain text
- Password strength enforced (min 8 characters)

### 3. JWT Tokens

```typescript
const token = jwt.sign(
  { 
    id: user.id, 
    email: user.email 
  },
  env.JWT_SECRET,
  { 
    expiresIn: env.JWT_EXPIRES_IN // Default: 7 days
  }
);
```

**Security Features:**
- Signed with strong secret key (min 32 characters)
- Short expiration time (configurable)
- Payload contains minimal data (id, email)

### 4. Rate Limiting Strategy

Environment-aware rate limiting prevents abuse:

```typescript
// Development: Very permissive
max: env.NODE_ENV === "production" ? 500 : 10000

// Authentication: Extra strict
max: env.NODE_ENV === "production" ? 10 : 1000
```

**Protection Against:**
- Brute force attacks (auth endpoints)
- DDoS attacks (general API)
- Resource exhaustion

### 5. Additional Security Measures

- **Helmet**: Sets secure HTTP headers
- **CORS**: Restricts cross-origin requests
- **Input Validation**: Zod schema validation
- **SQL Injection**: Prevented by Prisma's parameterized queries

## 📊 Data Flow Examples

### Example 1: Creating a Task

```
1. POST /api/tasks
   Body: { taskName: "Test", status: "TODO", priority: "HIGH" }
   Header: Authorization: Bearer <token>

2. Middleware Pipeline:
   ├─ Rate Limiter: Check request count
   ├─ Auth: Verify token, extract userId
   └─ Validate: Check taskName, status, priority

3. Controller (task.controller.ts):
   ├─ Extract req.body and req.user.id
   ├─ Call TaskService.createTask(body, userId)
   └─ Format response

4. Service (task.service.ts):
   ├─ Validate business rules (listId exists?)
   ├─ Call prisma.task.create()
   └─ Return created task

5. Database:
   ├─ Insert task record
   └─ Return created record with ID

6. Response:
   └─ 201 Created with task data
```

### Example 2: Error Handling

```
1. POST /api/tasks
   Body: { taskName: "", status: "INVALID" }

2. Validate Middleware:
   ├─ taskName validation fails (required)
   ├─ status validation fails (invalid enum)
   └─ Throws ZodError

3. Global Error Handler:
   ├─ Catches ZodError
   ├─ Formats validation errors
   └─ Returns 400 with error details

4. Response:
   {
     "success": false,
     "message": "Validation failed",
     "errors": [
       { "path": "taskName", "message": "Task name is required" },
       { "path": "status", "message": "Invalid status value" }
     ]
   }
```

## 🧪 Testing Architecture

### Test Organization

```
tests/
├── unit/           # Isolated unit tests
│   ├── services/   # Service layer tests
│   ├── schemas/    # Validation schema tests
│   └── middlewares/ # Middleware tests
├── integration/    # API endpoint tests
│   └── routes/     # Route integration tests
└── e2e/           # End-to-end workflows
    └── workflows/  # Multi-step user scenarios
```

### Testing Strategy

#### 1. Unit Tests

Test individual functions in isolation.

```typescript
describe("TaskService.createTask", () => {
  it("should create a task successfully", async () => {
    const taskData = { taskName: "Test", status: "TODO" };
    const task = await createTask(taskData, userId);
    
    expect(task).toBeDefined();
    expect(task.taskName).toBe("Test");
  });
  
  it("should throw error for invalid list", async () => {
    const taskData = { listId: 999 };
    
    await expect(
      createTask(taskData, userId)
    ).rejects.toThrow(NotFoundError);
  });
});
```

#### 2. Integration Tests

Test API endpoints with real database.

```typescript
describe("POST /api/tasks", () => {
  it("should create task with valid data", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ taskName: "Test", status: "TODO" });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

#### 3. E2E Tests

Test complete user workflows.

```typescript
describe("User Task Workflow", () => {
  it("should register, login, create task, update, delete", async () => {
    // 1. Register
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(userData);
    
    // 2. Login
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send(credentials);
    
    const token = loginRes.body.data.token;
    
    // 3. Create task
    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send(taskData);
    
    // ... continue workflow
  });
});
```

### Test Database

```typescript
// tests/setup.ts
beforeAll(async () => {
  // Set up test database
  await prisma.$connect();
});

afterEach(async () => {
  // Clean up after each test
  await prisma.task.deleteMany();
  await prisma.list.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

## 🔧 Configuration Management

### Environment Variables

```typescript
// src/config/env.ts
const envSchema = z.object({
  PORT: z.string().default("3000").transform(Number),
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

export const env = envSchema.parse(process.env);
```

**Benefits:**
- Type-safe configuration
- Validation at startup
- Clear error messages for missing vars
- Default values for optional configs

### Rate Limiting Configuration

```typescript
// src/config/rate-limit.ts
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 500 : 10000,
  skip: () => env.NODE_ENV === "test",
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 10 : 1000,
  skip: () => env.NODE_ENV === "test",
});
```

**Features:**
- Environment-aware limits
- Different limits for different endpoints
- Disabled in test environment

## 📐 Database Schema Design

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
├─────────────┤
│ id          │◄──┐
│ firstName   │   │
│ lastName    │   │
│ email       │   │
│ password    │   │
└─────────────┘   │
       │          │
       │ 1:N      │ N:1
       │          │
┌──────▼──────┐   │
│    Task     │   │
├─────────────┤   │
│ id          │   │
│ taskName    │   │
│ status      │   │
│ priority    │   │
│ authorId    │───┘
│ listId      │───┐
└─────────────┘   │
                  │ N:1
┌─────────────┐   │
│    List     │◄──┘
├─────────────┤
│ id          │
│ title       │
│ color       │
│ isFavorite  │
│ authorId    │───┐
└─────────────┘   │
                  │ N:1
┌─────────────┐   │
│UserSettings │   │
├─────────────┤   │
│ id          │   │
│ theme       │   │
│ language    │   │
│ userId      │───┘
└─────────────┘
```

### Schema Decisions

1. **User-Task Relationship**: One-to-Many
   - Each user can have multiple tasks
   - Each task belongs to one user
   - Enforced by `authorId` foreign key

2. **List-Task Relationship**: One-to-Many (Optional)
   - Tasks can exist without a list (`listId` nullable)
   - Lists can contain multiple tasks
   - Deleting a list doesn't automatically delete tasks

3. **User-Settings**: One-to-One
   - Each user has exactly one settings record
   - Settings are created on user registration
   - Enforced by unique constraint on `userId`

4. **Timestamps**
   - `createdAt` auto-set on record creation
   - No `updatedAt` (can be added if needed)

## 🚀 Performance Considerations

### 1. Database Indexing

Primary indexes on:
- User email (unique index)
- Task authorId (foreign key index)
- List authorId (foreign key index)

### 2. Pagination

```typescript
export async function fetchUserTasksPaginated(
  userId: number,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;
  
  const tasks = await prisma.task.findMany({
    where: { authorId: userId },
    skip,
    take: limit,
  });
  
  return tasks;
}
```

**Benefits:**
- Reduces memory usage
- Improves response times
- Scalable for large datasets

### 3. Connection Pooling

Prisma automatically handles connection pooling to the database.

### 4. Query Optimization

- Select only needed fields
- Use `include` for related data (prevents N+1 queries)
- Avoid unnecessary database calls

## 🐛 Error Handling Strategy

### Custom Error Classes

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public errorCode?: string
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401, "UNAUTHORIZED");
  }
}
```

### Global Error Handler

```typescript
app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    // Validation errors
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatZodErrors(err),
    });
  }
  
  if (err instanceof AppError) {
    // Application errors
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
    });
  }
  
  // Unexpected errors
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});
```

## 🔄 Development Workflow

### 1. Adding a New Feature

```bash
# 1. Update database schema
# Edit prisma/schema.prisma

# 2. Create migration
npm run prisma:migrate

# 3. Create/update schemas
# Add Zod validation in src/schemas/

# 4. Create/update services
# Add business logic in src/services/

# 5. Create/update controllers
# Add HTTP handlers in src/controllers/

# 6. Create/update routes
# Define endpoints in src/routes/

# 7. Write tests
# Add tests in tests/ directory

# 8. Run tests
npm test

# 9. Test manually
npm run dev
```

### 2. Database Changes

```bash
# Create a new migration
npm run prisma:migrate

# Reset database (caution: deletes all data)
npx prisma migrate reset

# View database in GUI
npm run prisma:studio
```

## 📝 Code Conventions

### Naming Conventions

- **Files**: kebab-case (`task.service.ts`)
- **Functions**: camelCase (`createTask()`)
- **Types/Interfaces**: PascalCase (`Task`, `CreateTaskInput`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)

### Import Order

```typescript
// 1. External packages
import express from "express";
import { z } from "zod";

// 2. Internal modules
import { auth } from "../middlewares/auth.js";
import { TaskService } from "../services/task.service.js";

// 3. Types
import type { Task } from "@prisma/client";
```

### Function Documentation

```typescript
/**
 * Fetch tasks for a specific user with pagination
 * 
 * @param userId - The ID of the user
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Object containing tasks array and pagination metadata
 */
export async function fetchUserTasksPaginated(
  userId: number,
  page: number,
  limit: number
): Promise<PaginatedTasks> {
  // Implementation
}
```

## 🔗 Related Documentation

- [Main README](./README.md) - Setup and getting started
- [API Documentation](./API.md) - Complete API reference
- [Prisma Schema](./prisma/schema.prisma) - Database schema

---

**Last Updated:** March 16, 2026
