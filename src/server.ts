import express, { type Application } from "express";
import { apiRoutes } from "./routes/index.js";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { generalLimiter } from "./config/rate-limit.js";
import { ZodError } from "zod";

import type {
  HealthCheckResponse,
  ApiNotFoundResponse,
  ApiValidationErrorResponse,
  ApiErrorResponse,
} from "./types/response.types.js";
import { AppError } from "./utils/errors.js";

// Initialize Express app
const app: Application = express();

/**
 * Security Middleware
 */
// Helmet helps secure Express apps by setting HTTP response headers
app.use(helmet());

// Rate limiting to prevent abuse
// Uses environment-aware configuration (generous in dev, strict in production)
app.use(generalLimiter);

/**
 * CORS Configuration
 */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

/**
 * Body Parser Middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health Check Route
 */
app.get("/health", (_req: express.Request, res: express.Response) => {
  const response: HealthCheckResponse = {
    status: "OK",
    message: "TaskMaster API is running",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  };
  res.json(response);
});

/**
 * API Routes
 * All routes are registered under /api prefix
 */
apiRoutes.forEach((router) => {
  app.use("/api", router);
});

/**
 * 404 Handler
 */
app.use((req: express.Request, res: express.Response) => {
  const response: ApiNotFoundResponse = {
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  };
  res.status(404).json(response);
});

/**
 * Global Error Handler
 */
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ): void => {
    // Zod validation errors → 400 Bad Request with field issues
    if (err instanceof ZodError) {
      const response: ApiValidationErrorResponse = {
        success: false,
        message: "Validation failed",
        errors: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      };
      res.status(400).json(response);
      return;
    }

    // Custom AppError instances → use their status code
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
      return;
    }

    // Generic errors → 500 Internal Server Error
    const error = err as Error;
    console.error("Error:", error);

    const response: ApiErrorResponse = {
      success: false,
      message:
        env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
      ...(env.NODE_ENV === "development" && { stack: error.stack }),
    };
    res.status(500).json(response);
  },
);

/**
 * Start Server
 */
const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🚀 TaskMaster API Server         ║
╠════════════════════════════════════════╣
║  Environment: ${env.NODE_ENV.padEnd(24)} s║
║  Port:        ${PORT.toString().padEnd(24)} ║
║  URL:         http://localhost:${PORT.toString().padEnd(7)} ║
╚════════════════════════════════════════╝
  `);
});

export default app;
