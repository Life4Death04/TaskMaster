# TaskMaster Backend API

A modern, type-safe RESTful API for task management built with TypeScript, Express, and Prisma.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Rate Limiting](#rate-limiting)
- [Architecture](#architecture)

## 🎯 Overview

TaskMaster Backend is a production-ready REST API that powers the TaskMaster task management application. It provides secure authentication, CRUD operations for tasks and lists, user settings management, and comprehensive data validation.

## 🛠️ Tech Stack

### Core Technologies

- **Runtime**: Node.js
- **Language**: TypeScript 5.9+
- **Framework**: Express 5.2
- **Database**: MySQL
- **ORM**: Prisma 6.19

### Security & Middleware

- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Security Headers**: Helmet
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: express-rate-limit (environment-aware)

### Validation & Type Safety

- **Schema Validation**: Zod 4.1
- **Type Generation**: Prisma Client
- **Environment Validation**: Zod schemas

### Development & Testing

- **Test Framework**: Vitest 4.1
- **API Testing**: Supertest 7.2
- **Test UI**: @vitest/ui
- **Dev Server**: tsx (watch mode)
- **Code Coverage**: Vitest coverage

## ✨ Features

### Core Functionality

- ✅ **User Management**
  - Registration with email verification support
  - Login with JWT authentication
  - Profile management (view, update, delete)
  - Password hashing with bcrypt

- ✅ **Task Management**
  - Create, read, update, delete tasks
  - Task priorities (LOW, MEDIUM, HIGH)
  - Task statuses (TODO, IN_PROGRESS, DONE)
  - Due dates and descriptions
  - Task archiving
  - Pagination support

- ✅ **List Management**
  - Create custom lists
  - Color-coded lists
  - List descriptions and icons
  - Favorite lists
  - Associate tasks with lists

- ✅ **User Settings**
  - Theme preferences (LIGHT, DARK)
  - Date format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
  - Language selection (EN, ES)
  - Default task priority and status

### Security Features

- 🔒 JWT-based authentication
- 🔒 Password encryption
- 🔒 CORS protection
- 🔒 Helmet security headers
- 🔒 Environment-aware rate limiting
- 🔒 Input validation and sanitization

### Developer Experience

- 📝 Full TypeScript support
- 📝 Comprehensive test suite (unit, integration, e2e)
- 📝 Type-safe database queries
- 📝 Hot reload in development
- 📝 Detailed error handling

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL 8+
- npm or yarn

### Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd TaskMaster-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development
   
   # Database
   DATABASE_URL="mysql://user:password@localhost:3306/taskmaster"
   
   # JWT
   JWT_SECRET="your-secret-key-min-32-characters-long"
   JWT_EXPIRES_IN="7d"
   
   # CORS
   CORS_ORIGIN="http://localhost:5173"
   ```

4. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build           # Compile TypeScript to JavaScript

# Production
npm start               # Run compiled production server

# Testing
npm test                # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:ui         # Open Vitest UI
npm run test:coverage   # Generate coverage report

# Database
npm run prisma:generate # Generate Prisma Client
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio (database GUI)
```

## 📁 Project Structure

```
TaskMaster-Backend/
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Database migration history
├── src/
│   ├── config/
│   │   ├── database.ts           # Prisma client setup
│   │   ├── env.ts                # Environment validation
│   │   └── rate-limit.ts         # Rate limiting configuration
│   ├── controllers/              # Route handlers
│   │   ├── list.controller.ts
│   │   ├── settings.controller.ts
│   │   ├── task.controller.ts
│   │   └── user.controller.ts
│   ├── middlewares/              # Express middleware
│   │   ├── auth.ts               # JWT authentication
│   │   └── validate.ts           # Request validation
│   ├── routes/                   # API route definitions
│   │   ├── index.ts              # Route aggregator
│   │   ├── list.routes.ts
│   │   ├── settings.routes.ts
│   │   ├── task.routes.ts
│   │   └── user.routes.ts
│   ├── schemas/                  # Zod validation schemas
│   │   ├── common.ts
│   │   ├── list.schema.ts
│   │   ├── settings.schema.ts
│   │   ├── task.schema.ts
│   │   └── user.schema.ts
│   ├── services/                 # Business logic layer
│   │   ├── list.service.ts
│   │   ├── settings.service.ts
│   │   ├── task.service.ts
│   │   └── user.service.ts
│   ├── types/                    # TypeScript type definitions
│   │   ├── index.ts
│   │   └── response.types.ts
│   ├── utils/                    # Helper functions
│   │   ├── errors.ts             # Custom error classes
│   │   └── pagination.ts         # Pagination utilities
│   ├── server.ts                 # Express app setup
│   └── test-db.ts                # Test database utilities
└── tests/
    ├── setup.ts                  # Test environment setup
    ├── helpers/                  # Test utility functions
    ├── unit/                     # Unit tests
    ├── integration/              # Integration tests
    └── e2e/                      # End-to-end tests
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

Most endpoints require a JWT token. Include it in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token

#### Users
- `GET /api/users/me` - Get current user profile (protected)
- `PUT /api/users/me` - Update current user (protected)
- `DELETE /api/users/me` - Delete account (protected)

#### Tasks
- `GET /api/tasks` - Get all user tasks (paginated, protected)
- `POST /api/tasks` - Create new task (protected)
- `GET /api/tasks/:id` - Get specific task (protected)
- `PUT /api/tasks/:id` - Update task (protected)
- `DELETE /api/tasks/:id` - Delete task (protected)

#### Lists
- `GET /api/lists` - Get all user lists (protected)
- `POST /api/lists` - Create new list (protected)
- `GET /api/lists/:id` - Get specific list (protected)
- `PUT /api/lists/:id` - Update list (protected)
- `DELETE /api/lists/:id` - Delete list (protected)

#### Settings
- `GET /api/settings` - Get user settings (protected)
- `PUT /api/settings` - Update settings (protected)

### Response Format

All responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE"
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "path": "field.name",
      "message": "Error description"
    }
  ]
}
```

## 🧪 Testing

The project includes a comprehensive test suite covering unit, integration, and end-to-end tests.

### Test Structure

```
tests/
├── unit/              # Unit tests (services, schemas, middleware)
├── integration/       # API route integration tests
└── e2e/              # End-to-end workflow tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/services/task.service.test.ts

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Coverage

The test suite covers:
- ✅ All service layer functions
- ✅ All API routes
- ✅ Request validation schemas
- ✅ Authentication middleware
- ✅ Complex user workflows
- ✅ Multi-user isolation

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment (development/production/test) |
| `DATABASE_URL` | Yes | - | MySQL connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiration time |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |

## 🚦 Rate Limiting

The API implements intelligent rate limiting that adapts to the environment:

### Development Mode
- **General API**: 10,000 requests per 15 minutes
- **Authentication**: 1,000 attempts per 15 minutes
- **Resource Creation**: 1,000 requests per minute

### Production Mode
- **General API**: 500 requests per 15 minutes
- **Authentication**: 10 attempts per 15 minutes (prevents brute force)
- **Resource Creation**: 30 requests per minute

### Test Mode
- **All endpoints**: No rate limiting

Rate limiting is automatically applied based on the `NODE_ENV` environment variable. In development, limits are set high to prevent blocking during testing and debugging.

## 🏗️ Architecture

### Layered Architecture

The application follows a clean, layered architecture:

```
Request Flow:
Client → Routes → Middleware → Controllers → Services → Database
                     ↓
              Validation (Zod)
              Authentication (JWT)
              Rate Limiting
```

### Layer Responsibilities

1. **Routes** (`src/routes/`)
   - Define API endpoints
   - Apply middleware
   - Route to appropriate controllers

2. **Middleware** (`src/middlewares/`)
   - Request validation (Zod schemas)
   - Authentication (JWT verification)
   - Request preprocessing

3. **Controllers** (`src/controllers/`)
   - Handle HTTP requests/responses
   - Extract request data
   - Call service layer
   - Format responses

4. **Services** (`src/services/`)
   - Business logic
   - Database operations (Prisma)
   - Data transformations
   - Error handling

5. **Database** (`prisma/`)
   - Schema definitions
   - Migrations
   - Type generation

### Key Design Patterns

- **Dependency Injection**: Services are injected into controllers
- **Factory Pattern**: Test factories for creating test data
- **Repository Pattern**: Prisma acts as repository layer
- **Middleware Pipeline**: Express middleware chain
- **Error Handling**: Centralized error handler

### Data Flow Example

```typescript
// 1. Request arrives at route
POST /api/tasks

// 2. Middleware runs
auth() → validate() → controller

// 3. Controller extracts data
const taskData = req.body;
const userId = req.user.id;

// 4. Service handles business logic
const task = await createTask(taskData, userId);

// 5. Response sent to client
res.json({ success: true, data: task });
```

## 📝 Database Schema

### Core Models

- **User**: User accounts and authentication
- **Task**: Individual tasks with status, priority, due dates
- **List**: Task organization into lists
- **UserSettings**: User preferences and defaults

### Relationships

- User → Tasks (One-to-Many)
- User → Lists (One-to-Many)
- User → Settings (One-to-One)
- List → Tasks (One-to-Many)

See `prisma/schema.prisma` for the complete database schema.

## 🤝 Contributing

When contributing to this project:

1. Follow the existing code structure
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting
5. Follow TypeScript best practices

## 📄 License

ISC

---

**Built with ❤️ using TypeScript, Express, and Prisma**
